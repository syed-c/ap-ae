import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define static pages with their SEO metadata
const STATIC_PAGES = [
  { slug: "about", title: "About Us", description: "Learn about AppointPanda - UAE's leading dental directory connecting patients with trusted dentists." },
  { slug: "contact", title: "Contact Us", description: "Get in touch with AppointPanda. We're here to help you find the perfect dentist in UAE." },
  { slug: "faq", title: "Frequently Asked Questions", description: "Find answers to common questions about finding dentists, booking appointments, and using AppointPanda." },
  { slug: "privacy", title: "Privacy Policy", description: "Read AppointPanda's privacy policy. Learn how we protect your personal information." },
  { slug: "terms", title: "Terms of Service", description: "Read AppointPanda's terms of service and conditions for using our platform." },
  { slug: "how-it-works", title: "How It Works", description: "Learn how AppointPanda helps you find and book appointments with top dentists in UAE." },
  { slug: "pricing", title: "Pricing", description: "View AppointPanda's pricing plans for dental clinics and healthcare providers." },
  { slug: "editorial-policy", title: "Editorial Policy", description: "Learn about AppointPanda's editorial standards and content guidelines." },
  { slug: "medical-review-policy", title: "Medical Review Policy", description: "Understand how AppointPanda ensures medical accuracy in our dental health content." },
  { slug: "verification-policy", title: "Verification Policy", description: "Learn how AppointPanda verifies dentist credentials and clinic information." },
  { slug: "claim-profile", title: "Claim Your Profile", description: "Are you a dentist? Claim your profile on AppointPanda to manage your online presence." },
  { slug: "emergency-dentist", title: "Emergency Dentist", description: "Find emergency dental care in UAE. Get immediate help for dental emergencies 24/7." },
  { slug: "find-dentist", title: "Find a Dentist", description: "Search for dentists near you in UAE. Filter by location, specialty, and services." },
  { slug: "ai-search", title: "AI-Powered Dentist Search", description: "Use our AI-powered search to find the perfect dentist based on your specific needs." },
  { slug: "blog", title: "Dental Health Blog", description: "Read expert dental health articles, tips, and guides from AppointPanda." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
      pages: [] as string[],
    };

    for (const page of STATIC_PAGES) {
      try {
        const { error } = await supabaseAdmin
          .from("seo_pages")
          .upsert({
            slug: page.slug,
            page_type: "static",
            title: page.title,
            meta_title: `${page.title} | AppointPanda - UAE's Dental Directory`,
            meta_description: page.description,
            h1: page.title,
            canonical_url: `/${page.slug}`,
            is_indexed: true,
            is_thin_content: true,
            needs_optimization: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "slug" });

        if (error) {
          results.errors.push(`${page.slug}: ${error.message}`);
        } else {
          results.created++;
          results.pages.push(page.slug);
        }
      } catch (e) {
        results.errors.push(`${page.slug}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created/updated ${results.created} static pages`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
