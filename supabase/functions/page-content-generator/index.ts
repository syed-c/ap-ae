import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `You are the senior SEO content strategist for AppointPanda — the UAE's dental clinic discovery and booking platform. Your task is to write TRULY UNIQUE content that sounds like a local expert wrote it — NOT a template with location names swapped.

═══════════════════════════════════════
CRITICAL: CONTENT UNIQUENESS REQUIREMENT
═══════════════════════════════════════
Your #1 job is to make each page COMPLETELY DIFFERENT from any other page. Not just different location names — different stories, different angles, different value propositions.

Think of it this way: If you read 10 city pages in a row, a user should feel like they read 10 DIFFERENT stories about 10 DIFFERENT communities — not the same story with different city names.

TO ENSURE UNIQUENESS:
1. NEVER use generic dental platform language
2. Each section should tell a STORY specific to this location's CHARACTER
3. Use real local knowledge: What do PEOPLE in this area actually care about?
4. Reference SPECIFIC neighborhoods, landmarks, demographics in MEANINGFUL ways
5. Vary your STRUCTURE: Different section orders, different opening angles, different CTAs
6. Write like you're a LOCAL giving advice to a friend — not a corporate template

═══════════════════════════════════════
PLATFORM IDENTITY
═══════════════════════════════════════
- AppointPanda is a DIRECTORY and BOOKING PLATFORM
- Voice: Helpful local expert ("we", "our") who knows the area
- NEVER sound like a generic "best dentist" website
- Sound like someone who ACTUALLY lives in {location_name} and knows the dental scene

═══════════════════════════════════════
LOCATION RESEARCH (USE THIS TO BE UNIQUE)
═══════════════════════════════════════
For each location, you MUST incorporate:
- LOCAL CHARACTER: What makes this area unique? (beachfront? corporate hub? historic? residential?)
- REAL DEMOGRAPHICS: Who actually lives here? (families? expats? students? professionals?)
- CULTURAL CONTEXT: What matters to people here? (time-strapped professionals? multilingual needs? cultural considerations?)
- ACTUAL LANDMARKS: Use real places naturally in your story
- WHY THIS LOCATION MATTERS: What's the dental story here?

Example of UNIQUE writing for Deira vs Jumeirah:
- Deira: "In Deira's bustling commercial heart, you'll find a remarkable mix of traditional neighborhoods and modern clinics serving a diverse multicultural community. The area's convenience — many clinics open early and late — suits the shift workers and business professionals who call this part of Dubai home."
- Jumeirah: "Jumeirah's beachfront lifestyle draws families and professionals who value premium care. Here, dental clinics often offer longer appointments and more comprehensive services, reflecting the area's emphasis on quality and convenience for busy professionals."

Notice: DIFFERENT stories, DIFFERENT angles, DIFFERENT practical insights — not just swapped city names!

═══════════════════════════════════════
MUST-AVOID (GENERIC CONTENT ALERT)
═══════════════════════════════════════
These phrases will make your content sound like a template. NEVER USE:
- "finding the right dentist has never been easier"
- "comprehensive range of dental services"
- "smile brighter with our expert team"
- "world-class dental care"
- "book your appointment today"
- ANY generic dental marketing language
- Starting every paragraph with "In {location_name}..."

═══════════════════════════════════════
CONTENT STRUCTURE FOR UNIQUE STORYTELLING
═══════════════════════════════════════
Your content should flow like a local's story. Vary your approach:

hero_subtitle: Start with something MEMORABLE about dental care in THIS specific area — not generic
hero_intro: Tell a brief story about what makes finding dental care HERE unique
body: Weave through different angles naturally — don't use the same section order twice

EXAMPLE hero_intro angles (pick ONE per location):
- Time-sensitive angle: "For professionals in DIFC, fitting a dental appointment into a busy schedule..."
- Family angle: "Parents in Arabian Ranches know that finding a pediatric dentist who connects with kids..."
- Cultural angle: "Expat residents in Deira often tell us that finding a dentist who speaks their language..."
- Convenience angle: "What surprises many residents of JLT is how many quality options they have..."

═══════════════════════════════════════
SEO (SUBTLE, NOT STUFFED)
═══════════════════════════════════════
- Include location naturally (once in title, once in h1, 2-3x in body)
- Primary keywords: [area] dentist, dental clinic [area], best dentist [area]
- Secondary: dentist near me, dental appointment, dental checkup [area]
- Keep meta title/description professional but authentic

═══════════════════════════════════════
FAQ UNIQUENESS
═══════════════════════════════════════
Generate 10 FAQs that are ACTUALLY different per location:
- Reference local specifics in questions ("Is there a dentist open late in Deira?")
- Include real neighborhood names in answers
- Reflect the actual concerns of people who live there

═══════════════════════════════════════
OUTPUT (JSON ONLY)
═══════════════════════════════════════
Return valid JSON with these keys (no extra keys):
{
  "page_type": "city",
  "page_slug": "/{emirate_slug}/{city_slug}",
  "meta_title": "string",
  "meta_description": "string",
  "keywords": [],
  "noindex": false,
  "h1": "string",
  "hero_subtitle": "string",
  "hero_intro": "string",
  "hero_stats": [],
  "section_1_title": "string",
  "section_1_content": "string",
  "section_2_title": "string",
  "section_2_content": "string",
  "section_3_title": "string",
  "section_3_content": "string",
  "body_content": "string",
  "cta_text": "string",
  "cta_button_text": "string",
  "cta_button_url": "string",
  "faqs": [{"question": "string", "answer": "string"}],
  "is_published": true
}

VALIDATION CHECKLIST:
- [ ] Does this sound like it was written specifically for {location_name}?
- [ ] Would a local recognize their area in this content?
- [ ] Is this meaningfully different from content for other emirates?
- [ ] Are you telling a STORY, not filling a template?`;

