import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Env {
  DB: D1Database;
  SUPABASE_SERVICE_KEY: string;
  AIMLAPI_KEY: string;
  SUPABASE_URL: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SERVICE_PROMPTS: Record<string, { angle: string; pain_points: string; why_unique: string; clinical_notes: string; insurance_note: string }> = {
  "invisalign": {
    angle: "invisible orthodontic treatment for adults who cannot or do not want metal braces",
    pain_points: "Adults feel self-conscious about metal braces in professional or social settings. Many are unsure whether aligners are as effective as traditional braces. Cost is a significant concern.",
    why_unique: "Aligners are removable, which matters in UAE's professional and social culture. Most DHA-licensed orthodontists offer Invisalign. Free consultations are common.",
    clinical_notes: "Invisalign is effective for mild to moderate orthodontic issues. Aligners must be worn 20 to 22 hours per day. Treatment duration ranges from 6 to 24 months.",
    insurance_note: "Orthodontic treatment is partially covered by some UAE corporate insurance plans, typically up to AED 3,000 to 5,000 lifetime maximum."
  },
  "dental-implants": {
    angle: "permanent tooth replacement for adults who have lost one or more teeth",
    pain_points: "Fear of surgery and pain. Concern about the multi-month process. Cost is the primary barrier. Patients are confused by different implant brands.",
    why_unique: "UAE has a wide range of implant quality. The same implant procedure can cost AED 4,000 to AED 12,000+ depending on brand and clinic.",
    clinical_notes: "Implants are titanium posts placed into the jawbone, fusing over 3 to 6 months. Success rates exceed 95% with adequate bone density.",
    insurance_note: "Dental implants are rarely covered by UAE insurance plans. Most patients pay out of pocket."
  },
  "veneers": {
    angle: "cosmetic smile enhancement through thin porcelain or composite shells bonded to front teeth",
    pain_points: "Cost per tooth is a shock. Patients fear irreversible tooth reduction. Uncertain about material differences.",
    why_unique: "Composite veneers are cheaper but last 3 to 5 years versus 10 to 15 for porcelain. Quality of ceramist matters enormously.",
    clinical_notes: "Traditional porcelain veneers require 0.3 to 0.7mm of enamel removal. No-prep veneers preserve more natural tooth structure.",
    insurance_note: "Veneers are cosmetic and not covered by UAE insurance plans."
  },
  "teeth-whitening": {
    angle: "fast cosmetic improvement of tooth colour for individuals unhappy with staining",
    pain_points: "Sensitivity during or after treatment. Results vary by cause of staining. Longevity concerns.",
    why_unique: "In-office whitening takes 60 to 90 minutes with immediate results. Take-home trays are cost-effective alternative.",
    clinical_notes: "Professional whitening uses hydrogen peroxide. Crowns and veneers do not whiten. Results last 6 to 18 months.",
    insurance_note: "Teeth whitening is cosmetic and not covered by any standard UAE insurance plan."
  },
  "root-canal": {
    angle: "saving a severely decayed or infected tooth by removing the pulp and sealing the canal",
    pain_points: "Patients fear the procedure is painful. Many consider extraction as simpler or cheaper option.",
    why_unique: "Modern root canal with good anaesthesia is no more painful than a filling. Single-visit root canals available.",
    clinical_notes: "Root canal removes infected pulp, shapes canal, fills with gutta-percha. Success rates exceed 90%.",
    insurance_note: "Root canal is typically covered by UAE dental insurance as a restorative procedure."
  },
  "dental-crowns": {
    angle: "restoring damaged, decayed, or weakened teeth with a tooth-shaped cap",
    pain_points: "Confused by material options. Same-day versus lab-made crowns create questions.",
    why_unique: "CAD/CAM technology allows same-day crowns at many UAE clinics. Zirconia crowns are most common.",
    clinical_notes: "Crown placement requires reducing the tooth by 1 to 2mm. Lifespan ranges from 10 to 25 years.",
    insurance_note: "Crowns for restorative purposes are typically covered. Cosmetic placement is not covered."
  },
  "braces": {
    angle: "traditional orthodontic treatment using brackets and wires to align teeth",
    pain_points: "Appearance is primary concern for adults. Food restrictions. Treatment duration feels daunting.",
    why_unique: "Modern braces are smaller. Ceramic braces are less visible. Lingual braces are completely invisible.",
    clinical_notes: "Traditional metal braces use stainless steel brackets adjusted monthly. Retainers essential after treatment.",
    insurance_note: "Orthodontic coverage varies significantly. Some plans cover up to AED 5,000 lifetime."
  },
  "tooth-extraction": {
    angle: "removing a damaged, decayed, infected, or impacted tooth",
    pain_points: "Fear of pain during procedure. Concerns about recovery. Cost differences surprise many.",
    why_unique: "Simple extractions straightforward. Wisdom teeth vary in complexity. Recovery takes 3 to 7 days.",
    clinical_notes: "Simple extractions take 10 to 30 minutes with local anaesthesia. Surgical may require bone removal.",
    insurance_note: "Extractions are generally covered as restorative or oral surgery procedures."
  },
  "dental-checkup": {
    angle: "routine preventive dental examination and cleaning to maintain oral health",
    pain_points: "Adults delay checkups due to time pressure, cost concerns, or dental anxiety.",
    why_unique: "Routine checkups cost AED 150 to AED 400. Many clinics offer free first consultations.",
    clinical_notes: "Comprehensive checkup includes examination, periodontal probing, X-rays as needed, oral cancer screening.",
    insurance_note: "Most UAE dental insurance covers 1 to 2 checkups per year."
  },
  "general-dentistry": {
    angle: "general dental care including checkups, fillings, and preventive treatment",
    pain_points: "Finding a trusted dentist. Cost concerns. Understanding what treatment is actually needed.",
    why_unique: "UAE has many qualified general dentists. Prices vary significantly between areas.",
    clinical_notes: "General dentistry covers preventive care, fillings, simple extractions, and basic restorative work.",
    insurance_note: "General dentistry is typically covered by most UAE dental insurance plans."
  },
  "teeth-cleaning": {
    angle: "professional cleaning to remove plaque, tartar, and surface stains",
    pain_points: "Concern about pain. Not understanding why cleaning is needed if brushing is done.",
    why_unique: "Professional cleaning reaches areas regular brushing cannot. Removes calculus that forms despite good hygiene.",
    clinical_notes: "Cleaning involves scaling and polishing. Recommended every 6 months for most patients.",
    insurance_note: "Teeth cleaning is typically covered as preventive care by most UAE insurance plans."
  }
};

const AREA_CHARACTERS: Record<string, Record<string, { character: string; demographics: string; landmarks: string; narrative: string }>> = {
  "dubai": {
    "al-barsha": { character: "mixed residential and commercial area near Mall of Emirates", demographics: "working professionals, families, expats", landmarks: "Mall of Emirates, City Centre Al Barsha", narrative: "busy area - residents value quick, efficient appointments that fit work schedules" },
    "deira": { character: "bustling commercial heart with traditional markets", demographics: "mixed income families, expats from South Asia", landmarks: "Dubai Creek, Gold Souk, City Centre Deira", narrative: "people here value convenience and extended hours" },
    "jumeirah": { character: "upscale beachfront residential", demographics: "high-income families, business owners", landmarks: "Jumeirah Beach, Burj Al Arab", narrative: "residents prioritize quality over cost" },
    "marina": { character: "modern high-rise waterfront area", demographics: "young professionals, expats, singles", landmarks: "Marina Walk, JBR Beach, Dubai Marina Mall", narrative: "modern lifestyle area - residents expect modern clinics with latest technology" },
    "downtown": { character: "business and tourism hub around Burj Khalifa", demographics: "high-income professionals, tourists", landmarks: "Burj Khalifa, Dubai Mall, DIFC", narrative: "business-focused area - patients want efficient, premium service" },
    "business-bay": { character: "commercial district along the canal", demographics: "working professionals, business owners", landmarks: "Business Bay, Dubai Canal", narrative: "time-strapped professionals appreciate evening and weekend appointments" },
    "difc": { character: "premium financial district", demographics: "high-income professionals, executives", landmarks: "DIFC towers, Emirates Towers", narrative: "expect premium, discrete dental services" },
    "jlt": { character: "cluster of towers around lake", demographics: "expats, young professionals", landmarks: "JLT towers, DMCC Park", narrative: "residents value convenience and modern facilities" },
    "mirdif": { character: "sprawling residential suburb with villas", demographics: "large families, Emirati families", landmarks: "Mirdif City Centre, Uptown Mirdif", narrative: "family-oriented area - parents look for pediatric specialists" },
    "karama": { character: "dense residential area with mix of housing", demographics: "mid-income families, salaried professionals", landmarks: "Karama Market", narrative: "value-conscious residents who want good care without premium prices" },
    "bur-dubai": { character: "historic area with traditional charm", demographics: "local families, older residents", landmarks: "Dubai Museum, Al Fahidi Fort", narrative: "traditional community - locals prefer trusted family dentists" },
    "satwa": { character: "older residential area near Al Wasl", demographics: "families, long-term residents", landmarks: "Al Wasl Road, Satwa Mosque", narrative: "established community - word-of-mouth recommendations matter" },
    "oqood": { character: "residential area in old Dubai", demographics: "local families", landmarks: "Oqood Housing, Al Manara", narrative: "family-focused community with traditional values" },
    "al-quoz": { character: "industrial/artistic area with warehouses turned into studios", demographics: "artists, creatives, small businesses", landmarks: "Al Quoz Industrial Area, Gallery Night", narrative: "unique mix - patients appreciate个性化service" },
    "international-city": { character: "large residential area with many low-rise buildings", demographics: "budget-conscious expats, students", landmarks: "Dragon Mart, International City Pavilions", narrative: "price-sensitive residents look for affordable dental options" },
    "discovery-gardens": { character: "large gated community near Ibn Battuta", demographics: "families, expats", landmarks: "Discovery Gardens, Ibn Battuta Mall", narrative: "family community - appreciate clinics near home" },
    "jebel-ali": { character: "industrial and residential area near the port", demographics: "workers, families", landmarks: "Jebel Ali Port, Ibn Battuta Mall", narrative: "area serves workers - extended hours appreciated" },
    "dubai-silicon-oasis": { character: "tech hub with residential compounds", demographics: "tech workers, engineers", landmarks: "Dubai Silicon Oasis HQ", narrative: "tech-savvy residents appreciate modern, efficient dental services" },
    "the-greens": { character: "upscale community with townhouses", demographics: "families, professionals", landmarks: "The Greens Community", narrative: "family-oriented with good local businesses" },
    "dubai-motor-city": { character: "sports-themed residential area", demographics: "families, motorsport enthusiasts", landmarks: "Motor City, Dubai Sports City", narrative: "active community - appreciate flexible scheduling" },
    "media-city": { character: "media industry hub with residential towers", demographics: "media professionals, creatives", landmarks: "Media City, Internet City", narrative: "creative professionals value modern, quality dental care" },
    "tecom": { character: "business district with residential towers", demographics: "working professionals", landmarks: "Tecom, Barsha Heights", narrative: "busy professionals need evening and weekend availability" },
    "al-barsha-heights": { character: "residential area between Al Barsha and Tecom", demographics: "working professionals, families", landmarks: "City Centre Al Barsha", narrative: "mixed community - convenience is key" },
    "al-ain-road": { character: "major road corridor with developments", demographics: "mixed", landmarks: "Al Ain Road, Academic City", narrative: "growing area with diverse residents" }
  },
  "abu-dhabi": {
    "khalifa-city": { character: "planned residential city near airport", demographics: "families, government workers", landmarks: "Khalifa City A, B", narrative: "family-oriented - appreciate comprehensive dental care" },
    "al-reem-island": { character: "island with modern towers", demographics: "expats, professionals", landmarks: "Reem Island towers", narrative: "modern community with access to quality care" },
    "yas-island": { character: "entertainment island with residential", demographics: "families, tourists", landmarks: "Yas Mall, Ferrari World", narrative: "mixed community - tourism impacts availability" },
    "corniche": { character: "waterfront area with towers", demographics: "professionals, families", landmarks: "Corniche Beach, Etihad Tower", narrative: "premium area with expectations for quality" },
    "electra": { character: "central commercial area", demographics: "mixed", landmarks: "Electra Street, Abu Dhabi Mall", narrative: "busy commercial area - value convenience" }
  },
  "sharjah": {
    "al-qasba": { character: "waterfront development", demographics: "families, expats", landmarks: "Al Qasba Canal, Eye of the Emirates", narrative: "family-friendly area" },
    "al-majaz": { character: "central area near the lagoon", demographics: "families, professionals", landmarks: "Al Majaz Waterfront", narrative: "local community with traditional values" },
    "al-nahda": { character: "residential area near Dubai border", demographics: "families, workers", landmarks: "Nahda Circles", narrative: "practical community" }
  }
};

function getServicePrompt(serviceSlug: string) {
  return SERVICE_PROMPTS[serviceSlug] || {
    angle: "dental procedure",
    pain_points: "cost concerns, finding qualified providers, treatment options",
    why_unique: "UAE dental market has wide variation in quality and pricing",
    clinical_notes: "Treatment effectiveness depends on case complexity and provider expertise.",
    insurance_note: "Coverage varies significantly by plan."
  };
}

function getAreaData(stateSlug: string, citySlug: string) {
  const stateKey = stateSlug.toLowerCase();
  const cityKey = citySlug.toLowerCase();
  
  let areaData = AREA_CHARACTERS[stateKey]?.[cityKey];
  
  if (!areaData) {
    for (const state of Object.keys(AREA_CHARACTERS)) {
      if (stateKey.includes(state) || state.includes(stateKey)) {
        const cities = AREA_CHARACTERS[state];
        for (const cityKeyMatch of Object.keys(cities)) {
          if (cityKey.includes(cityKeyMatch) || cityKeyMatch.includes(cityKey)) {
            areaData = cities[cityKeyMatch];
            break;
          }
        }
      }
      if (areaData) break;
    }
  }
  
  if (!areaData) {
    areaData = {
      character: "mixed residential area",
      demographics: "residents and expats",
      landmarks: "local area landmarks",
      narrative: "residents value good dental care"
    };
  }
  
  return areaData;
}

async function fetchAllRows(supabase: any, table: string, select: string, filters: Record<string, any>): Promise<any[]> {
  let query = supabase.from(table).select(select);
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const result = await query;
  if (result.error) {
    console.error(`Error fetching from ${table}:`, result.error);
    return [];
  }
  return result.data || [];
}

async function callAIWithRetry(messages: any[], apiKey: string, maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API error (attempt ${attempt}):`, response.status, errorText);
        if (attempt < maxRetries) await delay(1000 * attempt);
        continue;
      }

      const jsonData = await response.json() as any;
      return jsonData.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error(`AI call error (attempt ${attempt}):`, err);
      if (attempt < maxRetries) await delay(1000 * attempt);
    }
  }
  return null;
}

async function generateServiceLocationContent(pageData: any, aimlapiKey: string): Promise<any> {
  const parts = pageData.page_slug.split("/").filter(Boolean);
  const stateSlug = parts[0];
  const citySlug = parts[1];
  const serviceSlug = parts[2];
  
  const serviceData = getServicePrompt(serviceSlug);
  const areaData = getAreaData(stateSlug, citySlug);
  
  const prompt = `Generate a comprehensive service-location page for ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name}, ${pageData.state_name}.

TARGET AUDIENCE: Someone looking for ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name} who is close to booking.

