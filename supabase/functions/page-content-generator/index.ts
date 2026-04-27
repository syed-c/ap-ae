import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ========================== UNIQUENESS SEEDING SYSTEM ==========================
// These arrays ensure every page gets a deterministically different angle,
// format, persona, and hook — so no two pages ever feel the same.

const READER_PERSONAS = [
  "a working professional who has been putting off dental care for months due to a packed schedule",
  "a parent booking dental appointments for the whole family in one go",
  "an expat who is new to the UAE and does not know how the dental system works here",
  "someone who had a bad experience at a previous clinic and is now cautious",
  "a budget-conscious resident who needs proper care without overspending",
  "someone in pain right now, looking for a solution today",
  "a first-time patient who has never had this specific treatment before",
  "a resident who has done their research and now just needs to find the right clinic nearby",
];

const OPENING_HOOKS = [
  "Start with a very specific, observable fact about this area and how it shapes the way people access dental care.",
  "Start with the single most common thing people get wrong when looking for this treatment in this area.",
  "Start with the honest answer to the question most people in this area are actually asking.",
  "Start by describing a realistic scenario a local patient would recognise from their own life.",
  "Start with the most important thing to check before booking this treatment anywhere in this city.",
  "Start with a direct, grounded comparison to help readers understand what good looks like versus average.",
  "Start with the practical reality of getting this treatment done while living or working in this area.",
  "Start by explaining what makes this area's clinic landscape different from other parts of the emirate.",
  "Start with the cost question everyone has but few pages answer honestly.",
  "Start with what the area's residents typically prioritise, and why that shapes clinic choices here.",
];

const CONTENT_FORMATS = [
  "FORMAT_LIFESTYLE: Lead with the area's daily rhythm, then explain how dental care fits into it.",
  "FORMAT_PROBLEM: Lead with the main challenge residents face, then walk through realistic solutions.",
  "FORMAT_PRACTICAL: Lead with the most useful practical information, then add local context.",
  "FORMAT_COMPARISON: Lead with an honest comparison of what good versus average looks like in this area.",
];

const CTA_STYLES = [
  "Calm and helpful: suggest AppointPanda as the easiest way to compare DHA-licensed clinics nearby.",
  "Practical: point out that AppointPanda lists real clinics with verified credentials in this area.",
  "Direct: explain that searching on AppointPanda takes less time than calling multiple clinics.",
  "Trust-first: emphasise that all clinics on AppointPanda are verified and licensed in UAE.",
  "Comparison-focused: suggest using AppointPanda to see which clinics near you offer this treatment.",
];

