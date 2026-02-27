import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeoPage {
  id: string;
  slug: string;
  page_type: string;
  title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  h1: string | null;
  content: string | null;
}

interface Clinic {
  id: string;
  name: string;
  description: string | null;
  city: { name: string; state: { name: string; abbreviation: string } } | null;
}

async function generateContent(prompt: string, apiKey: string): Promise<string> {
  // Use AIMLAPI for Gemini API access
  const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert dental SEO content writer. Write professional, informative, and engaging content that:
- Is written in a natural, human tone (not robotic or AI-sounding)
- Includes relevant dental terminology and expertise
- Focuses on patient benefits and care quality
- Is optimized for search engines without keyword stuffing
- Uses proper headings, paragraphs, and formatting in markdown
- Is between 400-800 words for page content
- Is between 100-200 words for clinic descriptions`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function generateCityTreatmentContent(treatment: string, city: string, state: string): string {
  return `## ${treatment} Services in ${city}, ${state}

Finding quality ${treatment.toLowerCase()} care in ${city} doesn't have to be difficult. Our network of verified dental professionals offers comprehensive ${treatment.toLowerCase()} services tailored to your specific needs.

### What to Expect from ${treatment} in ${city}

When you visit a dental professional for ${treatment.toLowerCase()} in ${city}, ${state}, you'll receive personalized care from experienced practitioners. The treatment process typically begins with a thorough consultation to assess your dental health and discuss your goals.

Modern dental offices in ${city} utilize advanced technology and techniques to ensure comfortable, effective treatments. Whether you're dealing with a specific dental concern or seeking preventive care, local dentists are equipped to provide the highest standard of service.

### Benefits of Choosing Local ${treatment} Providers

Working with dental professionals in ${city} offers several advantages:

- **Convenient location** - Easy access to follow-up appointments
- **Community reputation** - Established practices with local patient reviews
- **Personalized care** - Dentists who understand the community's needs
- **Insurance coordination** - Familiarity with local insurance networks

### Preparing for Your ${treatment} Appointment

Before your appointment, consider preparing any questions about the procedure, costs, and recovery expectations. Bring your dental insurance information and a list of any medications you're currently taking.

Most ${treatment.toLowerCase()} procedures in ${city} are performed with patient comfort as a top priority. Discuss any concerns about anxiety or discomfort with your dental team—they can offer various options to help you feel at ease.

### Schedule Your Consultation Today

Ready to take the next step toward better dental health? Browse our verified ${treatment.toLowerCase()} providers in ${city}, ${state}, read patient reviews, and book an appointment online. Quality dental care is just a click away.`;
}

function generateCityContent(city: string, state: string, stateAbbr: string): string {
  return `## Find Your Perfect Dentist in ${city}, ${stateAbbr}

${city}, ${state} is home to a diverse community of dental professionals dedicated to providing exceptional oral healthcare. Whether you need routine cleanings, cosmetic procedures, or specialized treatments, you'll find qualified dentists ready to serve you.

### Dental Services Available in ${city}

Local dental practices in ${city} offer a comprehensive range of services including:

- **General Dentistry** - Cleanings, exams, fillings, and preventive care
- **Cosmetic Dentistry** - Teeth whitening, veneers, and smile makeovers
- **Restorative Dentistry** - Crowns, bridges, and dental implants
- **Orthodontics** - Braces and clear aligners for all ages
- **Emergency Dental Care** - Same-day treatment for urgent issues

### Why Choose a ${city} Dentist?

Selecting a local dentist means building a long-term relationship with a healthcare provider who understands your needs. ${city} dental practices pride themselves on:

- State-of-the-art facilities and equipment
- Experienced, licensed dental professionals
- Patient-centered approach to care
- Flexible scheduling and payment options
- Accepting most major dental insurance plans

### Tips for Finding the Right Dentist

When searching for a dentist in ${city}, consider reading patient reviews, checking credentials, and scheduling a consultation. Many practices offer free initial consultations or new patient specials.

Look for dentists who take time to explain procedures, answer questions, and make you feel comfortable. A good dental relationship is built on trust and communication.

### Book Your Appointment Today

Browse verified dental professionals in ${city}, ${state}, compare services and reviews, and schedule your appointment online. Your healthier smile starts here.`;
}

function generateTreatmentContent(treatment: string): string {
  return `## Understanding ${treatment}: A Complete Guide

${treatment} is an essential dental service that helps patients achieve and maintain optimal oral health. Whether you're exploring this treatment for the first time or seeking a new provider, understanding what to expect can help you make informed decisions about your dental care.

### What Is ${treatment}?

${treatment} encompasses a range of procedures designed to address specific dental needs. Modern dental technology has made these treatments more comfortable, effective, and accessible than ever before.

### Who Can Benefit from ${treatment}?

Patients of all ages may benefit from ${treatment} services. Common reasons people seek this treatment include:

- Addressing dental pain or discomfort
- Improving the appearance of teeth
- Restoring dental function
- Preventing future dental problems
- Maintaining overall oral health

### The ${treatment} Process

When you visit a dental professional for ${treatment}, you can expect:

1. **Initial Consultation** - Assessment of your dental health and treatment goals
2. **Treatment Planning** - Development of a personalized care plan
3. **Procedure** - The treatment itself, performed with patient comfort in mind
4. **Follow-up Care** - Instructions and appointments to ensure optimal results

### Finding the Right Provider

Choosing a qualified dental professional for ${treatment} is crucial. Look for providers who:

- Have relevant experience and credentials
- Use modern equipment and techniques
- Prioritize patient comfort and communication
- Have positive patient reviews and testimonials

### Ready to Get Started?

Browse our network of verified dental professionals offering ${treatment} services. Read reviews, compare providers, and book your appointment online today.`;
}

function generateClinicDescription(name: string, city: string, state: string): string {
  return `${name} provides comprehensive dental care services to patients in ${city}, ${state}, and surrounding communities. Our practice is committed to delivering high-quality dental treatments in a comfortable, welcoming environment. From routine cleanings and preventive care to advanced restorative and cosmetic procedures, our experienced team utilizes modern technology and techniques to help you achieve optimal oral health. We accept most major dental insurance plans and offer flexible scheduling to accommodate your busy lifestyle. Schedule your appointment today and experience the difference of personalized dental care.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Use AIMLAPI for Gemini API access
    const aimlApiKey = Deno.env.get("AIMLAPI_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, batchSize = 50, pageType } = await req.json();

    if (action === "fix_seo_pages") {
      // Get thin SEO pages - prioritize by page type if specified
      let query = supabase
        .from("seo_pages")
        .select("id, slug, page_type, title, meta_title, meta_description, h1, content")
        .or("is_thin_content.eq.true,content.is.null,content.eq.");
      
      if (pageType) {
        query = query.eq("page_type", pageType);
      }
      
      const { data: thinPages, error: pagesError } = await query.limit(batchSize);

      if (pagesError) throw pagesError;

      let fixed = 0;
      const updates: { id: string; content: string; is_thin_content: boolean; word_count: number }[] = [];

      for (const page of thinPages || []) {
        let content = "";
        
        // Parse slug to extract location/treatment info
        const slugParts = page.slug.replace(/^\/|\/$/g, "").split("/");
        
        if (page.page_type === "city_treatment" && slugParts.length >= 3) {
          const stateAbbr = slugParts[0].toUpperCase();
          const city = slugParts[1].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const treatment = slugParts[2].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          content = generateCityTreatmentContent(treatment, city, stateAbbr);
        } else if (page.page_type === "city" && slugParts.length >= 2) {
          const stateAbbr = slugParts[0].toUpperCase();
          const city = slugParts[1].split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          content = generateCityContent(city, stateAbbr, stateAbbr);
        } else if (page.page_type === "treatment" && slugParts.length >= 1) {
          const treatment = (page.title || slugParts[0]).split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          content = generateTreatmentContent(treatment);
        } else if (page.page_type === "state" && slugParts.length >= 1) {
          const state = slugParts[0].toUpperCase();
          content = generateCityContent(state, state, state);
        } else if (page.page_type === "clinic") {
          // For clinics, generate a shorter description
          const clinicName = page.title || "This dental practice";
          content = `## About ${clinicName}\n\n${generateClinicDescription(clinicName, "your area", "")}\n\n### Our Services\n\nWe offer a comprehensive range of dental services including general dentistry, cosmetic procedures, restorative treatments, and emergency care. Our experienced team is dedicated to providing personalized care in a comfortable environment.\n\n### Why Choose Us\n\n- Modern dental technology and techniques\n- Experienced, compassionate dental team\n- Convenient scheduling options\n- Most insurance plans accepted\n- Patient-focused approach to care`;
        } else {
          // Generic content for other page types
          content = `## Welcome\n\nThank you for visiting. We're dedicated to helping you find the best dental care. Browse our network of verified dental professionals and book your appointment online today.`;
        }

        const wordCount = content.split(/\s+/).length;
        updates.push({
          id: page.id,
          content,
          is_thin_content: wordCount < 200, // Lower threshold - 200 words is acceptable
          word_count: wordCount
        });
        fixed++;
      }

      // Batch update
      for (const update of updates) {
        await supabase
          .from("seo_pages")
          .update({
            content: update.content,
            is_thin_content: update.is_thin_content,
            word_count: update.word_count,
            updated_at: new Date().toISOString()
          })
          .eq("id", update.id);
      }

      // Get remaining count
      const { count } = await supabase
        .from("seo_pages")
        .select("*", { count: "exact", head: true })
        .or("is_thin_content.eq.true,content.is.null");

      return new Response(
        JSON.stringify({ 
          success: true, 
          fixed, 
          remaining: count || 0,
          message: `Fixed ${fixed} SEO pages. ${count || 0} remaining.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "fix_clinic_descriptions") {
      // Get clinics without descriptions
      const { data: clinics, error: clinicsError } = await supabase
        .from("clinics")
        .select(`
          id, 
          name, 
          description,
          city:cities!clinics_city_id_fkey(
            name,
            state:states!cities_state_id_fkey(name, abbreviation)
          )
        `)
        .or("description.is.null,description.eq.")
        .limit(batchSize);

      if (clinicsError) throw clinicsError;

      let fixed = 0;

      for (const clinic of clinics || []) {
        const cityData = clinic.city as any;
        const cityName = cityData?.name || "your area";
        const stateName = cityData?.state?.name || "";
        const stateAbbr = cityData?.state?.abbreviation || "";
        
        const description = generateClinicDescription(
          clinic.name,
          cityName,
          stateAbbr || stateName
        );

        await supabase
          .from("clinics")
          .update({ 
            description,
            updated_at: new Date().toISOString()
          })
          .eq("id", clinic.id);

        fixed++;
      }

      // Get remaining count
      const { count } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .or("description.is.null,description.eq.");

      return new Response(
        JSON.stringify({ 
          success: true, 
          fixed, 
          remaining: count || 0,
          message: `Fixed ${fixed} clinic descriptions. ${count || 0} remaining.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_stats") {
      const { count: thinSeoPages } = await supabase
        .from("seo_pages")
        .select("*", { count: "exact", head: true })
        .or("is_thin_content.eq.true,content.is.null");

      const { count: missingDescriptions } = await supabase
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .or("description.is.null,description.eq.");

      return new Response(
        JSON.stringify({ 
          thinSeoPages: thinSeoPages || 0,
          missingDescriptions: missingDescriptions || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
