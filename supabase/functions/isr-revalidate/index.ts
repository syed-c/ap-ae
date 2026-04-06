import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVALIDATION_API = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://www.appointpanda.ae";
const REVALIDATION_SECRET = Deno.env.get("REVALIDATION_SECRET");

serve(async (req) => {
  try {
    // Only allow POST requests from Supabase (database webhooks)
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify authorization header from Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    console.log(`[ISR Revalidation] ${type} on ${table}:`, record?.slug || record?.id);

    const revalidatePaths: string[] = [];
    const revalidateTags: string[] = [];

    // Determine which pages to revalidate based on the table that changed
    switch (table) {
      case "clinics":
        revalidateTags.push("clinics");
        if (record?.slug) {
          revalidatePaths.push(`/clinic/${record.slug}/`);
        }
        if (old_record?.slug && old_record.slug !== record?.slug) {
          revalidatePaths.push(`/clinic/${old_record.slug}/`);
        }
        // Revalidate related city page
        if (record?.city_id) {
          const { data: city } = await supabase
            .from("cities")
            .select("slug, state:states(slug)")
            .eq("id", record.city_id)
            .single();
          if (city) {
            revalidatePaths.push(`/${city.state?.slug}/${city.slug}/`);
          }
        }
        break;

      case "dentists":
        revalidateTags.push("dentists");
        if (record?.slug) {
          revalidatePaths.push(`/dentist/${record.slug}/`);
        }
        if (old_record?.slug && old_record.slug !== record?.slug) {
          revalidatePaths.push(`/dentist/${old_record.slug}/`);
        }
        break;

      case "blog_posts":
        revalidateTags.push("blog");
        if (record?.slug) {
          revalidatePaths.push(`/blog/${record.slug}/`);
        }
        if (old_record?.slug && old_record.slug !== record?.slug) {
          revalidatePaths.push(`/blog/${old_record.slug}/`);
        }
        // Always revalidate blog listing page
        revalidatePaths.push("/blog/");
        break;

      case "treatments":
        revalidateTags.push("treatments");
        if (record?.slug) {
          revalidatePaths.push(`/services/${record.slug}/`);
        }
        if (old_record?.slug && old_record.slug !== record?.slug) {
          revalidatePaths.push(`/services/${old_record.slug}/`);
        }
        // Always revalidate services listing
        revalidatePaths.push("/services/");
        break;

      case "states":
        revalidateTags.push("states");
        if (record?.slug) {
          revalidatePaths.push(`/${record.slug}/`);
        }
        if (old_record?.slug && old_record.slug !== record?.slug) {
          revalidatePaths.push(`/${old_record.slug}/`);
        }
        // Always revalidate homepage
        revalidatePaths.push("/");
        break;

      case "cities":
        revalidateTags.push("cities");
        if (record?.slug && record?.state?.slug) {
          revalidatePaths.push(`/${record.state.slug}/${record.slug}/`);
        }
        if (old_record?.slug && old_record?.state?.slug) {
          revalidatePaths.push(`/${old_record.state.slug}/${old_record.slug}/`);
        }
        break;

      case "reviews":
        revalidateTags.push("reviews");
        // Revalidate the clinic the review belongs to
        if (record?.clinic_id) {
          const { data: clinic } = await supabase
            .from("clinics")
            .select("slug")
            .eq("id", record.clinic_id)
            .single();
          if (clinic?.slug) {
            revalidatePaths.push(`/clinic/${clinic.slug}/`);
          }
        }
        // Revalidate the dentist if applicable
        if (record?.dentist_id) {
          const { data: dentist } = await supabase
            .from("dentists")
            .select("slug")
            .eq("id", record.dentist_id)
            .single();
          if (dentist?.slug) {
            revalidatePaths.push(`/dentist/${dentist.slug}/`);
          }
        }
        break;

      case "seo_pages":
        revalidateTags.push("seo");
        if (record?.slug) {
          // SEO pages use slugs like "dubai", "dubai/deira", "dubai/deira/cleaning"
          revalidatePaths.push(`/${record.slug}/`);
        }
        break;

      default:
        console.log(`[ISR Revalidation] Unknown table: ${table}`);
    }

    // Always revalidate homepage for any content change
    revalidatePaths.push("/");

    // Call the Next.js revalidation API
    const revalidateResults: { path?: string; tag?: string; success: boolean }[] = [];

    // Deduplicate paths
    const uniquePaths = [...new Set(revalidatePaths)];
    const uniqueTags = [...new Set(revalidateTags)];

    if (uniquePaths.length > 0 || uniqueTags.length > 0) {
      const revalidateResponse = await fetch(`${REVALIDATION_API}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: REVALIDATION_SECRET,
          paths: uniquePaths,
          tags: uniqueTags,
        }),
      });

      if (!revalidateResponse.ok) {
        const errorText = await revalidateResponse.text();
        console.error(`[ISR Revalidation] API call failed:`, errorText);
        return new Response(
          JSON.stringify({
            error: "Revalidation API call failed",
            detail: errorText,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const revalidateData = await revalidateResponse.json();
      console.log(`[ISR Revalidation] Success:`, revalidateData.summary);
    }

    return new Response(
      JSON.stringify({
        success: true,
        revalidated: {
          paths: uniquePaths,
          tags: uniqueTags,
          count: uniquePaths.length + uniqueTags.length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ISR Revalidation] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
