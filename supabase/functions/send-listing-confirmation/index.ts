import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed sender email (must match your Resend registered email)
const ALLOWED_SENDER_EMAIL = "adilahmadip@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { clinicName, dentistName, email, phone } = body;

    if (!email || !clinicName) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, error: "No API key configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 AppointPanda</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1e293b; margin-top: 0;">Dear ${dentistName || 'Doctor'},</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for submitting your practice listing request for <strong>${clinicName}</strong>. 
            We're excited to have you join AppointPanda!
          </p>
          
          <div style="background: #f0fdfa; border: 2px solid #99f6e4; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #0d9488; margin-top: 0;">What happens next?</h3>
            <ol style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;">
              <li>Our team will review your submission within 24-48 hours</li>
              <li>We may contact you at <strong>${phone || email}</strong> for verification</li>
              <li>Once approved, you'll receive an email with your login credentials</li>
              <li>Your profile will go live and patients can start booking</li>
            </ol>
          </div>
          
          <p style="color: #475569; font-size: 14px;">
            If you have any questions, contact our support team at support@AppointPanda.ae
          </p>
          
          <p style="color: #475569; font-size: 14px;">
            Best regards,<br>
            <strong>The AppointPanda Team</strong>
          </p>
        </div>
        <div style="background: #1e293b; padding: 20px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} AppointPanda. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Try sending the email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ALLOWED_SENDER_EMAIL,
        to: email,
        subject: "Your Practice Listing Request Received - AppointPanda",
        html: html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // If it's the trial key restriction, return helpful message
      if (result.name === "validation_error") {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Email could not be sent. ${result.message}`,
            trialMode: true 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: "Email failed", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
