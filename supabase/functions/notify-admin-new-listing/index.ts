import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBranding, wrapEmailContent, getFromAddress } from "../_shared/branding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewListingNotificationRequest {
  leadId?: string;
  clinicName: string;
  dentistName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  services: string[];
  website?: string;
  description?: string;
}

async function getAdminEmails(supabase: any): Promise<string[]> {
  const adminEmails: string[] = [];
  
  // Fetch admin emails from global_settings
  const { data: contactData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'contact_details')
    .maybeSingle();

  if (contactData?.value) {
    const contact = contactData.value as any;
    if (contact.support_email) adminEmails.push(contact.support_email);
    if (contact.sales_email) adminEmails.push(contact.sales_email);
  }

  // Also fetch super admin users
  const { data: superAdmins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');

  if (superAdmins && superAdmins.length > 0) {
    const userIds = superAdmins.map((u: any) => u.user_id);
    const { data: users } = await supabase
      .from('profiles')
      .select('email')
      .in('id', userIds);
    
    if (users) {
      for (const user of users) {
        if (user.email && !adminEmails.includes(user.email)) {
          adminEmails.push(user.email);
        }
      }
    }
  }

  // Fallback if no admin emails found
  if (adminEmails.length === 0) {
    adminEmails.push('support@AppointPanda.ae');
  }

  return adminEmails;
}

function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clinicName,
      dentistName,
      email,
      phone,
      city,
      state,
      services,
      website,
      description,
    }: NewListingNotificationRequest = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping admin notification email");
      return new Response(JSON.stringify({ success: true, message: "Email skipped - no API key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get branding from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const branding = await getBranding(supabase);

    // Get admin emails
    const adminEmails = await getAdminEmails(supabase);
    
    if (adminEmails.length === 0) {
      console.log("No admin emails found, skipping notification");
      return new Response(JSON.stringify({ success: true, message: "No admin emails configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate email body content
    const servicesList = services && services.length > 0 
      ? services.map((s: string) => `<li style="margin: 4px 0;">${s}</li>`).join('')
      : '<li>General dental services</li>';

    const bodyContent = `
      <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px; font-weight: 600;">
        New Practice Listing Request
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
        A new dental practice has submitted a listing request. Please review and approve/reject in the admin dashboard.
      </p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px;">
            <h3 style="margin: 0 0 16px; color: #92400e; font-size: 18px;">Practice Details</h3>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Clinic Name:</strong> ${clinicName}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Dentist Name:</strong> ${dentistName}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Location:</strong> ${city}${state ? ', ' + state : ''}</p>
            <p style="margin: 0 0 8px; color: #374151;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; color: #374151;"><strong>Phone:</strong> ${phone}</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px;">
            <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">Services Offered</h3>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
              ${servicesList}
            </ul>
          </td>
        </tr>
      </table>
      
      ${website ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background-color: #f8fafc; border-radius: 12px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Website</p>
            <a href="${website}" style="color: #0d9488; font-size: 14px;">${website}</a>
          </td>
        </tr>
      </table>
      ` : ''}
      
      ${description ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background-color: #f8fafc; border-radius: 12px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">About</p>
            <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${description}</p>
          </td>
        </tr>
      </table>
      ` : ''}
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
        <tr>
          <td align="center">
            <a href="${branding.siteUrl}/admin?tab=leads" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Review in Admin Dashboard
            </a>
          </td>
        </tr>
      </table>
      
      <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0; text-align: center;">
        Submitted on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    `;

    const emailHtml = wrapEmailContent(branding, '📋 New Practice Listing Request', '📋', bodyContent);
    const minifiedHtml = minifyHtml(emailHtml);

    // Send email to all admin emails using Resend API
    const sendResults = [];
    for (const adminEmail of adminEmails) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: getFromAddress(branding),
          to: adminEmail,
          subject: `📋 New Listing Request: ${clinicName} - ${branding.siteName}`,
          html: minifiedHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error(`Failed to send email to ${adminEmail}:`, errorText);
        sendResults.push({ email: adminEmail, success: false, error: errorText });
      } else {
        const result = await emailResponse.json();
        console.log(`Admin notification email sent to ${adminEmail}:`, result);
        sendResults.push({ email: adminEmail, success: true, data: result });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notification sent to ${adminEmails.length} admin(s)`,
      recipients: adminEmails,
      results: sendResults 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
