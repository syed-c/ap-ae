import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the senior SEO content strategist for AppointPanda — the UAE's dental clinic discovery and booking platform. You write structured page content that populates a database directly. Every field you produce is rendered verbatim on the live website and indexed by Google.

════════════════════════════════════════
PLATFORM IDENTITY (NON-NEGOTIABLE)
════════════════════════════════════════
- AppointPanda is a DIRECTORY and BOOKING PLATFORM — NOT a dental clinic
- Voice: First-person platform ("we", "AppointPanda", "our platform")
- Never claim to be a clinic, dentist, or healthcare provider
- Never make medical claims, diagnoses, or treatment guarantees
- Never fabricate statistics, clinic counts, or pricing unless given exact data
- When referencing clinics: "clinics listed on AppointPanda", "professionals in our network"

════════════════════════════════════════
UAE HEALTHCARE REGULATORY COMPLIANCE
════════════════════════════════════════
Licensing authorities by emirate — reference ONLY the correct one:
  Dubai           → DHA (Dubai Health Authority)
  Abu Dhabi       → DOH (Department of Health – Abu Dhabi)
  Sharjah         → MOHAP (Ministry of Health and Prevention)
  Ajman           → MOHAP
  Ras Al Khaimah  → MOHAP
  Fujairah        → MOHAP
  Umm Al Quwain   → MOHAP

Rules:
- NEVER say "DHA-verified", "DHA-certified", or "DHA-approved" about AppointPanda itself
- CORRECT: "clinics licensed by the DHA" / "DHA-licensed dental professionals"
- Mention insurance accepted in UAE: Daman, AXA, Cigna, MetLife, Thiqa, ADNIC, ADIB, NextCare
- Reference realistic AED price ranges only when specifically instructed

════════════════════════════════════════
E-E-A-T REQUIREMENTS (GOOGLE YMYL)
════════════════════════════════════════
This is health content. Google applies maximum scrutiny.
- Experience: Write as if you understand real patient journeys in the UAE
- Expertise: Use accurate dental terminology naturally (not stuffed)
- Authoritativeness: Reference regulatory bodies, insurance, and healthcare norms correctly
- Trustworthiness: No exaggeration, no "best in UAE", no fabricated awards, no fake reviews

════════════════════════════════════════
SEO RULES — STRICTLY ENFORCED
════════════════════════════════════════
Meta title:
  - 50–60 characters MAXIMUM (count every character including spaces)
  - Format: [Primary intent keyword] | AppointPanda
  - Location keyword near the beginning
  - NO ALL CAPS, no excessive punctuation

Meta description:
  - 140–155 characters MAXIMUM
  - Include the location and a clear search intent match
  - End with a soft CTA: "Browse verified clinics and book today."
  - Must be different in phrasing from the h1 and hero_subtitle

H1:
  - 40–70 characters
  - Must be different from meta_title in wording (not a copy)
  - Contain location + intent (e.g. "Find Verified Dentists in Sharjah")
  - One H1 per page — do not repeat it anywhere else in the output

hero_subtitle:
  - 1 sentence, 20–35 words
  - Addresses the visitor's immediate concern: Why is finding a dentist here hard?
  - Establishes AppointPanda as the solution
  - No hyperbole. No claims of being "the best" or "#1"

hero_intro:
  - 2–3 sentences max, 40–60 words total
  - Expands on hero_subtitle with a human, slightly conversational tone
  - Reference 1–2 real local landmarks, neighbourhoods, or cultural facts natural to the location
  - PROHIBITED: Do NOT use generic phrases like "finding the right dentist has never been easier"

section_1_title / section_1_content:
  - Title: Target a specific patient demographic or need (families, professionals, expats, seniors)
  - Content: 80–120 words. Use a concrete scenario. Name a real neighbourhood or landmark. Show how AppointPanda solves the specific problem for this demographic.

section_2_title / section_2_content:
  - Title: Target a DIFFERENT demographic or need than section_1
  - Content: 80–120 words. Different scenario. Different neighbourhood or context. Different tone angle.