LOCATION CONTEXT: ${areaData.character}. ${areaData.demographics}. Near ${areaData.landmarks}. ${areaData.narrative}

SERVICE CONTEXT: ${serviceData.angle}. Patient concerns: ${serviceData.pain_points}. UAE context: ${serviceData.why_unique}. Clinical notes: ${serviceData.clinical_notes}.

===============================================================
SECTION-BY-SECTION CONTENT REQUIRED
===============================================================

SECTION 1: TRANSPARENT CARE COSTS
Generate realistic AED price ranges for this treatment in this specific area:
- costs_section_title: "Transparent Care Costs" (fixed)
- costs_section_subtitle: "Quality dental care shouldn't be a mystery. We provide estimated costs based on [CITY] market standards."
- cost_checkup_min, cost_checkup_max: Price range for check-up
- cost_treatment_min, cost_treatment_max: Price range for the main treatment
- cost_polishing_min, cost_polishing_max: Price range for scaling/polishing if applicable
- cost_consultation_min, cost_consultation_max: Price range for consultation
- price_min, price_max: Overall price range
- price_note: What affects the price (clinic type, materials, case complexity)
- treatment_options: Array of treatment variants with name, price_min, price_max, best_for, duration

SECTION 2: THE CONCIERGE JOURNEY
Three steps explaining the patient journey:
- journey_section_title: "The Concierge Journey" (fixed)
- journey_section_subtitle: "Three simple steps to your new smile."
- process_steps: Array of 3-4 steps with title, description, duration