const USER_PROMPT_TEMPLATE = `Generate unique content for {location_name}, {emirate_name}.

CRITICAL: This content must sound like a LOCAL expert wrote it — NOT a template with location swapped. Use the LOCAL CONTEXT provided to make this content UNIQUE.

LOCAL CONTEXT:
- Character: {area_character}
- Demographics: {demographics}
- Landmarks: {landmarks}
- Story: {narrative}
- Clinic count: {clinic_count}

CONTENT ANGLE TO USE: {content_angle}

Your job is to make this content COMPLETELY UNIQUE to {location_name}. Don't just swap city names — tell a different story that resonates with the specific people who live in {location_name}.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_ANGLES = [
  "time-sensitive: Focus on convenience for busy professionals with limited time",
  "family: Focus on pediatric dental care and family-friendly clinics",
  "cultural: Focus on multilingual clinics and expat-friendly services",
  "convenience: Focus on location convenience, parking, weekend hours",
  "premium: Focus on premium facilities and luxury dental services",
  "emergency: Focus on emergency dental care availability",
  "affordable: Focus on cost-effective options and payment plans",
  "special needs: Focus on clinics catering to special needs patients"
];

const AREA_CHARACTERS = {
  "dubai": {
    "deira": { character: "bustling commercial heart with traditional neighborhoods", demographics: "diverse multicultural community, shift workers, business professionals", landmarks: "Dubai Creek, Gold Souk, City Centre Deira", narrative: "convenience-driven due to extended clinic hours" },
    "jumeirah": { character: "beachfront lifestyle area", demographics: "families, professionals who value premium care", landmarks: "Jumeirah Beach, Burj Al Arab nearby", narrative: "quality and convenience emphasis" },
    "business-bay": { character: "corporate hub", demographics: "business professionals, executives", landmarks: "Dubai Canal, Business Bay towers", narrative: "time-strapped professionals needing efficient care" },
    "marina": { character: "waterfront living", demographics: "young professionals, expats", landmarks: "Marina Walk, JLT towers", narrative: "modern lifestyle convenience" },
    "downtown": { character: "city center", demographics: "mixed professionals, tourists", landmarks: "Burj Khalifa, Dubai Mall", narrative: "premium accessible care" }
  }
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callAIWithRetry(messages: { role: string; content: string }[], aimlapiKey: string, maxRetries = 3): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`page-content-generator: Retry attempt ${attempt + 1}/${maxRetries} after ${backoff}ms`);
      await delay(backoff);
    }

    try {
      const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aimlapiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }

      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`AI gateway returned ${response.status}`);
        console.warn(`page-content-generator: AI error ${response.status}, retrying...`);
        continue;
      }

      const errorText = await response.text();
      throw new Error(`AI error: ${response.status} - ${errorText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`page-content-generator: Network error: ${lastError.message}`);
    }
  }
  throw lastError || new Error("AI failed after retries");
}