section_3_title / section_3_content:
  - Title: Target a THIRD distinct demographic or need
  - Content: 80–120 words. No overlap in angle, neighbourhood, or scenario with sections 1 or 2.

body_content:
  - 600–900 words total
  - Written in clean markdown: ## for H2 headings, no H1 (already set), no H3 unless truly nested
  - Must contain these 5–7 sections in varied order (do NOT always use the same order):
      1. What AppointPanda Offers [Location] Residents  
      2. Popular Dental Services in [Location]  
      3. Making Informed Dental Choices in [Location]  
      4. Understanding Dental Costs in [Location] (AED ranges, factors, insurance)  
      5. [Location]-Specific: Either UAE expat dental care, multilingual dentists, or DHA/DOH/MOHAP licensing — pick the most relevant  
      6. How to Book (brief, 40–60 words, platform CTA)
      7. Optional: A section specific to a known characteristic of this location (e.g. healthcare tourism for Dubai Healthcare City area, corporate dental for DIFC)
  - Each section: 80–140 words
  - PROHIBITED in body_content:
      * Repeating the hero_intro word-for-word
      * Repeating section_1/2/3 content
      * Starting more than one section with "AppointPanda"
      * Phrases: "finding the right dentist", "look no further", "comprehensive range", "seamlessly", "delve into"
      * Mentioning specific clinics by name (directory neutrality)

cta_text:
  - 1 sentence, 15–25 words
  - Action-oriented, references the location
  - Ends the content experience naturally

cta_button_text:
  - 3–5 words, imperative verb
  - Examples: "Find a Dentist", "Browse Dubai Clinics", "Book an Appointment"

cta_button_url:
  - For state pages: /[emirate-slug]/
  - For city pages: /[emirate-slug]/[city-slug]/

faqs:
  - Exactly 10 FAQ items for state pages, 8 for city pages
  - MANDATORY: Each FAQ must be answerable using only information available publicly about UAE dental care — no invented facts
  - Mix of question types:
      * Cost questions (AED ranges — use realistic ranges, acknowledge variance)
      * Process questions (what to expect, how to book)
      * Insurance questions (name specific UAE insurers relevant to the emirate)
      * Regulatory questions (DHA / DOH / MOHAP — correct for this emirate)
      * Local-specific questions (neighbourhood, accessibility, expat considerations)
  - Each answer: 40–80 words. Factual. No claims AppointPanda cannot support.
  - PROHIBITED: Duplicate question types. All 10 must cover different topics.
  - FAQ format in output:
      [{"question": "...", "answer": "..."}]

════════════════════════════════════════
UNIQUENESS ENFORCEMENT
════════════════════════════════════════
Every page in the UAE has a distinct population mix, urban character, and healthcare landscape.
You MUST differentiate content by:
  1. Using only landmarks, neighbourhoods, and cultural contexts that actually belong to this specific location
  2. Varying section topic order between pages (never same section sequence twice)
  3. Using the location's specific regulatory authority (DHA vs DOH vs MOHAP)
  4. Reflecting the actual demographic of the area (e.g. Deira = diverse multicultural expat; JBR = tourism and hospitality workers; Abu Dhabi Corniche = government professionals)
  5. Starting hero_intro, each section, and body sections with different grammatical constructions

PROHIBITED ACROSS ALL PAGES (will cause immediate failure):
  - "From routine check-ups to advanced cosmetic procedures"
  - "Whether you're looking to brighten your smile, replace missing teeth"
  - "Finding the right dentist doesn't have to be difficult"
  - "Our network of verified dental professionals"
  - "With over X dental clinics dotting the [location] landscape" — only use if exact count is provided
  - Fabricated or unverified statistics

════════════════════════════════════════
OUTPUT FORMAT
════════════════════════════════════════
Return ONLY a single valid JSON object. No markdown fences. No preamble. No explanation.
The JSON must contain exactly these keys mapping to the page_content table:

{
  "page_type": string,           // "state" or "city"
  "page_slug": string,           // e.g. "/dubai" or "/dubai/jumeirah"
  "meta_title": string,          // ≤60 chars
  "meta_description": string,    // ≤155 chars
  "keywords": [],                // empty array — managed separately
  "noindex": false,
  "h1": string,
  "hero_subtitle": string,
  "hero_intro": string,
  "hero_stats": [],              // empty array — populated from live DB data
  "section_1_title": string,
  "section_1_content": string,
  "section_2_title": string,
  "section_2_content": string,
  "section_3_title": string,
  "section_3_content": string,
  "body_content": string,        // markdown, 600–900 words
  "cta_text": string,
  "cta_button_text": string,
  "cta_button_url": string,
  "faqs": [{"question": string, "answer": string}],
  "is_published": true
}

Validate before outputting:
  ✓ meta_title character count ≤ 60
  ✓ meta_description character count ≤ 155
  ✓ h1 is NOT identical to meta_title
  ✓ hero_intro does NOT repeat verbatim in body_content
  ✓ section_1, section_2, section_3 target THREE distinct demographics
  ✓ body_content contains ≥ 5 H2 sections
  ✓ faqs array has correct count (10 for state, 8 for city)
  ✓ No prohibited phrases present anywhere in output
  ✓ JSON is valid and parseable`;

const USER_PROMPT_TEMPLATE = `Generate page_content database record for AppointPanda.

PAGE DETAILS:
  Page type:       {{page_type}}        // "state" OR "city"
  Page slug:       {{page_slug}}        // e.g. "/sharjah" or "/dubai/al-barsha"
  Location name:   {{location_name}}    // e.g. "Sharjah" or "Al Barsha"
  Parent emirate:  {{emirate_name}}     // For city pages: "Dubai" / For state pages: same as location_name
  Emirate slug:    {{emirate_slug}}     // e.g. "dubai", "sharjah", "abu-dhabi"
  Licensing body:  {{licensing_body}}   // "DHA" / "DOH" / "MOHAP" — pre-computed, do not override

LOCATION CONTEXT (use these details to localise content — do not invent facts outside this):
  Character:       {{area_character}}   // e.g. "upscale beachfront residential" / "historic commercial district"
  Demographics:    {{demographics}}     // e.g. "affluent families and Western expats" / "diverse South Asian workforce"
  Key landmarks:   {{landmarks}}        // e.g. ["Mall of the Emirates", "Barsha Park"] — use max 2 naturally
  Urban narrative: {{narrative}}        // e.g. "family-focused wellness" / "efficiency-first corporate care"

LIVE DATA FROM DATABASE (use these exact numbers where content calls for them):
  Active clinics:  {{clinic_count}}     // integer — use this exact figure, not an approximation
  Areas covered:   {{area_count}}       // integer — for state pages only, null for city pages
  Avg rating:      {{avg_rating}}       // float — e.g. 4.8

CONTENT ANGLE DIRECTIVE (rotate this per page to prevent structural duplication):
  Angle assigned:  {{content_angle}}    // one of:
                                        // "patient-journey" — structure around steps from search to booking
                                        // "demographic-segmented" — three very different patient groups
                                        // "service-depth" — lead with services, build toward trust signals
                                        // "cost-and-insurance" — lead with financial considerations, then care quality
                                        // "expat-focused" — multilingual care, international insurance, cultural sensitivity

SECTION DEMOGRAPHIC ASSIGNMENTS (assign one per section, no repeats):
  Section 1 demographic:  {{section_1_demographic}}  // e.g. "families with children"
  Section 2 demographic:  {{section_2_demographic}}  // e.g. "working professionals"
  Section 3 demographic:  {{section_3_demographic}}  // e.g. "seniors and patients with mobility needs"