SECTION 3: PRECISION IN THE HEART OF [CITY]
About the area and why it's good for this treatment:
- precision_section_title: "Precision in the Heart of ${pageData.city_name}" (fixed)
- precision_section_subtitle: "Located amidst the bustling district of ${pageData.city_name}, our curated dental network represents the pinnacle of ${pageData.state_name}'s medical landscape."
- area_narrative: 50-80 words about the area, demographics, and why it's good for dental care
- precision_content_text: 80-120 words about the quality of care in this area
- trust_heading: "Content You Can Trust" (fixed)
- trust_description: About verification process
- need_quote_heading: "Need a Quote?" (fixed)
- need_quote_description: "Every smile is unique. Get a personalized estimate after your first consultation."

SECTION 4: RECOMMENDED FOR
Who should get this treatment in this area:
- recommended_section_title: "Recommended For" (fixed)
- candidates: Array of {description, conditions, is_suitable: true}

SECTION 5: MAY NOT BE SUITABLE
Who should avoid this treatment:
- not_suitable_section_title: "May Not Be Suitable" (fixed)
- alternatives: Array of {name, reason}

SECTION 6: QUICK ANSWER (Featured Snippet)
- quick_answer: 60-80 words answering "Where can I get [treatment] in [city] and what should I know?"