// Deterministic hash to assign unique combinations per page
function pageHash(serviceSlug: string, citySlug: string, stateSlug: string): number {
  const key = `${stateSlug}|${citySlug}|${serviceSlug}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getPageSeed(serviceSlug: string, citySlug: string, stateSlug: string) {
  const h = pageHash(serviceSlug, citySlug, stateSlug);
  return {
    persona: READER_PERSONAS[h % READER_PERSONAS.length],
    hook: OPENING_HOOKS[Math.floor(h / READER_PERSONAS.length) % OPENING_HOOKS.length],
    format: CONTENT_FORMATS[Math.floor(h / (READER_PERSONAS.length * OPENING_HOOKS.length)) % CONTENT_FORMATS.length],
    cta: CTA_STYLES[Math.floor(h / (READER_PERSONAS.length * OPENING_HOOKS.length * CONTENT_FORMATS.length)) % CTA_STYLES.length],
  };
}

// ========================== KEYWORD GENERATION (NO SERPAPI) ==========================

interface KeywordSet {
  primary1: string;   // e.g. "General Dentistry in Al Barsha"  — used EXACTLY 2x in body
  primary2: string;   // e.g. "dental check-up Al Barsha Dubai" — used EXACTLY 2x in body
  secondary: string;  // e.g. "best dentists for general dentistry" — used EXACTLY 2x in body
}

function generateServiceLocationKeywords(serviceSlug: string, cityName: string, stateName: string): KeywordSet {
  const serviceName = serviceSlug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const h = pageHash(serviceSlug, cityName.toLowerCase().replace(/\s+/g, "-"), stateName.toLowerCase());

  // Primary keyword variants — rotate to avoid every page using identical pattern
  const primary1Options = [
    `${serviceName} in ${cityName}`,
    `${serviceName} in ${cityName}, ${stateName}`,
    `${cityName} ${serviceName}`,
  ];
  const primary2Options = [
    `best ${serviceSlug.replace(/-/g, " ")} in ${cityName}`,
    `${cityName} dental clinics ${serviceSlug.replace(/-/g, " ")}`,
    `affordable ${serviceSlug.replace(/-/g, " ")} ${cityName}`,
    `${serviceSlug.replace(/-/g, " ")} clinics near ${cityName}`,
  ];
  const secondaryOptions = [
    `best dentists for ${serviceSlug.replace(/-/g, " ")}`,
    `${serviceSlug.replace(/-/g, " ")} ${stateName}`,
    `find ${serviceSlug.replace(/-/g, " ")} clinic ${stateName}`,
    `${serviceSlug.replace(/-/g, " ")} cost ${stateName}`,
  ];

  return {
    primary1: primary1Options[h % primary1Options.length],
    primary2: primary2Options[(h + 1) % primary2Options.length],
    secondary: secondaryOptions[(h + 2) % secondaryOptions.length],
  };
}

// ========================== SERVICE PROMPTS ==========================

const SERVICE_PROMPTS: Record<string, any> = {
  "general-dentistry": {
    angle: "general dental care",
    pain_points: "fear of pain, cost concerns, finding a trusted dentist",
    why_unique: "UAE has mix of premium and affordable clinics. Many offer Saturday-Sunday hours for workers.",
    clinical_notes: "Checkups include examination, X-rays if needed, cleaning recommendation. DHA license required for all dentists.",
    insurance_note: "Most plans cover 2 annual checkups. Coverage for fillings varies."
  },
  "dental-checkup": {
    angle: "preventive care",
    pain_points: "fear of pain, not knowing what to expect",
    why_unique: "UAE clinics are modern and hygienic. Many offer free first checkup with booking.",
    clinical_notes: "Standard examination takes 15-20 minutes. Digital X-rays use minimal radiation.",
    insurance_note: "Usually fully covered under preventive care."
  },
  "teeth-cleaning": {
    angle: "hygiene and prevention",
    pain_points: "sensitivity, concerns about pain",
    why_unique: "Professional cleaning in UAE uses ultrasonic tools. Deep cleaning available for tougher cases.",
    clinical_notes: "Scaling removes plaque and tartar. Polishing removes stains. May cause temporary sensitivity.",
    insurance_note: "Often partially covered. Deep cleaning may need pre-authorization."
  },
  "teeth-whitening": {
    angle: "cosmetic improvement",
    pain_points: "sensitivity, fake-looking results",
    why_unique: "UAE offers in-office laser whitening and take-home kits. Regulations ensure safe products.",
    clinical_notes: "In-office: 1-2 hours, immediate results. Take-home: 1-2 weeks. Temporary sensitivity common.",
    insurance_note: "Rarely covered — considered cosmetic."
  },
  "invisalign": {
    angle: "clear aligner orthodontics",
    pain_points: "cost, whether it works, treatment duration",
    why_unique: "Invisalign is popular in UAE among professionals. Multiple clinics offer it.",
    clinical_notes: "Treatment duration: 6-18 months depending on complexity. Must wear 20-22 hours daily. Regular checkups needed.",
    insurance_note: "Some plans cover orthodontics, often with age limits and waiting periods."
  },
  "dental-veneers": {
    angle: "cosmetic restoration",
    pain_points: "cost, tooth removal, longevity",
    why_unique: "E-max and zirconia veneers popular in UAE for durability and aesthetics.",
    clinical_notes: "Requires tooth preparation. Porcelain lasts 10-15 years. Composite is cheaper but lasts less long.",
    insurance_note: "Rarely covered — cosmetic procedure."
  },
  "dental-implants": {
    angle: "tooth replacement",
    pain_points: "cost, surgery fear, healing time",
    why_unique: "UAE has experienced oral surgeons. Implants from reputable brands available.",
    clinical_notes: " titanium post + crown. Healing takes 3-6 months. Best long-term tooth replacement option.",
    insurance_note: "Often covered as major procedure, may have waiting period."
  },
  "root-canal": {
    angle: "root canal treatment",
    pain_points: "pain during procedure, success rate",
    why_unique: "Modern RCT is painless with good anesthesia. Single-visit options available.",
    clinical_notes: "Saves natural tooth. Crown needed after for protection. Success rate 85-95%.",
    insurance_note: "Usually covered as restorative procedure."
  },
  "tooth-extraction": {
    angle: "removal procedure",
    pain_points: "pain, swelling, wisdom teeth concerns",
    why_unique: "Simple extractions straightforward. Surgical extractions for impacted wisdom teeth available.",
    clinical_notes: "Simple: 10-30 min with local anesthetic. Surgical: longer, may need sedation.",
    insurance_note: "Covered as oral surgery. Wisdom teeth often require pre-authorization."
  },
  "dental-crown": {
    angle: "tooth restoration",
    pain_points: "cost, material choice, longevity",
    why_unique: "E-max and zirconia crowns popular in UAE for durability and aesthetics.",
    clinical_notes: "Full coverage for damaged teeth. Types: metal, porcelain-fused-to-metal, all-ceramic. 10-15 year lifespan.",
    insurance_note: "Usually covered, but may have co-pay for premium materials."
  },
  "dentures": {
    angle: "full or partial tooth replacement",
    pain_points: "comfort, fit, appearance",
    why_unique: "Modern dentures are comfortable and natural-looking. Implant-supported options available.",
    clinical_notes: "Full dentures: complete tooth loss. Partial: clip onto existing teeth. Adjustment period normal.",
    insurance_note: "Usually covered as major procedure."
  },
  "pediatric-dentistry": {
    angle: "children's dental care",
    pain_points: "child fear, behavior management",
    why_unique: "Pediatric specialists in UAE use child-friendly approaches. Many clinics have play areas.",
    clinical_notes: "First visit: age 1 or first tooth. Focus on prevention and positive experience.",
    insurance_note: "Usually covered under pediatric dental benefits."
  },
  "emergency-dentistry": {
    angle: "urgent dental care",
    pain_points: "severe pain, swelling, trauma",
    why_unique: "Some UAE clinics offer 24/7 emergency care. Private hospitals have dental ERs.",
    clinical_notes: "Knocked-out tooth: store in milk, come immediately. Severe pain: may need antibiotics first.",
    insurance_note: "Emergency care usually covered. Check your plan for 24/7 provisions."
  },
};

function getServicePrompt(serviceSlug: string) {
  return SERVICE_PROMPTS[serviceSlug] || {
    angle: "dental procedure",
    pain_points: "cost concerns, finding qualified providers, treatment options",
    why_unique: "UAE dental market has wide variation in quality and pricing",
    clinical_notes: "Treatment effectiveness depends on case complexity and provider expertise. Always verify DHA or DOH licensing.",
    insurance_note: "Coverage varies significantly by plan. Check with your provider for specific benefits."
  };
}

// ========================== AREA DATA ==========================

const AREA_PROMPTS: Record<string, any> = {
  "dubai": {
    character: "cosmopolitan hub with premium and affordable options",
    demographics: "expats, professionals, families, tourists",
    landmarks: "Burj Khalifa, Dubai Mall, Palm Jumeirah, DIFC, Marina",
    narrative: "residents expect high standards. Many clinics in Marina, Downtown, DIFC offer premium care. More affordable options in Al Qusais, Deira. Saturday-Friday work week."
  },
  "abu-dhabi": {
    character: "capital with growing dental market",
    demographics: "families, professionals, government workers",
    landmarks: "Yas Island, Corniche, Saadiyat Beach, ADNEC",
    narrative: "residents value quality. Corniche area has premium clinics. Al Reem Island growing fast. Generally good availability."
  },
  "sharjah": {
    character: "conservative northern emirate",
    demographics: "families, students, budget-conscious residents",
    landmarks: "Mega Mall, Al Noor Mosque, Sharjah Park",
    narrative: "generally more affordable than Dubai. Good for families. Some clinics offer packages. Crowded on weekends."
  },
  "al-ain": {
    character: "garden city with limited options",
    demographics: "families, students, retirees",
    landmarks: "Al Ain Zoo, Camel Market, Heritage Village",
    narrative: "limited specialist options. Some residents travel to Abu Dhabi. Good for general dentistry."
  },
  "ajman": {
    character: "small emirate with budget options",
    demographics: "budget-conscious residents, workers",
    landmarks: "Ajman City Center, Marina",
    narrative: "most affordable emirate. Growing number of clinics. Good for basic dentistry."
  },
  "ras-al-khaimah": {
    character: "tourist destination with growing healthcare",
    demographics: "tourists, families, retired expats",
    landmarks: "Marjan Island, Ras Al Khaimah Corniche",
    narrative: "limited specialist options. Good for general dentistry. Emergency cases may need Dubai."
  },
  "fujairah": {
    character: "mountain emirate with limited options",
    demographics: "local families, mountain residents",
    landmarks: "Fujairah Fort, Khor Fakkan",
    narrative: "limited dental options. Some residents go to Sharjah or Dubai. Good for basic care."
  },
  "umm-al-quwain": {
    character: "small emirate with few options",
    demographics: "fishermen, local families, workers",
    landmarks: "UAQ Marina, Falaj Al Mualla",
    narrative: "few dental clinics. May need to travel to Sharjah or Ajman for specialized care."
  },
};

function getAreaData(emirateSlug: string, citySlug: string) {
  const key = emirateSlug;
  const areaData = AREA_PROMPTS[key];
  
  if (areaData) {
    // Add some city-specific variations
    const cityVariations: Record<string, any> = {
      "al-barsha": { character: "busy residential/commercial area with malls and clinics", landmarks: "Mall of the Emirates, City Centre", narrative: "mix of residents. Many affordable clinics near Mall of Emirates. Good parking options." },
      "marina": { character: "premium waterfront living", landmarks: "Dubai Marina, JLT", narrative: "expats and professionals. Premium clinics. Higher prices but quality options." },
      "downtown": { character: "business district", landmarks: "Burj Khalifa, DIFC", narrative: "convenient for workers. Premium clinics. Can be crowded." },
      "jlt": { character: "tower clusters near marina", landmarks: "JLT Towers, Cluster T", narrative: "residential area. Many clinics in JLT. Good availability." },
      "deira": { character: "old Dubai trading area", landmarks: "Gold Souk, Creek", narrative: "affordable clinics. Can be busy. Good for budget care." },
      "jebel-ali": { character: "far west residential", landmarks: "The Gardens, Jebel Ali Beach", narrative: "far from center. Limited clinics. Some residents go to Marina." },
      "motor-city": { character: "south residential for families", landmarks: "Motor City, Sports City", narrative: "family area. Growing number of clinics. Good for residents." },
      "sports-city": { character: "sports and residential complex", landmarks: "Dubai Sports City, The Springs", narrative: "family-friendly. Growing local businesses." },
      "greens": { character: "greens community area", landmarks: "The Greens, Media City", narrative: "residential area near Media City. Good for residents." },
    };
    
    if (citySlug && cityVariations[citySlug]) {
      return { ...areaData, ...cityVariations[citySlug] };
    }
  }
  
  if (areaData) {
    return areaData;
  }
  
  // Default fallback
  return {
    character: "residential area with mix of clinics",
    demographics: "working professionals and families",
    landmarks: "local shopping centers",
    narrative: "residents typically look for convenient dental care near home or work."
  };
}

// ========================== MAIN SYSTEM PROMPT (v3.0 — No SerpAPI, AI-Native) ==========================

const SYSTEM_PROMPT = `You are the lead content strategist for AppointPanda, the UAE's dental clinic discovery platform. AppointPanda is a DIRECTORY — it helps people FIND and COMPARE clinics, not book with AppointPanda directly. Always write from the perspective of a helpful, knowledgeable guide, not a service provider.

Your content must pass one test: would a real person in this area, needing this dental treatment, find this page genuinely useful and stay to read it?

================================================================
DIRECTORY IDENTITY — ALWAYS KEEP THIS IN MIND
================================================================

AppointPanda lists and helps people discover DHA/DOH-licensed dental clinics across UAE.
It does NOT provide dental services.
Content must reflect this: help readers understand what to look for, what to expect, and how to use AppointPanda to find the right clinic near them.

Framing:
- CORRECT: "Use AppointPanda to compare clinics near you in Al Barsha"
- WRONG: "Book your appointment with us today"
- CORRECT: "AppointPanda lists verified clinics in this area with real patient reviews"
- WRONG: "Our expert dentists are ready to help"

================================================================
WRITING VOICE — SIMPLE, NATURAL, ENGAGING
================================================================

Write like a smart friend explaining things over coffee. Not a doctor. Not a sales rep.

Rules:
- Short sentences. Most sentences under 20 words.
- Explain every dental term the first time you use it (e.g., "Invisalign, a type of clear plastic aligner that you wear over your teeth instead of metal braces")
- Use "you" often — address the reader directly
- Never sound robotic or template-like
- Vary the rhythm: short sentence. Then a longer one that adds detail or context. Then maybe a question.
- Keep people reading by being honest, a little opinionated, and genuinely useful

NEVER use:
- Em-dashes (—)
- "world-class," "state-of-the-art," "comprehensive," "unmatched," "best-in-class"
- "smile transformation," "dental journey," "expert team"
- Any statistic you cannot verify (no "73% of residents...")
- Clinic names, doctor full names, or fabricated addresses

================================================================
GOOGLE E-E-A-T COMPLIANCE
================================================================

Every page must demonstrate:
- EXPERIENCE: Observations that feel lived-in. Real patterns from UAE dental market.
- EXPERTISE: Clinically accurate procedural descriptions. Honest about risks and limitations.
- AUTHORITATIVENESS: Reference real UAE regulators: DHA (Dubai), DOH (Abu Dhabi), MOH.
- TRUSTWORTHINESS: Never invent facts. Frame estimates as estimates: "typically," "usually," "in most cases."

================================================================
FACTUAL RULES
================================================================

1. No invented clinic names, doctor names, or addresses
2. No invented statistics presented as fact
3. Price ranges: frame as estimates with context ("clinics in this area typically charge AED X to AED Y, depending on...")
4. Clinical descriptions must be accurate — do not describe procedures incorrectly
5. Observable patterns are fine: "many clinics in this area..." is acceptable
6. DHA = Dubai. DOH = Abu Dhabi. HAAD is now DOH. MOH = federal level. Use correctly.

================================================================
CONTENT STRUCTURE PHILOSOPHY
================================================================

Each page tells one specific story. The story is: what is it like to get THIS specific treatment as someone who lives in THIS specific area?

If you could swap the location name and it would still work — you have failed. Rewrite.

If you could swap the service name and it would still work — you have failed. Rewrite.

The combination of location + service must be unique and inseparable in every section.

================================================================
SEO — INTEGRATED, NATURAL
================================================================

Keywords must fit naturally into sentences. If a keyword feels forced, rewrite the sentence.
Primary keywords: used EXACTLY 2 times each in body content, NOT in headings.
Secondary keyword: used EXACTLY 2 times in body content, NOT in headings.
Meta title: under 60 characters. Clear. No stuffing.
Meta description: under 155 characters. Reads like a human wrote it.
Keywords array: exactly 3 terms.

================================================================
FAQ STANDARDS
================================================================

All FAQs must be specific to both the SERVICE and the LOCATION together — not just one or the other.
Wrong: "How much does Invisalign cost?" (service only)
Wrong: "Are there good dentists in Al Barsha?" (location only)
Right: "How much does Invisalign typically cost in Al Barsha, and are there mid-range options near Mall of Emirates?"

Each FAQ answer: minimum 60 words. Honest. Specific. Actionable.`;

// ==============================================================
// FINAL VALIDATION — RUN THIS BEFORE RETURNING
// ==============================================================

// Ask yourself honestly:

// [ ] Does this content feel like it was written specifically for this location or service?
// [ ] Would a local person recognise their area in this writing?
// [ ] Have I stated anything that could be false or misleading?
// [ ] Is there any generic dental marketing language I missed?
// [ ] Does any sentence contain an em-dash?
// [ ] Are all FAQs genuinely location- or service-specific?
// [ ] Would this page satisfy a user who came from Google with a real question?

// If any answer is no — rewrite before returning.`;

async function generateServiceContent(pageData: any, aimlapiKey: string, forceRegenerate: boolean): Promise<any> {
  const serviceSlug = pageData.slug.replace("services/", "");
  const serviceData = getServicePrompt(serviceSlug);

const prompt = `Generate a service page for ${serviceSlug.replace(/-/g, " ")} in UAE.

SERVICE CONTEXT:
* Treatment type: ${serviceSlug}
* Focus angle: ${serviceData.angle}
* Patient pain points: ${serviceData.pain_points}
* What makes UAE unique: ${serviceData.why_unique}
* Clinical notes: ${serviceData.clinical_notes}
* Insurance coverage: ${serviceData.insurance_note}

===============================================================
STRICT CONTENT REQUIREMENTS — MANDATORY
===============================================================

1. UNIQUE & HUMAN: Write like a human expert, not an AI. Every sentence must feel natural and original. NEVER use generic templates.

2. GOOGLE CORE UPDATE COMPLIANT:
   - Content must demonstrate Experience (E-E-A-T first hand)
   - Show Expertise with accurate clinical information
   - Build Trust through honest, verifiable claims
   - Be Authoritative by citing real UAE dental standards

3. INFO + COMMERCIAL HYBRID:
   - 70% informational: explain, educate, answer questions
   - 30% commercial: subtle clinic comparison, AppointPanda value

4. GRAMMAR & STYLE:
   - NO EM-DASHES (—) anywhere
   - Grammatically perfect sentences
   - No false information - every claim must be verifiable
   - No invented statistics - use "most patients" or "in straightforward cases"

5. STRICT JSON RULES:
   - Arrays: NO trailing commas - ["a", "b", "c"] is correct, ["a", "b", "c",] is WRONG
   - Objects: NO trailing commas - {"key": "value"} is correct, {"key": "value",} is WRONG
   - Boolean: use lowercase "true" or "false" (NOT "True" or "False")
   - Numbers: use plain integers (NOT "AED 500" - use 500)
   - Every array must have proper comma separation

6. VALIDATION BEFORE OUTPUT:
   - Count all brackets: { must have }, [ must have ]
   - Check no trailing commas anywhere in the JSON
   - Ensure all strings are properly quoted

===============================================================
PAGE PURPOSE — READ THIS CAREFULLY
===============================================================

This is an informational-commercial hybrid page. That means:

INFORMATIONAL (70% of the content):
- What is this treatment, explained accurately
- How the procedure actually works, step by step
- Realistic cost ranges in AED
- How long it takes — total treatment time and individual visits
- Who is a good candidate and who is not
- What the recovery or aftercare looks like
- What can go wrong and how good clinics prevent it
- How to evaluate whether a clinic is trustworthy for this treatment

COMMERCIAL (30% of the content):
- Why AppointPanda makes finding the right clinic easier
- The value of comparing multiple DHA or DOH licensed clinics
- A clear, low-pressure CTA

The ratio matters. If this reads like a sales page, it will not rank. If it reads like a genuine guide, it will.

================================================================
CLINICAL ACCURACY — MANDATORY
================================================================

Every procedural claim must be accurate. Use the following as your accuracy benchmark:

- Describe the treatment process in the correct clinical sequence
- Do not exaggerate benefits or downplay legitimate risks
- If a treatment has common side effects, mention them honestly (e.g., sensitivity after whitening, swelling after extractions)
- Frame all price ranges as estimates, not guarantees: "typically between AED X and AED Y depending on case complexity and clinic"
- Reference DHA (Dubai) or DOH (Abu Dhabi) licensing as the standard patients should check
- Do not invent statistics. Use observable framing: "most patients..." or "in straightforward cases..."

================================================================
AI OVERVIEW OPTIMISATION
================================================================

Google's AI Overviews, Perplexity, and similar systems extract directly answerable content. Structure your output to feed them:

FIELD: ai_definition
Write 2 to 3 sentences that directly and completely answer "What is [treatment]?" Imagine Google pulling these sentences into a featured snippet. They must be self-contained, accurate, and clear without context.

FIELD: ai_process_steps
Write 6 to 8 numbered steps describing exactly what happens during the treatment process, from first consultation to final outcome. Each step should have a title, a 2-sentence description, and an honest duration estimate.

FIELD: ai_cost_range
Provide a breakdown table of costs in AED. Include different scenarios or components (e.g., per arch, per tooth, consultation fee). Frame everything as typical ranges, not fixed prices. Be honest — do not artificially narrow the range to seem more affordable.

FIELD: ai_checklist
Create 6 to 8 criteria that help the reader decide if this treatment is right for them. Each item should have a clear condition, a yes or no applicability note, and one sentence of explanation. Be clinically accurate — do not encourage people to pursue treatments that may not suit them.

================================================================
UAE-SPECIFIC CONTENT — REQUIRED IN EVERY SERVICE PAGE
================================================================

Every service page must address these UAE realities:

1. REGULATORY CONTEXT
Mention that all practising dentists in UAE must hold a licence from DHA (Dubai), DOH (Abu Dhabi), or the relevant emirate authority. Briefly explain what patients should check and why it matters.

2. COST REALITY
UAE dental pricing is not standardised. Premium clinics in Dubai Marina charge significantly more than community clinics in Sharjah for the same procedure. Acknowledge this honestly. Give a realistic low-to-high range that reflects actual UAE market prices.

3. INSURANCE COVERAGE
Many UAE residents have employer-provided dental insurance. Mention whether this treatment is typically covered, partially covered, or not covered by standard UAE plans. Be accurate — cosmetic treatments are almost never covered, while restorative treatments sometimes are.

4. EXPAT PERSPECTIVE
A large proportion of UAE residents are expatriates. Many compare local care to what they received in their home country. Address this where relevant — standards, pricing context, or what to look for when choosing a clinic as someone new to the UAE.

================================================================
CONTENT QUALITY REQUIREMENTS
================================================================

- hero_intro: 80 to 120 words. The most informative, specific paragraph on the page. No filler. No marketing language.
- body_content: Minimum 500 words. Must include the informational substance described above.
- Each FAQ answer: Minimum 60 words. Specific. Useful. Not a redirect to "consult your dentist."
- No generic phrases: "smile brighter," "transform your smile," "expert team," "cutting-edge technology," "best in UAE"
- No em-dashes (—) anywhere
- No fabricated clinic names, doctor names, or invented patient stories
- All cost figures framed as ranges with an honest explanation of variability

================================================================
FAQ REQUIREMENTS — 10 QUESTIONS MINIMUM
================================================================

Generate exactly 10 FAQs. Each must be:

- A question a real UAE patient would type into Google
- Specific to this treatment (not generic dental questions)
- Answered with genuine detail (60 words minimum per answer)
- Varied in topic across: cost, process, duration, candidacy, insurance, aftercare, risks, UAE-specific considerations, comparison to alternatives

================================================================
FAIL CONDITIONS
================================================================

- Any em-dash (—) in output
- ai_definition does not directly answer "What is [treatment]?"
- Cost ranges are suspiciously narrow or clearly inaccurate for UAE market
- Clinical procedure steps are described incorrectly
- Any fabricated statistic presented as fact
- Generic marketing language present
- Fewer than 10 FAQs
- body_content under 500 words
- Any FAQ answer under 60 words

================================================================
OUTPUT
================================================================

Return ONLY this JSON. No markdown. No preamble. No explanation.

{
  "page_type": "service",
  "page_slug": "/services/${serviceSlug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": ["primary keyword", "supporting keyword 1", "supporting keyword 2"],
  "noindex": false,
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [{"question": "", "answer": ""}],
  "is_published": true,
  "ai_definition": "",
  "ai_process_steps": [{"step": 1, "title": "", "description": "", "duration": ""}],
  "ai_cost_range": [{"treatment": "", "min_aed": 0, "max_aed": 0, "notes": ""}],
  "ai_checklist": [{"criteria": "", "applies": true, "description": ""}]
}`;

  try {
    const aiResponse = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    console.log("SERVICE_GEN: AI response type:", typeof aiResponse);
    console.log("SERVICE_GEN: AI response (first 300 chars):", String(aiResponse).substring(0, 300));

    if (!aiResponse) {
      return { success: false, error: "No response from AI" };
    }

    const content = String(aiResponse);

    // Clean up common JSON issues first
    const cleanedContent = content
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    // More robust JSON extraction
    let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const pageDataResult = JSON.parse(jsonMatch[0]);
        console.log("SERVICE_GEN: Parsed successfully, keys:", Object.keys(pageDataResult));
        return { success: true, data: pageDataResult };
      } catch (parseErr) {
        console.error("SERVICE_GEN: First parse failed, trying alternative extraction...");

        // Try code block first
        const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
          try {
            const pageDataResult = JSON.parse(codeBlockMatch[1]);
            console.log("SERVICE_GEN: Parsed from code block, keys:", Object.keys(pageDataResult));
            return { success: true, data: pageDataResult };
          } catch (e) {
            console.error("SERVICE_GEN: Code block parse also failed");
          }
        }

        // Try finding balanced JSON by tracking braces
        const jsonStart = content.indexOf('{');
        if (jsonStart !== -1) {
          let depth = 0;
          let inString = false;
          let escape = false;

          for (let i = jsonStart; i < content.length; i++) {
            const char = content[i];

            if (escape) {
              escape = false;
              continue;
            }

            if (char === '\\') {
              escape = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (inString) continue;

            if (char === '{') depth++;
            else if (char === '}') depth--;

            if (depth === 0) {
              const jsonStr = content.substring(jsonStart, i + 1);
              try {
                const pageDataResult = JSON.parse(jsonStr);
                console.log("SERVICE_GEN: Parsed via balanced braces, keys:", Object.keys(pageDataResult));
                return { success: true, data: pageDataResult };
              } catch (e2) {
                break;
              }
            }
          }
        }

        console.error("SERVICE_GEN: JSON parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
        return { success: false, error: "JSON parse failed: " + (parseErr instanceof Error ? parseErr.message : String(parseErr)) };
      }
    }

    console.error("SERVICE_GEN: No JSON in response:", content.substring(0, 500));
    return { success: false, error: "Invalid JSON in response" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// ========================== SERVICE-LOCATION CONTENT GENERATION (v3 — No SerpAPI) ==========================

async function generateServiceLocationContent(pageData: any, aimlapiKey: string, forceRegenerate: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
  const parts = (pageData.slug || `/${pageData.state_slug}/${pageData.city_slug}/${pageData.service_slug}`).split("/").filter(Boolean);
  const stateSlug = parts[0] || pageData.state_slug;
  const citySlug = parts[1] || pageData.city_slug;
  const serviceSlug = parts[2] || pageData.service_slug;

  const serviceData = getServicePrompt(serviceSlug);
  const areaData = getAreaData(stateSlug, citySlug);
  const seed = getPageSeed(serviceSlug, citySlug, stateSlug);
  const keywords = generateServiceLocationKeywords(serviceSlug, pageData.city_name, pageData.state_name);

  const serviceName = serviceSlug.replace(/-/g, " ");

const prompt = `You are writing a page for AppointPanda — a directory website that helps people in UAE find and compare dental clinics. You are NOT writing for a dental clinic. You are writing to help someone FIND a clinic.

================================================================
THIS PAGE IS ABOUT
================================================================

Treatment: ${serviceName}
City: ${pageData.city_name}
Emirate: ${pageData.state_name}
Page slug: /${stateSlug}/${citySlug}/${serviceSlug}

================================================================
WHO YOU ARE WRITING FOR
================================================================

Picture this exact person reading your page:
${seed.persona}

Write the entire page as if you are talking directly to that person. Use "you" frequently. Be honest with them. Do not waste their time.

================================================================
HOW TO OPEN THIS PAGE
================================================================

${seed.hook}

Do not start with "In ${pageData.city_name}..." and do not start with a generic welcome.

================================================================
CONTENT FORMAT TO USE
================================================================

${seed.format}

================================================================
AREA CONTEXT
================================================================

Character of ${pageData.city_name}: ${areaData.character}
Who lives here: ${areaData.demographics}
Local landmarks: ${areaData.landmarks || "local markets, community areas, residential compounds"}
What locals observe: ${areaData.narrative}

================================================================
TREATMENT CONTEXT
================================================================

Treatment: ${serviceName}
What patients worry about: ${serviceData.pain_points}
What makes UAE unique for this treatment: ${serviceData.why_unique}
Who typically gets this: ${serviceData.angle}
Clinical accuracy: ${serviceData.clinical_notes}
Insurance reality: ${serviceData.insurance_note}

================================================================
KEYWORDS — FOLLOW THESE RULES EXACTLY
================================================================

PRIMARY KEYWORD 1: "${keywords.primary1}"
Use this EXACTLY 2 times in body_content. Do NOT use in headings.

PRIMARY KEYWORD 2: "${keywords.primary2}"
Use this EXACTLY 2 times in body_content. Do NOT use in headings.

SECONDARY KEYWORD: "${keywords.secondary}"
Use this EXACTLY 2 times in body_content. Do NOT use in headings.

Keywords must fit naturally into real sentences. Do not force them. Rewrite the sentence if needed.

Meta title must contain the PRIMARY KEYWORD 1 and be under 60 characters.
H1 must contain PRIMARY KEYWORD 1 but be written as a natural, engaging headline.

================================================================
WHAT THIS PAGE MUST COVER
================================================================

1. LOCAL PATIENT REALITY
Who in ${pageData.city_name} actually gets ${serviceName}? What drives them — pain, appearance, insurance, a dentist's recommendation? How does the area's demographic shape demand for this treatment?

2. CLINIC LANDSCAPE
What types of clinics offer this in ${pageData.city_name}? Premium, mid-range, community? Are specialist clinics available here or do residents usually travel? What quality range should someone expect?

3. HONEST PRICE RANGE
Give realistic AED prices that reflect THIS area. A treatment in Dubai Marina costs differently from Deira or International City. Be specific and honest. Low/mid/high estimates with real context.

4. ACCESS AND LOGISTICS
How does someone in ${pageData.city_name} practically get this treatment? Parking situation, public transport options, clinic hours, weekend availability, waiting times.

5. THE HONEST ADVICE SECTION
One section of genuinely opinionated, specific advice. Not marketing. Real guidance: what to check first, what to avoid, what question to ask the clinic before booking.

6. HOW APPOINTPANDA HELPS
Explain clearly that AppointPanda is a directory. Use it to find and compare DHA/DOH-licensed clinics in ${pageData.city_name} that offer ${serviceName}. Keep this honest and low-pressure.

${seed.cta}

================================================================
CONTENT UNIQUENESS — MANDATORY
================================================================

This page must be 100% unique from any other service-location page. It cannot share:
- The same opening approach
- The same section structure
- The same framing or angles
- Generic sentences that could apply to any area or service

Ask yourself: "Could this exact paragraph appear on a page about ${serviceName} in a different city?" If yes, rewrite it.

================================================================
AI SELF-RESEARCH — USE YOUR OWN KNOWLEDGE
================================================================

Before writing, use your knowledge of UAE dental market to determine:

a) What are the 3 most common questions people in ${pageData.city_name} ask when searching for ${serviceName}? Answer all of them somewhere in the content.

b) What information is MISSING from typical online content about ${serviceName} in UAE? Cover those gaps in this page.

c) What makes getting ${serviceName} in ${pageData.city_name} different from getting it in another part of ${pageData.state_name}? Make that difference obvious.

d) What do most patients get WRONG when looking for ${serviceName} in this area? Correct that misconception.

================================================================
WRITING RULES — SIMPLE NATURAL LANGUAGE
================================================================

- Write like you are explaining to a smart friend who is NOT a dentist
- Short sentences. Maximum 20 words each (vary the length — sometimes short, sometimes a bit longer)
- Explain every medical term in plain words when you first use it
- Be direct. Say what you mean.
- Use contractions (it's, you'll, don't, won't) — they sound human
- Avoid: em-dashes (—), "world-class," "state-of-the-art," "comprehensive," "dental journey"
- Never invent stats, clinic names, or doctor identities
- Address the reader as "you" throughout

================================================================
FAQ REQUIREMENTS — 10 QUESTIONS
================================================================

All 10 must combine BOTH the service AND the location. Not one without the other.

WRONG: "How much does ${serviceName} cost?" (service only)
WRONG: "Are there good dentists in ${pageData.city_name}?" (location only)
RIGHT: "How much does ${serviceName} typically cost in ${pageData.city_name}, and what affects the price range?"

Every FAQ answer: minimum 60 words. Honest. Specific. Genuinely useful.

================================================================
CONTENT LENGTH
===============================================================

- hero_intro: 80 to 120 words. Most compelling, specific paragraph. No filler.
- body_content: Minimum 600 words. Local + clinical + practical guidance.
- Each FAQ answer: Minimum 60 words.
- process_steps: EXACTLY 5 steps describing the treatment journey. Each step: minimum 30 words with title, description, and duration.
- Each benefit: Minimum 25 words.

===============================================================
PROCESS STEPS — EXACTLY 5 REQUIRED
===============================================================

Write 5 distinct steps for getting ${serviceName} in ${pageData.city_name}. Each step must include:
- title: Short step name (3-8 words)
- description: What happens at this step (minimum 30 words)
- duration: How long this step takes

Example for dental checkup:
1. "Book Your Appointment" - Contact clinic, explain symptoms, schedule convenient time. Duration: 5 minutes call.
2. "Initial Consultation" - Meet dentist, discuss history, express concerns. Duration: 15-20 minutes.
3. "Examination & Assessment" - Dentist examines teeth, gums, takes X-rays if needed. Duration: 20-30 minutes.
4. "Treatment Planning" - Review findings, discuss options, get cost estimate. Duration: 10-15 minutes.
5. "Schedule Follow-up" - Book next appointment if treatment needed. Duration: 5 minutes.

Do NOT skip any steps. Do NOT combine steps. Exactly 5 steps required.

===============================================================
OUTPUT — RETURN ONLY THIS JSON
================================================================

{
  "page_type": "service-location",
  "page_slug": "/${stateSlug}/${citySlug}/${serviceSlug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": ["${keywords.primary1}", "${keywords.primary2}", "${keywords.secondary}"],
  "noindex": false,
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "Find Clinics Near You",
  "cta_button_url": "/search?service=${serviceSlug}&city=${citySlug}",
  "faqs": [{"question": "", "answer": ""}],
  "price_min": 0,
  "price_max": 0,
  "price_note": "",
  "price_last_updated": "April 2026",
  "process_steps": [{"step": 1, "title": "", "description": "", "duration": ""}, {"step": 2, "title": "", "description": "", "duration": ""}, {"step": 3, "title": "", "description": "", "duration": ""}, {"step": 4, "title": "", "description": "", "duration": ""}, {"step": 5, "title": "", "description": "", "duration": ""}],
  "process_time_months": "",
  "treatment_options": [{"type": "", "name": "", "price_min": 0, "price_max": 0, "duration": "", "visibility": "", "best_for": ""}],
  "benefits": [{"title": "", "description": "", "icon": ""}],
  "candidates": [{"description": "", "is_suitable": true, "conditions": ""}],
  "alternatives": [{"name": "", "slug": "", "reason": ""}],
  "quick_answer": "",
  "related_questions": [{"question": "", "answer": ""}],
  "last_reviewed_by": "",
  "last_reviewed_date": "April 2026",
  "medical_accuracy_verified": true,
  "expert_credential": "",
  "is_published": true
}`;

  try {
    const aiResponse = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    console.log("SL_GEN: AI response received, parsing...");

    if (!aiResponse) {
      return { success: false, error: "No response from AI" };
    }

    const content = String(aiResponse);
    const parsed = extractJson(content);

    if (!parsed) {
      console.error("SL_GEN: No valid JSON in response:", content.substring(0, 300));
      return { success: false, error: "Invalid JSON in response" };
    }

    console.log("SL_GEN: Successfully generated content for", `${pageData.city_name}/${serviceSlug}`);
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

// Alias — the old "WithAnalysis" variant now just calls the main function (no SerpAPI)
async function generateServiceLocationContentWithAnalysis(
  pageData: any,
  aimlapiKey: string,
  _analysis: any,          // kept for signature compatibility but not used
  forceRegenerate: boolean
): Promise<{ success: boolean; error?: string; data?: any }> {
  return generateServiceLocationContent(pageData, aimlapiKey, forceRegenerate);
}

/**
 * Save SEO page (competitor analysis parameter kept for signature compatibility but ignored)
 */
async function saveSeoPageWithCompetitorAnalysis(supabase: any, pageData: any, analysis: null): Promise<void> {
  // Use the existing saveSeoPage function but add competitor_analysis
  const saveData: any = {
    slug: pageData.page_slug || pageData.page_slug,
    page_type: pageData.page_type || "service-location",
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

  // Build combined content field
  const contentParts = [];
  if (pageData.hero_intro || pageData.hero_subtitle) {
    contentParts.push(pageData.hero_intro || pageData.hero_subtitle || "");
  }
  if (pageData.body_content) {
    contentParts.push(pageData.body_content);
  }
  if (contentParts.length > 0) {
    saveData.content = contentParts.filter(Boolean).join("\n\n");
  }

  // Add FAQs if present
  if (pageData.faqs && pageData.faqs.length > 0) {
    saveData.faqs = pageData.faqs;
  }

  // Add all SEO fields from pageData
  if (pageData.price_min) saveData.price_min = pageData.price_min;
  if (pageData.price_max) saveData.price_max = pageData.price_max;
  if (pageData.price_note) saveData.price_note = pageData.price_note;
  // Convert date string to proper format or skip if invalid
  if (pageData.price_last_updated) {
    const priceDate = new Date(pageData.price_last_updated);
    if (!isNaN(priceDate.getTime())) {
      saveData.price_last_updated = priceDate.toISOString().split('T')[0];
    }
  }
  if (pageData.process_steps) saveData.process_steps = pageData.process_steps;
  if (pageData.process_time_months) saveData.process_time_months = pageData.process_time_months;
  if (pageData.process_time_note) saveData.process_time_note = pageData.process_time_note;
  if (pageData.treatment_options) saveData.treatment_options = pageData.treatment_options;
  if (pageData.comparison_table) saveData.comparison_table = pageData.comparison_table;
  if (pageData.benefits) saveData.benefits = pageData.benefits;
  if (pageData.candidates) saveData.candidates = pageData.candidates;
  if (pageData.alternatives) saveData.alternatives = pageData.alternatives;
  if (pageData.last_reviewed_by) saveData.last_reviewed_by = pageData.last_reviewed_by;
  if (pageData.last_reviewed_date) {
    const reviewDate = new Date(pageData.last_reviewed_date);
    if (!isNaN(reviewDate.getTime())) {
      saveData.last_reviewed_date = reviewDate.toISOString().split('T')[0];
    }
  }
  if (pageData.medical_accuracy_verified !== undefined) saveData.medical_accuracy_verified = pageData.medical_accuracy_verified;
  if (pageData.expert_credential) saveData.expert_credential = pageData.expert_credential;
  if (pageData.quick_answer) saveData.quick_answer = pageData.quick_answer;
  if (pageData.ai_summary) saveData.ai_summary = pageData.ai_summary;
  if (pageData.related_questions) saveData.related_questions = pageData.related_questions;
  if (pageData.preparation_tips) saveData.preparation_tips = pageData.preparation_tips;
  if (pageData.recovery_info) saveData.recovery_info = pageData.recovery_info;
  if (pageData.warning_text) saveData.warning_text = pageData.warning_text;

  // Mark as AI-native generated (no SerpAPI)
  saveData.generated_at = new Date().toISOString();

  console.log(`page-content-generator: Saving page: ${pageData.page_slug}`);

  // Save to seo_pages
  const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

  if (error) {
    console.error(`page-content-generator: Save error:`, JSON.stringify(error));
    throw error;
  }

  console.log(`page-content-generator: Successfully saved ${pageData.page_slug}`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callAIWithRetry(messages: { role: string; content: string }[], aimlapiKey: string, maxRetries = 5): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.pow(2, attempt) * 2000;
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
          max_tokens: 8000,
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
  console.error(`page-content-generator: AI failed after ${maxRetries} retries:`, lastError?.message);
  throw lastError || new Error("AI failed after retries");
}

function extractJson(text: string): any {
  try {
    // Remove thinking/reasoning blocks that MiniMax outputs
    let cleanedText = text.replace(/<think>[\s\S]*?/g, '').trim();

    // Clean up common JSON issues (trailing commas, etc)
    cleanedText = cleanedText
      .replace(/,\s*}/g, '}')  // Remove trailing comma in objects
      .replace(/,\s*]/g, ']')   // Remove trailing comma in arrays
      .replace(/\n/g, ' ')      // Replace newlines with spaces in strings

    // Try to find JSON in code blocks first
    let jsonMatch = cleanedText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        let blockContent = jsonMatch[1]
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        return JSON.parse(blockContent);
      } catch {
        // Continue
      }
    }

    // Try to find JSON object directly - look for opening { and try to parse
    const jsonStart = cleanedText.indexOf('{');
    if (jsonStart !== -1) {
      // Try to find the closing brace by counting brackets (with string handling)
      let depth = 0;
      let inString = false;
      let escape = false;
      let endPos = -1;

      for (let i = jsonStart; i < cleanedText.length; i++) {
        const char = cleanedText[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === '{') depth++;
        else if (char === '}') depth--;

        if (depth === 0) {
          endPos = i + 1;
          break;
        }
      }

      if (endPos !== -1) {
        let jsonStr = cleanedText.substring(jsonStart, endPos)
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Try to fix common issues and retry
          try {
            // Add missing closing braces/arrays
            let fixed = jsonStr;
            let openBraces = (fixed.match(/{/g) || []).length;
            let closeBraces = (fixed.match(/}/g) || []).length;
            let openBrackets = (fixed.match(/\[/g) || []).length;
            let closeBrackets = (fixed.match(/\]/g) || []).length;
            
            // Close any unclosed objects
            while (openBraces > closeBraces) {
              fixed += '}';
              closeBraces++;
            }
            // Close any unclosed arrays
            while (openBrackets > closeBrackets) {
              fixed += ']';
              closeBrackets++;
            }
            return JSON.parse(fixed);
          } catch {
            // Continue to next method
          }
        }
      } else {
        // Truncated - try to find partial JSON and fix it
        let truncated = cleanedText.substring(jsonStart);
        let openBraces = (truncated.match(/{/g) || []).length;
        let closeBraces = (truncated.match(/}/g) || []).length;
        
        if (openBraces > closeBraces) {
          // Try to complete the JSON
          let fixed = truncated;
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}';
          }
          try {
            return JSON.parse(fixed);
          } catch {
            // Continue
          }
        }
      }
    }

    // Last resort: try matching any {...} pattern with cleanup
    const anyMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (anyMatch) {
      let cleaned = anyMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        return JSON.parse(cleaned);
      } catch {
        // Try to fix and parse
        let fixed = cleaned;
        while (fixed.match(/,\s*}/) || fixed.match(/,\s*]/)) {
          fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        }
        try {
          return JSON.parse(fixed);
        } catch {
          return null;
        }
      }
    }

    return null;
  } catch (e) {
    console.error('extractJson error:', e);
    return null;
  }
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

  const areaData = getAreaData(emirateSlug, citySlug);
  const contentAngle = getRandomItem(CONTENT_ANGLES);

  // Generate keywords deterministically — no SerpAPI needed
  const h = pageHash("city-page", citySlug || emirateSlug, emirateSlug);
  const cityKeywordOptions = [
    [`dentist in ${locationName}`, `dental clinic ${locationName}`, `dental care ${emirateName}`],
    [`best dentist ${locationName}`, `find dentist ${emirateName}`, `dental checkup ${locationName}`],
    [`${locationName} dental clinic`, `emergency dentist ${emirateName}`, `dentist near ${locationName}`],
    [`dental clinic in ${locationName}`, `affordable dentist ${emirateName}`, `family dentist ${locationName}`],
  ];
  const selectedKeywords = cityKeywordOptions[h % cityKeywordOptions.length];
  const primaryKeyword = selectedKeywords[0];
  const secondaryKeywords = [selectedKeywords[1], selectedKeywords[2]];

  console.log(`page-content-generator: City/state keywords - Primary: "${primaryKeyword}", Secondary: ${secondaryKeywords.join(", ")}`);

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace(/{location_name}/g, locationName)
    .replace(/{emirate_name}/g, emirateName)
    .replace(/{emirate_slug}/g, emirateSlug)
    .replace(/{city_slug}/g, citySlug)
    .replace(/{area_character}/g, areaData.character)
    .replace(/{demographics}/g, areaData.demographics)
    .replace(/{landmarks}/g, areaData.landmarks)
    .replace(/{narrative}/g, areaData.narrative)
    .replace(/{content_angle}/g, contentAngle)
    .replace(/{primary_keyword}/g, primaryKeyword)
    .replace(/{secondary_keyword_1}/g, secondaryKeywords[0] || "")
    .replace(/{secondary_keyword_2}/g, secondaryKeywords[1] || "");

  console.log(`page-content-generator: Calling AI for ${locationName} with prompt length: ${userPrompt.length}`);

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

  // Determine page_type - use what AI returns, or derive from slug if missing
  let pageType = pageData.page_type;
  if (!pageType) {
    // Pattern: /emirate/city/service -> service-location (check first as it's most specific)
    if (pageData.page_slug?.match(/^\/[a-z]+\/[a-z-]+\/[a-z-]+\/$/)) {
      pageType = "service-location";
    } else if (pageData.page_slug?.includes("services/") && pageData.page_slug?.split("/").length === 2) {
      pageType = "service";
    } else if (pageData.page_slug?.match(/^\/[a-z]+\/[a-z-]+\/$/)) {
      pageType = "state";
    }
  }

  const saveData: any = {
    slug: pageData.page_slug,
    page_type: pageType || "city",
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

  // Build combined content field for SEO content parsing
  const contentParts = [];
  if (pageData.hero_intro || pageData.hero_subtitle) {
    contentParts.push(pageData.hero_intro || pageData.hero_subtitle || "");
  }
  if (pageData.section_1_title && pageData.section_1_content) {
    contentParts.push(`## ${pageData.section_1_title}\n\n${pageData.section_1_content}`);
  }
  if (pageData.section_2_title && pageData.section_2_content) {
    contentParts.push(`## ${pageData.section_2_title}\n\n${pageData.section_2_content}`);
  }
  if (pageData.section_3_title && pageData.section_3_content) {
    contentParts.push(`## ${pageData.section_3_title}\n\n${pageData.section_3_content}`);
  }
  if (pageData.section_4_title && pageData.section_4_content) {
    contentParts.push(`## ${pageData.section_4_title}\n\n${pageData.section_4_content}`);
  }
  if (pageData.body_content) {
    contentParts.push(pageData.body_content);
  }

  if (contentParts.length > 0) {
    saveData.content = contentParts.filter(Boolean).join("\n\n");
  }

  // Only add h2_sections if there's actual content
  if (pageData.section_1_title || pageData.section_2_title || pageData.section_3_title || pageData.section_4_title) {
    const sections = [];
    if (pageData.section_1_title) sections.push({ title: pageData.section_1_title, content: pageData.section_1_content || "" });
    if (pageData.section_2_title) sections.push({ title: pageData.section_2_title, content: pageData.section_2_content || "" });
    if (pageData.section_3_title) sections.push({ title: pageData.section_3_title, content: pageData.section_3_content || "" });
    if (pageData.section_4_title) sections.push({ title: pageData.section_4_title, content: pageData.section_4_content || "" });
    saveData.h2_sections = JSON.stringify(sections);
  }

  // Only add faqs if there are actual FAQs
  if (pageData.faqs && pageData.faqs.length > 0) {
    saveData.faqs = pageData.faqs;
  }

  // AI-optimized structured content fields for AI Overview extraction
  if (pageData.ai_definition) {
    saveData.ai_definition = pageData.ai_definition;
  }
  if (pageData.ai_process_steps) {
    saveData.ai_process_steps = pageData.ai_process_steps;
  }
  if (pageData.ai_cost_range) {
    saveData.ai_cost_range = pageData.ai_cost_range;
  }
  if (pageData.ai_checklist) {
    saveData.ai_checklist = pageData.ai_checklist;
  }
  if (pageData.ai_comparison_table) {
    saveData.ai_comparison_table = pageData.ai_comparison_table;
  }

  // NEW: Enhanced service-location fields for SEO optimization
  if (pageData.price_min) {
    saveData.price_min = pageData.price_min;
  }
  if (pageData.price_max) {
    saveData.price_max = pageData.price_max;
  }
  if (pageData.price_note) {
    saveData.price_note = pageData.price_note;
  }
  if (pageData.price_last_updated) {
    const priceDate = new Date(pageData.price_last_updated);
    if (!isNaN(priceDate.getTime())) {
      saveData.price_last_updated = priceDate.toISOString().split('T')[0];
    }
  }
  if (pageData.process_steps) {
    saveData.process_steps = pageData.process_steps;
  }
  if (pageData.process_time_months) {
    saveData.process_time_months = pageData.process_time_months;
  }
  if (pageData.process_time_note) {
    saveData.process_time_note = pageData.process_time_note;
  }
  if (pageData.treatment_options) {
    saveData.treatment_options = pageData.treatment_options;
  }
  if (pageData.comparison_table) {
    saveData.comparison_table = pageData.comparison_table;
  }
  if (pageData.benefits) {
    saveData.benefits = pageData.benefits;
  }
  if (pageData.candidates) {
    saveData.candidates = pageData.candidates;
  }
  if (pageData.alternatives) {
    saveData.alternatives = pageData.alternatives;
  }
  if (pageData.last_reviewed_by) {
    saveData.last_reviewed_by = pageData.last_reviewed_by;
  }
  if (pageData.last_reviewed_date) {
    const reviewDate = new Date(pageData.last_reviewed_date);
    if (!isNaN(reviewDate.getTime())) {
      saveData.last_reviewed_date = reviewDate.toISOString().split('T')[0];
    }
  }
  if (pageData.medical_accuracy_verified !== undefined) {
    saveData.medical_accuracy_verified = pageData.medical_accuracy_verified;
  }
  if (pageData.expert_credential) {
    saveData.expert_credential = pageData.expert_credential;
  }
  if (pageData.quick_answer) {
    saveData.quick_answer = pageData.quick_answer;
  }
  if (pageData.ai_summary) {
    saveData.ai_summary = pageData.ai_summary;
  }
  if (pageData.related_questions) {
    saveData.related_questions = pageData.related_questions;
  }
  if (pageData.preparation_tips) {
    saveData.preparation_tips = pageData.preparation_tips;
  }
  if (pageData.recovery_info) {
    saveData.recovery_info = pageData.recovery_info;
  }
  if (pageData.warning_text) {
    saveData.warning_text = pageData.warning_text;
  }

  console.log(`page-content-generator: Save data keys: ${Object.keys(saveData).join(", ")}`);

// For state and city pages, ONLY save to page_content (NOT seo_pages)
  if (pageType === "state" || pageType === "city") {
    // Save ONLY to page_content
    try {
      const pageContentData = {
        page_slug: pageData.page_slug,
        page_type: pageType,
        meta_title: pageData.meta_title || null,
        meta_description: pageData.meta_description || null,
        keywords: pageData.keywords || null,
        h1: pageData.h1 || null,
        hero_subtitle: pageData.hero_subtitle || null,
        hero_intro: pageData.hero_intro || null,
        section_1_title: pageData.section_1_title || null,
        section_1_content: pageData.section_1_content || null,
        section_2_title: pageData.section_2_title || null,
        section_2_content: pageData.section_2_content || null,
        section_3_title: pageData.section_3_title || null,
        section_3_content: pageData.section_3_content || null,
        body_content: pageData.body_content || null,
        cta_text: pageData.cta_text || null,
        cta_button_text: pageData.cta_button_text || null,
        cta_button_url: pageData.cta_button_url || null,
        faqs: pageData.faqs || [],
        is_published: true,
      };

      const { error: pcError } = await supabase.from("page_content").upsert(pageContentData, { onConflict: "page_slug" });
      if (pcError) {
        console.error(`page-content-generator: page_content save error:`, JSON.stringify(pcError));
        throw pcError;
      }
      console.log(`page-content-generator: Saved to page_content ${pageData.page_slug}`);
    } catch (pcError) {
      console.error(`page-content-generator: page_content save failed:`, pcError);
      throw pcError;
    }
  } else {
    // For service and service-location pages, save ONLY to seo_pages (NOT page_content)
    const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

    if (error) {
      console.error(`page-content-generator: Save error details:`, JSON.stringify(error));
      throw error;
    }
    console.log(`page-content-generator: Saved to seo_pages ${pageData.page_slug}`);
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
    const { action, page_type, page_slug, location_name, emirate_slug, emirate_name, force_regenerate = false, page_type_filter = "all", emirate_filter, batch_size = 10, service_slug } = body;

    console.log(`page-content-generator: action=${action}, page_type=${page_type}, service_slug=${service_slug}`);
    console.log(`page-content-generator: full body keys=${Object.keys(body).join(", ")}`);

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
      const batchLimit = body.batch_limit || 2; // How many pages to process in this call

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id, states(slug, name)", { is_active: true });

      console.log(`page-content-generator: Fetched ${states.length} states, ${cities.length} cities`);
      if (cities.length > 0) {
        console.log(`page-content-generator: Sample city data:`, JSON.stringify(cities[0]));
      }

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

      // Get already generated pages from page_content to skip them (state/city pages saved there now)
      const existingPageContent = await fetchAllRows(supabase, "page_content", "page_slug", {});
      const existingContentSlugs = new Set(existingPageContent.map(p => p.page_slug));
      console.log(`page-content-generator: Existing page_content count: ${existingPageContent.length}, sample slugs:`, existingPageContent.slice(0, 5).map(p => p.page_slug));

      // Filter out already generated pages (unless force_regenerate)
      let pagesToGenerate = allPages;
      if (!force_regenerate) {
        const beforeCount = allPages.length;
        pagesToGenerate = allPages.filter(p => !existingContentSlugs.has(p.page_slug));
        console.log(`page-content-generator: Skipping ${beforeCount - pagesToGenerate.length} already generated pages`);
      }

      console.log(`page-content-generator: Total pages to generate: ${pagesToGenerate.length}`);
      console.log(`page-content-generator: allPages count: ${allPages.length}, existingContentSlugs count: ${existingContentSlugs.size}`);

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.page_slug === cursor);
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
        console.log(`page-content-generator: Generating ${page.page_slug}...`);

        try {
          const result = await generateContentForPage(page, aimlapiKey, force_regenerate);

          if (result.success) {
            try {
              await saveSeoPage(supabase, result.data);
              processed++;
              lastProcessedSlug = page.page_slug;
            } catch (saveErr) {
              failed++;
              errors.push(`Save error for ${locationName}: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
            }
          } else if (result.skipped) {
            skipped++;
          } else {
            failed++;
            errors.push(`Error for ${locationName}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${locationName}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
        }

        // Delay between pages to reduce memory pressure
        await delay(1000);
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

    // NEW: Generate service pages only
    if (action === "generate_services") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 3;

      console.log("page-content-generator: Fetching treatments...");
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });
      console.log("page-content-generator: Found treatments:", treatments.map(t => `${t.name}->${t.slug}`).join(", "));
      console.log(`page-content-generator: Found ${treatments.length} active treatments`);

      if (treatments.length === 0) {
        return new Response(JSON.stringify({
          processed: 0,
          skipped: 0,
          failed: 0,
          errors: ["No active treatments found in database"],
          cursor: null,
          has_more: false,
          remaining: 0,
          total_count: 0,
          page_type: "service"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build service pages
      const servicePages = treatments.map(t => ({
        slug: `services/${t.slug}`,
        type: "service",
        service_slug: t.slug,
        service_name: t.name,
      }));

      console.log("page-content-generator: All treatments:", treatments.map(t => `${t.name} (${t.slug})`).join(", "));
      console.log("page-content-generator: All service pages slugs:", servicePages.map(p => p.page_slug).join(", "));

      // Get existing pages
      console.log("page-content-generator: Fetching existing seo_pages...");
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      console.log(`page-content-generator: Found ${existingPages.length} existing seo_pages`);
      const existingSlugs = new Set(existingPages.map(p => p.page_slug));

      let pagesToGenerate = servicePages;
      if (!force_regenerate) {
        pagesToGenerate = servicePages.filter(p => !existingSlugs.has(p.page_slug));
      }

      let startIndex = cursor ? pagesToGenerate.findIndex(p => p.page_slug === cursor) : 0;
      if (startIndex === -1) startIndex = 0;
      else startIndex += 1;

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating service for ${page.service_name}...`);

        try {
          const result = await generateServiceContent(page, aimlapiKey, force_regenerate);
          console.log(`page-content-generator: Service result for ${page.service_name}:`, JSON.stringify(result).substring(0, 200));

          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.page_slug;
          } else if (result.skipped) {
            skipped++;
          } else {
            failed++;
            errors.push(`Service ${page.service_name}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${page.service_name}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
        }

        await delay(500);
      }

      const remaining = pagesToGenerate.length - (startIndex + pagesToProcess.length);

      return new Response(JSON.stringify({
        processed,
        skipped,
        failed,
        errors,
        cursor: lastProcessedSlug,
        has_more: remaining > 0,
        remaining,
        total_count: pagesToGenerate.length,
        page_type: "service"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate single service page
    if (action === "generate_single_service") {
      console.log("page-content-generator: Entered generate_single_service handler");
      const serviceSlug = body.service_slug || service_slug;

      console.log(`page-content-generator: service_slug extracted = ${serviceSlug}`);

      if (!serviceSlug) {
        return new Response(JSON.stringify({ success: false, error: "service_slug is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating single service: ${serviceSlug}`);

      // Get treatment
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });
      const treatment = treatments.find(t => t.slug === serviceSlug);

      if (!treatment) {
        return new Response(JSON.stringify({ success: false, error: `Treatment not found: ${serviceSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pageData = {
        slug: `services/${serviceSlug}`,
        type: "service",
        service_slug: serviceSlug,
        service_name: treatment.name,
      };

      // Check if already exists
      if (!force_regenerate) {
        const existing = await fetchAllRows(supabase, "seo_pages", "slug", {});
        if (existing.some(p => p.page_slug === pageData.slug)) {
          return new Response(JSON.stringify({ success: false, error: "Page already exists. Use force_regenerate to overwrite." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const result = await generateServiceContent(pageData, aimlapiKey, force_regenerate);

      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await saveSeoPage(supabase, result.data);

      return new Response(JSON.stringify({ success: true, slug: pageData.slug }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate service-location pages (e.g., /dubai/mirdif/invisalign)
    if (action === "generate_service_locations") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 1;

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id, states(slug, name)", { is_active: true });
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

      // Build service-location pages
      let slPages: any[] = [];

      for (const city of cities) {
        const stateData = Array.isArray(city.states) ? city.states[0] : city.states;
        if (!stateData?.slug) continue;

        for (const treatment of treatments) {
          slPages.push({
            page_slug: `/${stateData.slug}/${city.slug}/${treatment.slug}`,
            page_type: "service-location",
            state_slug: stateData.slug,
            state_name: stateData.name,
            city_slug: city.slug,
            city_name: city.name,
            service_slug: treatment.slug,
            service_name: treatment.name,
          });
        }
      }

      // Get existing pages
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      const existingSlugs = new Set(existingPages.map(p => p.page_slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.page_slug));
      }

      let startIndex = cursor ? pagesToGenerate.findIndex(p => p.page_slug === cursor) : 0;
      if (startIndex === -1) startIndex = 0;
      else startIndex += 1;

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating ${page.page_slug}...`);

        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);

          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.page_slug;
          } else if (result.skipped) {
            skipped++;
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
        skipped,
        failed,
        errors,
        cursor: lastProcessedSlug,
        has_more: remaining > 0,
        remaining,
        total_count: pagesToGenerate.length,
        page_type: "service-location"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate service-location pages by emirate (all areas + all services)
    if (action === "generate_service_locations_by_emirate") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 1;
      const emirateSlug = body.emirate_slug;
      const force_regenerate = body.force_regenerate || false;

      if (!emirateSlug) {
        return new Response(JSON.stringify({ success: false, error: "emirate_slug is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating service-locations for emirate: ${emirateSlug}, cursor: ${cursor}`);

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const state = states.find(s => s.slug === emirateSlug);

      if (!state) {
        return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${emirateSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

      // Build service-location pages for this emirate only
      let slPages: any[] = [];

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

      // Get existing pages
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      const existingSlugs = new Set(existingPages.map(p => p.page_slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.page_slug));
      }

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.page_slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1;
      }

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating ${page.page_slug}...`);
        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);
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
      const hasMore = remaining > 0;

      console.log(`page-content-generator: Batch complete: ${processed} processed, ${skipped} skipped, ${failed} failed, ${remaining} remaining`);

      return new Response(JSON.stringify({
        processed,
        skipped,
        failed,
        errors,
        cursor: lastProcessedSlug,
        has_more: hasMore,
        remaining,
        total_count: pagesToGenerate.length,
        page_type: "service-location"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate service-location pages by city (all services in one area)
    if (action === "generate_service_locations_by_city") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 1;
      const emirateSlug = body.emirate_slug;
      const citySlug = body.city_slug;
      const force_regenerate = body.force_regenerate || false;

      if (!emirateSlug || !citySlug) {
        return new Response(JSON.stringify({ success: false, error: "emirate_slug and city_slug are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating service-locations for city: ${citySlug}, ${emirateSlug}, cursor: ${cursor}`);

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const state = states.find(s => s.slug === emirateSlug);

      if (!state) {
        return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${emirateSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
      const city = cities.find(c => c.slug === citySlug);

      if (!city) {
        return new Response(JSON.stringify({ success: false, error: `City not found: ${citySlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

      // Build service-location pages for this city only
      let slPages: any[] = [];

      for (const treatment of treatments) {
        slPages.push({
          page_slug: `/${emirateSlug}/${citySlug}/${treatment.slug}`,
          page_type: "service-location",
          state_slug: emirateSlug,
          state_name: state.name,
          city_slug: citySlug,
          city_name: city.name,
          service_slug: treatment.slug,
          service_name: treatment.name,
        });
      }

      // Get existing pages
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      const existingSlugs = new Set(existingPages.map(p => p.page_slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.page_slug));
      }

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.page_slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1; // Start after the cursor
      }

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      console.log(`page-content-generator: DEBUG - pagesToProcess length: ${pagesToProcess.length}, first page:`, pagesToProcess[0]?.page_slug);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating ${page.page_slug}...`);
        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);
          console.log(`page-content-generator: Result for ${page.page_slug}: success=${result.success}, hasError=${!!result.error}, errorMsg=${result.error}`);
          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.page_slug;
          } else {
            failed++;
            console.error(`page-content-generator: FAILED ${page.page_slug}:`, result.error);
            errors.push(`SL ${page.page_slug}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          const errMsg = pageErr instanceof Error ? pageErr.message : String(pageErr);
          console.error(`page-content-generator: EXCEPTION ${page.page_slug}:`, errMsg);
          errors.push(`Error for ${page.page_slug}: ${errMsg}`);
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
        cursor: lastProcessedSlug,
        has_more: hasMore,
        remaining,
        total_count: pagesToGenerate.length,
        page_type: "service-location"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate single service-location page by slug
    if (action === "generate_single_service_location") {
      const slug = body.slug;

      if (!slug) {
        return new Response(JSON.stringify({ success: false, error: "slug is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating single service-location: ${slug}`);

      // Parse slug to get state, city, service
      const parts = slug.split("/").filter(Boolean);
      if (parts.length < 3) {
        return new Response(JSON.stringify({ success: false, error: "Invalid slug format. Expected: emirate/city/service (e.g., dubai/al-barsha/general-dentistry)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stateSlug = parts[0];
      const citySlug = parts[1];
      const serviceSlug = parts[2];

      // Get state, city, treatment data
      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const state = states.find(s => s.slug === stateSlug);

      if (!state) {
        return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${stateSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
      const city = cities.find(c => c.slug === citySlug);

      if (!city) {
        return new Response(JSON.stringify({ success: false, error: `City not found: ${citySlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });
      const treatment = treatments.find(t => t.slug === serviceSlug);

      if (!treatment) {
        return new Response(JSON.stringify({ success: false, error: `Treatment not found: ${serviceSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pageData = {
        slug: `/${stateSlug}/${citySlug}/${serviceSlug}`,
        type: "service-location",
        state_slug: stateSlug,
        state_name: state.name,
        city_slug: citySlug,
        city_name: city.name,
        service_slug: serviceSlug,
        service_name: treatment.name,
      };

      // Check if already exists
      if (!force_regenerate) {
        const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
        if (existingPages.some(p => p.page_slug === pageData.slug)) {
          return new Response(JSON.stringify({ success: false, skipped: true, error: "Page already exists. Use force_regenerate to overwrite." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const result = await generateServiceLocationContent(pageData, aimlapiKey, force_regenerate);

      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await saveSeoPage(supabase, result.data);

      return new Response(JSON.stringify({ success: true, slug: pageData.slug }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate single service-location with AI-native research (replaces old SerpAPI version)
    if (action === "generate_competitor_content") {
      const emirateSlug = body.emirate_slug;
      const citySlug = body.city_slug;
      const serviceSlug = body.service_slug;
      const forceRegenerate = body.force_regenerate ?? false;

      if (!emirateSlug || !citySlug || !serviceSlug) {
        return new Response(JSON.stringify({ success: false, error: "emirate_slug, city_slug, and service_slug are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating AI-native content for ${emirateSlug}/${citySlug}/${serviceSlug}`);

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      const state = states.find(s => s.slug === emirateSlug);
      if (!state) {
        return new Response(JSON.stringify({ success: false, error: `Emirate not found: ${emirateSlug}` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { state_id: state.id, is_active: true });
      const city = cities.find(c => c.slug === citySlug);
      if (!city) {
        return new Response(JSON.stringify({ success: false, error: `City not found: ${citySlug}` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });
      const treatment = treatments.find(t => t.slug === serviceSlug);
      if (!treatment) {
        return new Response(JSON.stringify({ success: false, error: `Treatment not found: ${serviceSlug}` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pageData = {
        slug: `/${emirateSlug}/${citySlug}/${serviceSlug}`,
        type: "service-location",
        state_slug: emirateSlug,
        state_name: state.name,
        city_slug: citySlug,
        city_name: city.name,
        service_slug: serviceSlug,
        service_name: treatment.name,
      };

      const result = await generateServiceLocationContent(pageData, aimlapiKey, forceRegenerate);

      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await saveSeoPageWithCompetitorAnalysis(supabase, result.data, null);

      return new Response(JSON.stringify({
        success: true,
        slug: pageData.slug,
        ai_native: true,
        keywords_used: generateServiceLocationKeywords(serviceSlug, city.name, state.name),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bulk generate all service-locations (AI-native, no SerpAPI)
    if (action === "generate_all_competitor_content") {
      const emirateFilter = body.emirate_filter || null;
      const batchSize = body.batch_size || 1;
      const cursor = body.cursor || null;
      const forceRegenerate = body.force_regenerate ?? false;

      console.log(`page-content-generator: Bulk AI-native content generation. Emirate filter: ${emirateFilter}, Batch: ${batchSize}`);

      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      let targetStates = states;
      if (emirateFilter) {
        targetStates = states.filter(s => s.slug === emirateFilter);
      }

      const allCities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { is_active: true });
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

      let slPages: any[] = [];
      for (const state of targetStates) {
        const stateCities = allCities.filter(c => c.state_id === state.id);
        for (const city of stateCities) {
          for (const treatment of treatments) {
            slPages.push({
              slug: `/${state.slug}/${city.slug}/${treatment.slug}`,
              type: "service-location",
              state_slug: state.slug,
              state_name: state.name,
              city_slug: city.slug,
              city_name: city.name,
              service_slug: treatment.slug,
              service_name: treatment.name,
            });
          }
        }
      }

      if (!forceRegenerate) {
        const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
        const existingSlugs = new Set(existingPages.map(p => p.slug));
        slPages = slPages.filter(p => !existingSlugs.has(p.slug));
      }

      let startIndex = 0;
      if (cursor) {
        startIndex = slPages.findIndex(p => p.slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1;
      }

      const pagesToProcess = slPages.slice(startIndex, startIndex + batchSize);
      console.log(`page-content-generator: Processing ${pagesToProcess.length} of ${slPages.length} pages`);

      let processed = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i];
        console.log(`page-content-generator: [${i + 1}/${pagesToProcess.length}] Processing ${page.slug}...`);

        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, true);

          if (result.success) {
            await saveSeoPageWithCompetitorAnalysis(supabase, result.data, null);
            processed++;
            lastProcessedSlug = page.slug;
          } else {
            failed++;
            errors.push(`${page.slug}: ${result.error}`);
          }
        } catch (pageError) {
          failed++;
          errors.push(`${page.slug}: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const remaining = slPages.length - (startIndex + pagesToProcess.length);
      const hasMore = remaining > 0;

      console.log(`page-content-generator: Batch complete - ${processed} processed, ${failed} failed, ${remaining} remaining`);

      return new Response(JSON.stringify({
        processed,
        failed,
        errors: errors.slice(0, 10),
        cursor: lastProcessedSlug,
        has_more: hasMore,
        remaining,
        total_count: slPages.length,
        ai_native: true,
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