OUTPUT REQUIREMENTS REMINDER:
  - meta_title MUST be ≤ 60 characters
  - meta_description MUST be ≤ 155 characters
  - Return only valid JSON matching the page_content schema
  - Do not include hero_image, featured_image, og_image, gallery_images — leave as null
  - hero_stats and keywords must be empty arrays []
  - is_published must be true
  - Do not add any key not listed in the schema`;

const AREA_LOCAL_CONTEXT: Record<string, {
  character: string;
  demographics: string;
  landmarks: string[];
  narrative: string;
  description: string;
}> = {
  'jumeirah': {
    character: 'upscale beachfront residential',
    demographics: 'affluent families and expat professionals',
    landmarks: ['Jumeirah Mosque', 'Kite Beach', 'La Mer'],
    narrative: 'family-focused wellness',
    description: "one of Dubai's most prestigious beachfront neighborhoods, known for luxury villas and a family-oriented lifestyle",
  },
  'dubai-marina': {
    character: 'cosmopolitan waterfront towers',
    demographics: 'young professionals and international residents',
    landmarks: ['Marina Walk', 'Dubai Marina Mall', 'Ain Dubai'],
    narrative: 'modern lifestyle convenience',
    description: 'a vibrant waterfront community with stunning high-rise living and a cosmopolitan atmosphere',
  },
  'deira': {
    character: 'historic commercial district',
    demographics: 'diverse multicultural community',
    landmarks: ['Gold Souk', 'Deira City Centre', 'Dubai Creek'],
    narrative: 'heritage-meets-accessibility',
    description: "Dubai's historic heart, where traditional souks meet modern commerce along the Creek",
  },
  'business-bay': {
    character: 'modern commercial hub',
    demographics: 'corporate professionals and urban residents',
    landmarks: ['Dubai Canal', 'Bay Avenue', 'Marasi Drive'],
    narrative: 'efficiency-first corporate care',
    description: "Dubai's thriving business district with the iconic Dubai Canal running through its modern towers",
  },
  'downtown-dubai': {
    character: 'premium urban landmark district',
    demographics: 'tourists, luxury residents and business travelers',
    landmarks: ['Burj Khalifa', 'Dubai Mall', 'Dubai Fountain'],
    narrative: 'world-class premium dental',
    description: 'the heart of modern Dubai, home to the Burj Khalifa and some of the world\'s most iconic attractions',
  },
  'al-barsha': {
    character: 'established residential and retail hub',
    demographics: 'families, students and mid-range professionals',
    landmarks: ['Mall of the Emirates', 'Barsha Park'],
    narrative: 'value-driven family dentistry',
    description: 'a well-established residential area anchored by Mall of the Emirates and excellent transport links',
  },
  'healthcare-city': {
    character: 'medical free zone and health hub',
    demographics: 'medical tourists and specialist-seekers',
    landmarks: ['DHCC', 'Mediclinic', 'Al Jalila Foundation'],
    narrative: 'specialist medical destination',
    description: "the UAE's premier healthcare free zone, purpose-built to house world-class medical facilities and specialists",
  },
  'jbr': {
    character: 'beachfront leisure and tourism strip',
    demographics: 'tourists, hotel residents and coastal lifestyle',
    landmarks: ['The Walk', 'Bluewaters Island', 'JBR Beach'],
    narrative: 'resort-style dental experience',
    description: 'a popular beachfront destination with The Walk promenade and stunning views of Ain Dubai',
  },
  'jlt': {
    character: 'mid-range lakeside towers',
    demographics: 'young professionals and small families',
    landmarks: ['JLT Park', 'Cluster towers', 'Dubai Metro'],
    narrative: 'affordable professional care',
    description: 'a well-connected community of lakeside towers popular with young professionals seeking affordability',
  },
  'al-safa': {
    character: 'leafy residential enclave near Jumeirah',
    demographics: 'established families and villa residents',
    landmarks: ['Safa Park', 'City Walk'],
    narrative: 'quiet neighborhood dentistry',
    description: 'a green residential enclave centered around the beloved Safa Park, popular with families',
  },
  'bur-dubai': {
    character: 'vibrant old-town cultural melting pot',
    demographics: 'diverse residents, workers and heritage visitors',
    landmarks: ['Dubai Museum', 'Meena Bazaar', 'Textile Souk'],
    narrative: 'accessible multilingual care',
    description: 'a culturally rich district where Dubai\'s heritage comes alive through historic sites and diverse communities',
  },
  'international-city': {
    character: 'affordable multicultural township',
    demographics: 'budget-conscious residents and new immigrants',
    landmarks: ['Dragon Mart', 'Central Park'],
    narrative: 'budget-friendly community dental',
    description: 'a diverse and affordable community known for Dragon Mart and multicultural living',
  },
  'difc': {
    character: 'premium financial free zone',
    demographics: 'executives, finance professionals and diplomats',
    landmarks: ['Gate Building', 'DIFC Art Nights', 'Gate Avenue'],
    narrative: 'executive concierge dentistry',
    description: "the Middle East's leading financial hub, housing global banks and premium lifestyle offerings",
  },
  'discovery-gardens': {
    character: 'affordable garden-themed community',
    demographics: 'families and mid-income residents',
    landmarks: ['Ibn Battuta Mall', 'Gardens community'],
    narrative: 'community-centered family care',
    description: 'a popular garden-themed residential community near Ibn Battuta Mall',
  },
  'jvc': {
    character: 'emerging family-friendly community',
    demographics: 'young families and first-time homeowners',
    landmarks: ['JVC Park', 'Circle Mall'],
    narrative: 'growing community wellness',
    description: 'a rapidly growing family-friendly community with parks, schools and improving amenities',
  },
  'al-nahda-dubai': {
    character: 'border community shared with Sharjah',
    demographics: 'cross-border commuters and mixed residents',
    landmarks: ['Al Nahda Park', 'Sahara Centre'],
    narrative: 'convenient cross-emirate care',
    description: 'a strategic border community connecting Dubai and Sharjah, popular with commuters',
  },
  'al-quoz': {
    character: 'industrial-turned-creative district',
    demographics: 'artists, gallery-goers and workers',
    landmarks: ['Alserkal Avenue', 'Al Quoz Industrial'],
    narrative: 'creative district healthcare',
    description: "Dubai's creative heartland, home to Alserkal Avenue and a growing arts scene",
  },
  'al-rashidiya': {
    character: 'established residential near airport',
    demographics: 'families, airport workers and long-term residents',
    landmarks: ['Rashidiya Metro', 'DXB Airport'],
    narrative: 'airport-accessible dental care',
    description: 'a well-established residential area near Dubai International Airport with excellent metro connectivity',
  },
  'dubai-hills': {
    character: 'premium master-planned community',
    demographics: 'affluent families and villa owners',
    landmarks: ['Dubai Hills Mall', 'Dubai Hills Park', 'Golf Club'],
    narrative: 'premium suburban wellness',
    description: 'a premium master-planned community featuring parks, a championship golf course and the new Dubai Hills Mall',
  },
  'al-mamzar': {
    character: 'coastal residential near Sharjah border',
    demographics: 'mixed-income families and beachgoers',
    landmarks: ['Al Mamzar Beach Park', 'Mamzar Corniche'],
    narrative: 'seaside community care',
    description: 'a relaxed coastal community known for its sprawling beach park and proximity to Sharjah',
  },
  'al-warqa': {
    character: 'quiet suburban residential area',
    demographics: 'local Emirati families and long-term residents',
    landmarks: ['Al Warqa Park', 'Warqa City Mall'],
    narrative: 'trusted neighborhood dentistry',
    description: 'a quiet residential suburb popular with Emirati families and long-term residents',
  },
};

const DEFAULT_AREA_CONTEXT = {
  character: "mixed residential and commercial",
  demographics: "diverse expat and local community",
  landmarks: [] as string[],
  narrative: "accessible everyday dental care",
  description: "a UAE community with a range of dental care options",
};

const LICENSING_BODY: Record<string, string> = {
  "dubai": "DHA",
  "abu-dhabi": "DOH",
  "sharjah": "MOHAP",
  "ajman": "MOHAP",
  "ras-al-khaimah": "MOHAP",
  "fujairah": "MOHAP",
  "umm-al-quwain": "MOHAP",
};

const CONTENT_ANGLES = [
  "patient-journey",
  "demographic-segmented",
  "service-depth",
  "cost-and-insurance",
  "expat-focused",
];

const DEMOGRAPHIC_SETS = [
  ["families with children", "working professionals", "seniors and limited-mobility patients"],
  ["expat professionals", "young couples", "medical tourists"],
  ["corporate executives", "university students", "parents with young children"],
  ["multilingual expats", "elderly residents", "health-conscious adults"],
  ["blue-collar workers", "new residents finding a local dentist", "patients needing specialist referrals"],
];

interface PageContentRequest {
  action: "generate_single" | "generate_batch";
  page_type?: "state" | "city";
  page_slug?: string;
  location_name?: string;
  emirate_slug?: string;
  emirate_name?: string;
  force_regenerate?: boolean;
  page_type_filter?: "state" | "city" | "all";
  batch_size?: number;
}

function getSlugHash(slug: string): number {
  return Array.from(slug).reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getAreaContext(areaSlug: string) {
  const normalizedSlug = areaSlug.toLowerCase().replace(/^\//, '').split('/').pop() || areaSlug;
  return AREA_LOCAL_CONTEXT[normalizedSlug] || DEFAULT_AREA_CONTEXT;
}

async function fetchLiveData(supabaseAdmin: ReturnType<typeof createClient>, pageType: string, emirateSlug: string, citySlug?: string) {
  let clinicCount = 0;
  let areaCount: number | null = null;
  let avgRating = 4.8;

  try {
    if (pageType === "state") {
      const { count: clinicCountResult } = await supabaseAdmin
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("state_slug", emirateSlug)
        .eq("is_active", true);
      clinicCount = clinicCountResult || 0;

      const { count: areaCountResult } = await supabaseAdmin
        .from("cities")
        .select("*", { count: "exact", head: true })
        .eq("state_slug", emirateSlug)
        .eq("is_active", true);
      areaCount = areaCountResult;

      const { data: ratingData } = await supabaseAdmin
        .from("clinics")
        .select("rating")
        .eq("state_slug", emirateSlug)
        .eq("is_active", true)
        .not("rating", "is", null);
      
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Math.round((sum / ratingData.length) * 10) / 10;
      }
    } else if (pageType === "city" && citySlug) {
      const { count: clinicCountResult } = await supabaseAdmin
        .from("clinics")
        .select("*", { count: "exact", head: true })
        .eq("city_slug", citySlug)
        .eq("is_active", true);
      clinicCount = clinicCountResult || 0;

      const { data: ratingData } = await supabaseAdmin
        .from("clinics")
        .select("rating")
        .eq("city_slug", citySlug)
        .eq("is_active", true)
        .not("rating", "is", null);
      
      if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Math.round((sum / ratingData.length) * 10) / 10;
      }
    }
  } catch (e) {
    console.error("Error fetching live data:", e);
  }

  return { clinicCount, areaCount, avgRating };
}

async function callAIWithRetry(body: object, maxRetries = 3): Promise<Response> {
  const AIMLAPI_KEY = Deno.env.get("AIMLAPI_KEY");
  if (!AIMLAPI_KEY) throw new Error("AIMLAPI_KEY not configured");

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        console.warn(`AI gateway error ${response.status}, retrying...`);
        continue;
      }
      return response;
    } catch (e) {
      console.warn("Network error:", e);
    }
  }
  throw new Error("AI gateway failed after retries");
}

function validatePageContent(content: any, pageType: string, expectedSlug: string): string[] {
  const errors: string[] = [];

  if (!content.meta_title || content.meta_title.length > 70) {
    errors.push(`meta_title missing or too long (${content.meta_title?.length || 0} chars)`);
  }
  if (!content.meta_description || content.meta_description.length > 160) {
    errors.push(`meta_description missing or too long (${content.meta_description?.length || 0} chars)`);
  }
  if (!content.h1 || content.h1 === content.meta_title) {
    errors.push("h1 missing or identical to meta_title");
  }
  if (!content.body_content || content.body_content.split(/\s+/).length < 300) {
    errors.push("body_content missing or too short");
  }
  if (!content.section_1_content || !content.section_2_content || !content.section_3_content) {
    errors.push("One or more section content fields missing");
  }
  if (content.page_slug !== expectedSlug) {
    errors.push(`page_slug mismatch: expected ${expectedSlug}, got ${content.page_slug}`);
  }
  if (content.is_published !== true) {
    errors.push("is_published must be true");
  }
  if (content.noindex !== false) {
    errors.push("noindex must be false");
  }

  const faqCount = content.faqs?.length || 0;
  const requiredFaqs = pageType === "state" ? 10 : 8;
  if (faqCount < requiredFaqs) {
    errors.push(`faqs count ${faqCount} < required ${requiredFaqs}`);
  }

  return errors;
}

async function generateSinglePage(
  supabaseAdmin: ReturnType<typeof createClient>,
  pageType: "state" | "city",
  pageSlug: string,
  locationName: string,
  emirateSlug: string,
  emirateName: string,
  forceRegenerate: boolean
) {
  const slugHash = getSlugHash(pageSlug);
  const contentAngle = CONTENT_ANGLES[slugHash % CONTENT_ANGLES.length];
  const [s1, s2, s3] = DEMOGRAPHIC_SETS[slugHash % DEMOGRAPHIC_SETS.length];

  if (!forceRegenerate) {
    const { data: existing } = await supabaseAdmin
      .from("page_content")
      .select("page_slug")
      .eq("page_slug", pageSlug)
      .single();
    
    if (existing) {
      return { success: true, skipped: true, error: null };
    }
  }

  const parts = pageSlug.split("/").filter(Boolean);
  const citySlug = pageType === "city" ? parts[parts.length - 1] : undefined;
  const areaContext = getAreaContext(citySlug || emirateSlug);
  const licensingBody = LICENSING_BODY[emirateSlug] || "MOHAP";

  const { clinicCount, areaCount, avgRating } = await fetchLiveData(
    supabaseAdmin, pageType, emirateSlug, citySlug
  );

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace("{{page_type}}", pageType)
    .replace("{{page_slug}}", pageSlug)
    .replace("{{location_name}}", locationName)
    .replace("{{emirate_name}}", emirateName)
    .replace("{{emirate_slug}}", emirateSlug)
    .replace("{{licensing_body}}", licensingBody)
    .replace("{{area_character}}", areaContext.character)
    .replace("{{demographics}}", areaContext.demographics)
    .replace("{{landmarks}}", JSON.stringify(areaContext.landmarks.slice(0, 2)))
    .replace("{{narrative}}", areaContext.narrative)
    .replace("{{clinic_count}}", clinicCount.toString())
    .replace("{{area_count}}", areaCount?.toString() ?? "null")
    .replace("{{avg_rating}}", avgRating.toFixed(1))
    .replace("{{content_angle}}", contentAngle)
    .replace("{{section_1_demographic}}", s1)
    .replace("{{section_2_demographic}}", s2)
    .replace("{{section_3_demographic}}", s3);

  const aiResponse = await callAIWithRetry({
    model: "MiniMax/MiniMax-M2.5",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const result = await aiResponse.json();
  const pageContent = JSON.parse(result.choices[0].message.content);

  const validationErrors = validatePageContent(pageContent, pageType, pageSlug);
  if (validationErrors.length > 0) {
    console.error(`Validation failed for ${pageSlug}:`, validationErrors);
    return { success: false, skipped: false, error: validationErrors.join("; ") };
  }

  const { error } = await supabaseAdmin
    .from("page_content")
    .upsert({
      page_type: pageContent.page_type,
      page_slug: pageContent.page_slug,
      meta_title: pageContent.meta_title,
      meta_description: pageContent.meta_description,
      keywords: [],
      noindex: false,
      h1: pageContent.h1,
      hero_subtitle: pageContent.hero_subtitle,
      hero_intro: pageContent.hero_intro,
      hero_stats: [],
      section_1_title: pageContent.section_1_title,
      section_1_content: pageContent.section_1_content,
      section_2_title: pageContent.section_2_title,
      section_2_content: pageContent.section_2_content,
      section_3_title: pageContent.section_3_title,
      section_3_content: pageContent.section_3_content,
      body_content: pageContent.body_content,
      cta_text: pageContent.cta_text,
      cta_button_text: pageContent.cta_button_text,
      cta_button_url: pageContent.cta_button_url,
      faqs: pageContent.faqs,
      is_published: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "page_slug",
    });

  if (error) {
    console.error("Upsert error:", error);
    return { success: false, skipped: false, error: error.message };
  }

  return { success: true, skipped: false, error: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAuthorized = (roles ?? []).some((r) => r.role === "super_admin" || r.role === "seo_team");
    if (!isAuthorized) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: PageContentRequest = await req.json();
    const { action } = body;

    if (action === "generate_single") {
      const result = await generateSinglePage(
        supabaseAdmin,
        body.page_type!,
        body.page_slug!,
        body.location_name!,
        body.emirate_slug!,
        body.emirate_name!,
        body.force_regenerate ?? false
      );

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_batch") {
      const pageTypeFilter = body.page_type_filter ?? "all";
      const emirateFilter = body.emirate_filter;
      const forceRegenerate = body.force_regenerate ?? false;
      const batchSize = Math.min(body.batch_size ?? 10, 50);

      const pagesToGenerate: Array<{
        page_type: "state" | "city";
        page_slug: string;
        location_name: string;
        emirate_slug: string;
        emirate_name: string;
      }> = [];

      if (pageTypeFilter === "state" || pageTypeFilter === "all") {
        const { data: states } = await supabaseAdmin
          .from("states")
          .select("slug, name, is_active")
          .eq("is_active", true);

        if (states) {
          for (const state of states) {
            if (emirateFilter && state.slug !== emirateFilter) continue;
            pagesToGenerate.push({
              page_type: "state",
              page_slug: `/${state.slug}`,
              location_name: state.name,
              emirate_slug: state.slug,
              emirate_name: state.name,
            });
          }
        }
      }

      if (pageTypeFilter === "city" || pageTypeFilter === "all") {
        const { data: cities } = await supabaseAdmin
          .from("cities")
          .select("slug, name, state_slug, states(name)")
          .eq("is_active", true);

        if (cities) {
          for (const city of cities) {
            if (emirateFilter && city.state_slug !== emirateFilter) continue;
            const stateName = (city as any).states?.name || city.state_slug;
            pagesToGenerate.push({
              page_type: "city",
              page_slug: `/${city.state_slug}/${city.slug}`,
              location_name: city.name,
              emirate_slug: city.state_slug,
              emirate_name: stateName,
            });
          }
        }
      }

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const page of pagesToGenerate.slice(0, batchSize)) {
        const result = await generateSinglePage(
          supabaseAdmin,
          page.page_type,
          page.page_slug,
          page.location_name,
          page.emirate_slug,
          page.emirate_name,
          forceRegenerate
        );

        if (result.success) {
          if (result.skipped) skipped++;
          else processed++;
        } else {
          failed++;
          errors.push(`${page.page_slug}: ${result.error}`);
        }

        await new Promise(r => setTimeout(r, 3000));
      }

      return new Response(JSON.stringify({
        processed,
        skipped,
        failed,
        errors,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("page-content-generator error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