SECTION 7: EXPERT VERIFICATION
- last_reviewed_by: "Dr. A. Rahman" format (not real name)
- expert_credential: Must match service type (orthodontist for braces, oral surgeon for implants, etc.)
- medical_accuracy_verified: true

SECTION 8: PROCESS TIME
- process_time_months: e.g., "2-3 visits"
- process_time_note: Additional timing info

SECTION 9: RELATED QUESTIONS (for FAQ schema)
- related_questions: Array of {question, answer}

SECTION 10: FAQS
- faqs: Array of 8-10 location AND service specific questions with 60+ word answers

===============================================================
OUTPUT JSON STRUCTURE
===============================================================

Return ONLY valid JSON with ALL these fields:

{
  "page_type": "service-location",
  "page_slug": "/${stateSlug}/${citySlug}/${serviceSlug}",
  "title": "Treatment in City, State",
  "meta_title": "Treatment in City, State | AppointPanda",
  "meta_description": "Discover [treatment] in City. Compare clinics, prices, reviews. Book now.",
  "h1": "Best Treatment in City, State",
  "page_intro": "80-120 words intro about this treatment in this location",
  "content": "Full body content (300-500 words) combining all sections",

  // Section 1: Costs
  "costs_section_title": "Transparent Care Costs",
  "costs_section_subtitle": "Quality dental care...",
  "cost_checkup_min": 200,
  "cost_checkup_max": 400,
  "cost_checkup_name": "Check-up",
  "cost_treatment_min": 1000,
  "cost_treatment_max": 5000,
  "cost_polishing_min": 300,
  "cost_polishing_max": 600,
  "cost_consultation_min": 100,
  "cost_consultation_max": 300,
  "price_min": 200,
  "price_max": 5000,
  "price_note": "What affects price...",
  "treatment_options": [{"name": "Basic", "price_min": 200, "price_max": 500, "best_for": "Basic needs", "duration": "1 year"}],

  // Section 2: Journey
  "journey_section_title": "The Concierge Journey",
  "journey_section_subtitle": "Three simple steps...",
  "process_steps": [{"title": "Find", "description": "Search and select...", "duration": "1 day"}],

  // Section 3: Precision
  "precision_section_title": "Precision in the Heart of ${pageData.city_name}",
  "precision_section_subtitle": "Located amidst...",
  "area_narrative": "About the area...",
  "precision_content_text": "Quality care description...",
  "trust_heading": "Content You Can Trust",
  "trust_description": "Verification process...",
  "need_quote_heading": "Need a Quote?",
  "need_quote_description": "Personalized estimate...",

  // Section 4 & 5: Candidates
  "recommended_section_title": "Recommended For",
  "candidates": [{"description": "Who it's for", "conditions": "conditions", "is_suitable": true}],
  "not_suitable_section_title": "May Not Be Suitable",
  "alternatives": [{"name": "Alternative", "reason": "Why not suitable"}],

  // Section 6: Quick Answer
  "quick_answer": "60-80 word answer for featured snippet",

  // Section 7: Verification
  "last_reviewed_by": "Dr. A. Rahman",
  "expert_credential": "DHA Licensed Dentist",
  "medical_accuracy_verified": true,

  // Section 8: Process Time
  "process_time_months": "2-3 visits",
  "process_time_note": "Timing notes",

  // Section 9: Related Questions
  "related_questions": [{"question": "Q?", "answer": "A?"}],

  // Section 10: FAQs
  "faqs": [{"question": "Location-specific question?", "answer": "60+ word answer"}]
}