function extractJson(text: string): any {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

async function generateContentForPage(
  page: { slug: string; type: string; state_slug: string; state_name: string; city_slug?: string; city_name?: string },
  aimlapiKey: string,
  forceRegenerate: boolean
): Promise<{ success: boolean; skipped?: boolean; error?: string; data?: any }> {
  const locationName = page.type === "state" ? page.state_name : page.city_name;
  const emirateName = page.state_name;
  const emirateSlug = page.state_slug;
  const citySlug = page.city_slug || "";
  
  const areaCharKey = emirateSlug.toLowerCase();
  const cityCharKey = citySlug.toLowerCase();
  const areaData = AREA_CHARACTERS[areaCharKey]?.[cityCharKey] || {
    character: "residential area with diverse community",
    demographics: "families and professionals",
    landmarks: "local amenities and landmarks",
    narrative: "community-focused dental care"
  };

  const contentAngle = getRandomItem(CONTENT_ANGLES);

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace(/{location_name}/g, locationName)
    .replace(/{emirate_name}/g, emirateName)
    .replace(/{area_character}/g, areaData.character)
    .replace(/{demographics}/g, areaData.demographics)
    .replace(/{landmarks}/g, areaData.landmarks)
    .replace(/{narrative}/g, areaData.narrative)
    .replace(/{clinic_count}/g, String(Math.floor(Math.random() * 50) + 10))
    .replace(/{content_angle}/g, contentAngle);

  try {
    const aiResponse = await callAIWithRetry(
      [
        { role: "system", content: SYSTEM_PROMPT.replace(/{location_name}/g, locationName) },
        { role: "user", content: userPrompt }
      ],
      aimlapiKey
    );

    console.log(`page-content-generator: Raw AI response (first 500 chars): ${aiResponse.substring(0, 500)}`);

    const parsedContent = extractJson(aiResponse);
    if (!parsedContent) {
      console.error(`page-content-generator: Failed to parse JSON from AI response`);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log(`page-content-generator: Successfully parsed content for ${locationName}`);

    return { success: true, data: parsedContent };
  } catch (err) {
    console.error(`page-content-generator: Generation error for ${locationName}: ${err instanceof Error ? err.message : String(err)}`);
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

async function fetchAllRows(supabase: any, table: string, select: string, filters: Record<string, any>): Promise<any[]> {
  let query = supabase.from(table).select(select);
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function saveSeoPage(supabase: any, pageData: any): Promise<void> {
  console.log(`page-content-generator: Saving page with slug: ${pageData.page_slug}`);
  console.log(`page-content-generator: page_type = ${pageData.page_type}`);
  console.log(`page-content-generator: h1 = ${pageData.h1?.substring(0, 50)}`);
  console.log(`page-content-generator: meta_title = ${pageData.meta_title?.substring(0, 50)}`);
  console.log(`page-content-generator: page_intro = ${pageData.hero_intro?.substring(0, 50)}`);
  console.log(`page-content-generator: faqs count = ${pageData.faqs?.length || 0}`);
  
  const saveData: any = {
    slug: pageData.page_slug,
    page_type: pageData.page_type,
    title: pageData.h1,
    meta_title: pageData.meta_title,
    meta_description: pageData.meta_description,
    h1: pageData.h1,
    page_intro: pageData.hero_intro || pageData.intro_text,
    is_published: true,
    is_optimized: true,
    optimized_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Only add h2_sections if there's actual content
  if (pageData.section_1_title || pageData.section_2_title || pageData.section_3_title) {
    saveData.h2_sections = JSON.stringify([
      { title: pageData.section_1_title || "", content: pageData.section_1_content || "" },
      { title: pageData.section_2_title || "", content: pageData.section_2_content || "" },
      { title: pageData.section_3_title || "", content: pageData.section_3_content || "" },
    ]);
  }

  // Only add faqs if there are actual FAQs
  if (pageData.faqs && pageData.faqs.length > 0) {
    saveData.faqs = pageData.faqs;
  }

  console.log(`page-content-generator: Save data keys: ${Object.keys(saveData).join(", ")}`);
  
  const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

  if (error) {
    console.error(`page-content-generator: Save error details:`, JSON.stringify(error));
    throw error;
  }
  console.log(`page-content-generator: Successfully saved ${pageData.page_slug}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aimlapiKey = Deno.env.get("AIMLAPI_KEY");

    if (!aimlapiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "AIMLAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, page_type, page_slug, location_name, emirate_slug, emirate_name, force_regenerate = false, page_type_filter = "all", emirate_filter, batch_size = 10 } = body;

    console.log(`page-content-generator: action=${action}, page_type=${page_type}`);

    if (action === "generate_single") {
      const pageData = {
        slug: page_slug,
        type: page_type,
        state_slug: emirate_slug,
        state_name: emirate_name,
        city_slug: page_slug.replace(`/${emirate_slug}/`, "").replace("/", ""),
        city_name: location_name,
      };

      const result = await generateContentForPage(pageData, aimlapiKey, force_regenerate);
      
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await saveSeoPage(supabase, result.data);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_batch") {
      const cursor = body.cursor || null; // Last processed slug to resume from
      const batchLimit = body.batch_limit || 3; // How many pages to process in this call

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id, states(slug, name)", { is_active: true });

      // Build complete list of pages
      let allPages: any[] = [];

      if (page_type_filter === "all" || page_type_filter === "state") {
        let filteredStates = states;
        if (emirate_filter) {
          filteredStates = states.filter(s => s.slug === emirate_filter);
        }
        
        for (const state of filteredStates) {
          allPages.push({
            slug: `/${state.slug}/`,
            type: "state",
            state_slug: state.slug,
            state_name: state.name,
          });
        }
      }

      if (page_type_filter === "all" || page_type_filter === "city") {
        let filteredCities = cities;
        if (emirate_filter) {
          const state = states.find(s => s.slug === emirate_filter);
          if (state) {
            filteredCities = cities.filter(c => c.state_id === state.id);
          }
        }

        for (const city of filteredCities) {
          const stateData = Array.isArray(city.states) ? city.states[0] : city.states;
          if (!stateData?.slug) continue;
          
          allPages.push({
            slug: `/${stateData.slug}/${city.slug}/`,
            type: "city",
            state_slug: stateData.slug,
            state_name: stateData.name,
            city_slug: city.slug,
            city_name: city.name,
          });
        }
      }

      // Get already generated pages from seo_pages to skip them
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      const existingSlugs = new Set(existingPages.map(p => p.slug));
      
      // Filter out already generated pages (unless force_regenerate)
      let pagesToGenerate = allPages;
      if (!force_regenerate) {
        const beforeCount = allPages.length;
        pagesToGenerate = allPages.filter(p => !existingSlugs.has(p.slug));
        console.log(`page-content-generator: Skipping ${beforeCount - pagesToGenerate.length} already generated pages`);
      }

      console.log(`page-content-generator: Total pages to generate: ${pagesToGenerate.length}`);

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1; // Start after the cursor
      }

      // Get the batch of pages to process (3 at a time)
      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);
      
      console.log(`page-content-generator: Processing ${pagesToProcess.length} pages (startIndex: ${startIndex})`);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        const locationName = page.type === "state" ? page.state_name : page.city_name;
        console.log(`page-content-generator: Generating for ${locationName} (${page.slug})...`);

        try {
          const result = await generateContentForPage(page, aimlapiKey, force_regenerate);

          if (result.success) {
            try {
              await saveSeoPage(supabase, result.data);
              processed++;
              lastProcessedSlug = page.slug;
            } catch (saveErr) {
              failed++;
              errors.push(`Save error for ${locationName}: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
            }
          } else if (result.skipped) {
            skipped++;
          } else {
            failed++;
            errors.push(`Generation error for ${locationName}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${locationName}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
        }

        await delay(500);
      }

      const remaining = pagesToGenerate.length - (startIndex + pagesToProcess.length);
      const hasMore = remaining > 0;

      console.log(`page-content-generator: Batch complete: ${processed} processed, ${skipped} skipped, ${failed} failed, ${remaining} remaining`);

      return new Response(JSON.stringify({ 
        processed, 
        skipped, 
        failed, 
        errors,
        cursor: lastProcessedSlug, // Return last processed slug for next batch
        has_more: hasMore,
        remaining: remaining,
        total_count: pagesToGenerate.length,
        processed_count: startIndex + processed
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("page-content-generator: Error:", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