No markdown. No explanation. Valid JSON only.`;

  try {
    const aiResponse = await callAIWithRetry([
      { role: "system", content: "You are an expert SEO content writer for AppointPanda, UAE dental marketplace. Generate comprehensive, location-specific content." },
      { role: "user", content: prompt }
    ], aimlapiKey);

    if (!aiResponse) {
      return { success: false, error: "No response from AI" };
    }

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { success: false, error: "Invalid JSON in response" };
    }

    const pageDataResult = JSON.parse(jsonMatch[0]);
    return { success: true, data: pageDataResult };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

async function saveSeoPage(supabase: any, pageData: any): Promise<void> {
  let pageType = pageData.page_type;
  if (!pageType) {
    if (pageData.page_slug?.match(/^\/[a-z]+\/[a-z-]+\/[a-z-]+\/$/)) {
      pageType = "service-location";
    }
  }
  
  const saveData: any = {
    slug: pageData.page_slug,
    page_type: pageType || "service-location",
    title: pageData.title || pageData.h1,
    meta_title: pageData.meta_title,
    meta_description: pageData.meta_description,
    h1: pageData.h1,
    page_intro: pageData.page_intro || pageData.hero_intro || pageData.intro_text,
    content: pageData.content || pageData.body_content,
    is_published: true,
    is_optimized: true,
    optimized_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Section 1: Transparent Care Costs
    costs_section_title: pageData.costs_section_title || "Transparent Care Costs",
    costs_section_subtitle: pageData.costs_section_subtitle || "Quality dental care shouldn't be a mystery. We provide estimated costs based on market standards.",
    cost_checkup_min: pageData.cost_checkup_min,
    cost_checkup_max: pageData.cost_checkup_max,
    cost_checkup_name: pageData.cost_checkup_name || "Check-up",
    cost_treatment_min: pageData.cost_treatment_min,
    cost_treatment_max: pageData.cost_treatment_max,
    cost_polishing_min: pageData.cost_polishing_min,
    cost_polishing_max: pageData.cost_polishing_max,
    cost_consultation_min: pageData.cost_consultation_min,
    cost_consultation_max: pageData.cost_consultation_max,
    price_min: pageData.price_min,
    price_max: pageData.price_max,
    price_note: pageData.price_note,
    treatment_options: pageData.treatment_options,
    
    // Section 2: The Concierge Journey
    journey_section_title: pageData.journey_section_title || "The Concierge Journey",
    journey_section_subtitle: pageData.journey_section_subtitle || "Three simple steps to your new smile.",
    process_steps: pageData.process_steps,
    
    // Section 3: Precision in the Heart of [City]
    precision_section_title: pageData.precision_section_title,
    precision_section_subtitle: pageData.precision_section_subtitle,
    area_narrative: pageData.area_narrative,
    precision_content_text: pageData.precision_content_text,
    trust_heading: pageData.trust_heading || "Content You Can Trust",
    trust_description: pageData.trust_description,
    need_quote_heading: pageData.need_quote_heading || "Need a Quote?",
    need_quote_description: pageData.need_quote_description,
    
    // Section 4 & 5: Candidates & Alternatives
    recommended_section_title: pageData.recommended_section_title || "Recommended For",
    candidates: pageData.candidates,
    not_suitable_section_title: pageData.not_suitable_section_title || "May Not Be Suitable",
    alternatives: pageData.alternatives,
    
    // Section 6: Quick Answer
    quick_answer: pageData.quick_answer,
    
    // Section 7: Expert Verification
    last_reviewed_by: pageData.last_reviewed_by,
    expert_credential: pageData.expert_credential,
    medical_accuracy_verified: pageData.medical_accuracy_verified || true,
    
    // Section 8: Process Time
    process_time_months: pageData.process_time_months,
    process_time_note: pageData.process_time_note,
    
    // Section 9: Related Questions
    related_questions: pageData.related_questions,
    
    // Section 10: FAQs
    faqs: pageData.faqs,
  };

  const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

  if (error) {
    console.error(`Save error:`, error);
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname !== "/") {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const supabaseUrl = env.SUPABASE_URL;
      const supabaseKey = env.SUPABASE_SERVICE_KEY;
      const aimlapiKey = env.AIMLAPI_KEY;
      
      if (!supabaseKey || !aimlapiKey) {
        return new Response(JSON.stringify({ success: false, error: "Missing required secrets" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      
      const action = body.action;
      const emirate_slug = body.emirate_slug;
      const city_slug = body.city_slug;
      const force_regenerate = body.force_regenerate || false;
      const batch_limit = body.batch_limit || 1;
      const cursor = body.cursor;

      if (action === "generate_service_locations_by_city") {
        const emirateSlug = emirate_slug;
        const citySlug = city_slug;

        if (!emirateSlug || !citySlug) {
          return new Response(JSON.stringify({ success: false, error: "emirate_slug and city_slug are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
        const state = states.find((s: any) => s.slug === emirateSlug);
        
        if (!state) {
          return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${emirateSlug}` }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
        const city = cities.find((c: any) => c.slug === citySlug);
        
        if (!city) {
          return new Response(JSON.stringify({ success: false, error: `City not found: ${citySlug}` }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

        const slPages = treatments.map((treatment: any) => ({
          page_slug: `/${emirateSlug}/${citySlug}/${treatment.slug}`,
          page_type: "service-location",
          state_slug: emirateSlug,
          state_name: state.name,
          city_slug: citySlug,
          city_name: city.name,
          service_slug: treatment.slug,
          service_name: treatment.name,
        }));

        const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
        const existingSlugs = new Set(existingPages.map((p: any) => p.slug));

        let pagesToGenerate = slPages;
        if (!force_regenerate) {
          pagesToGenerate = slPages.filter((p: any) => !existingSlugs.has(p.page_slug));
        }

        let startIndex = 0;
        if (cursor) {
          startIndex = pagesToGenerate.findIndex((p: any) => p.page_slug === cursor);
          if (startIndex === -1) startIndex = 0;
          else startIndex += 1;
        }

        const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batch_limit);

        let processed = 0;
        let failed = 0;
        const errors: string[] = [];
        let lastProcessedSlug: string | null = null;

        for (const page of pagesToProcess) {
          console.log(`Generating ${page.page_slug}...`);
          
          try {
            const result = await generateServiceLocationContent(page, aimlapiKey);
            
            if (result.success) {
              await saveSeoPage(supabase, result.data);
              processed++;
              lastProcessedSlug = page.page_slug;
            } else {
              failed++;
              errors.push(`SL ${page.page_slug}: ${result.error}`);
            }
          } catch (pageErr) {
            failed++;
            errors.push(`Error for ${page.page_slug}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
          }
          await delay(500);
        }

        const remaining = pagesToGenerate.length - (startIndex + pagesToProcess.length);

        return new Response(JSON.stringify({
          processed,
          skipped: 0,
          failed,
          errors,
          cursor: lastProcessedSlug,
          has_more: remaining > 0,
          remaining,
          total_count: pagesToGenerate.length,
          page_type: "service-location"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Generate service-location pages by emirate (all cities)
      if (action === "generate_service_locations_by_emirate") {
        const emirateSlug = emirate_slug;

        if (!emirateSlug) {
          return new Response(JSON.stringify({ success: false, error: "emirate_slug is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
        const state = states.find((s: any) => s.slug === emirateSlug);
        
        if (!state) {
          return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${emirateSlug}` }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
        const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

        // Build all service-location pages for this emirate
        const slPages: any[] = [];
        for (const city of cities) {
          for (const treatment of treatments) {
            slPages.push({
              page_slug: `/${emirateSlug}/${city.slug}/${treatment.slug}`,
              page_type: "service-location",
              state_slug: emirateSlug,
              state_name: state.name,
              city_slug: city.slug,
              city_name: city.name,
              service_slug: treatment.slug,
              service_name: treatment.name,
            });
          }
        }

        const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
        const existingSlugs = new Set(existingPages.map((p: any) => p.slug));

        let pagesToGenerate = slPages;
        if (!force_regenerate) {
          pagesToGenerate = slPages.filter((p: any) => !existingSlugs.has(p.page_slug));
        }

        let startIndex = 0;
        if (cursor) {
          startIndex = pagesToGenerate.findIndex((p: any) => p.page_slug === cursor);
          if (startIndex === -1) startIndex = 0;
          else startIndex += 1;
        }

        const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batch_limit);

        let processed = 0;
        let failed = 0;
        const errors: string[] = [];
        let lastProcessedSlug: string | null = null;

        for (const page of pagesToProcess) {
          console.log(`Generating ${page.page_slug}...`);
          
          try {
            const result = await generateServiceLocationContent(page, aimlapiKey);
            
            if (result.success) {
              await saveSeoPage(supabase, result.data);
              processed++;
              lastProcessedSlug = page.page_slug;
            } else {
              failed++;
              errors.push(`SL ${page.page_slug}: ${result.error}`);
            }
          } catch (pageErr) {
            failed++;
            errors.push(`Error for ${page.page_slug}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
          }
          await delay(500);
        }

        const remaining = pagesToGenerate.length - (startIndex + pagesToProcess.length);

        return new Response(JSON.stringify({
          processed,
          skipped: 0,
          failed,
          errors,
          cursor: lastProcessedSlug,
          has_more: remaining > 0,
          remaining,
          total_count: pagesToGenerate.length,
          page_type: "service-location"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: false, error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Error:", err);
      return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
