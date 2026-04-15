import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ========================== COMPETITOR ANALYSIS CONSTANTS ==========================
const SERPAPI_DELAY_MS = 2000;      // 2s delay between SerpApi calls
const MAX_URLS_TO_CRAWL = 5;         // Top 5 URLs per query
const MAX_RETRIES = 3;               // 3 fetch retries per URL
const RETRY_DELAY_MS = 3000;         // 3s delay between retries
const CRAWL_TIMEOUT_MS = 30000;      // 30s timeout per page

// ========================== COMPETITOR ANALYSIS TYPES ==========================
interface CompetitorInsight {
  url: string;
  h1: string[];
  h2: string[];
  faqs: { question: string; answer: string }[];
  priceMentions: string[];
  schemaTypes: string[];
  wordCount: number;
  sectionCount: number;
}

interface ConsolidatedAnalysis {
  queriesUsed: string[];
  urlsAnalyzed: string[];
  faqQuestions: string[];
  priceRangeFound: string;
  commonSections: string[];
  missingSections: string[];
  schemaTypesUsed: string[];
  contentGaps: string[];
}

// ========================== COMPETITOR ANALYSIS FUNCTIONS ==========================

/**
 * Search Google via SerpApi and get top 5 organic results
 */
async function searchGoogleWithSerpApi(query: string, apiKey: string): Promise<string[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://serpapi.com/search.json?q=${encodedQuery}&num=5&api_key=${apiKey}`;
    
    console.log(`SerpApi: Searching for "${query}"`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`SerpApi error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const organicResults = data?.organic_results || [];
    
    const urls = organicResults
      .slice(0, MAX_URLS_TO_CRAWL)
      .map((result: any) => result.link)
      .filter(Boolean);
    
    console.log(`SerpApi: Found ${urls.length} URLs for "${query}"`);
    return urls;
  } catch (error) {
    console.error(`SerpApi search failed for "${query}":`, error);
    return [];
  }
}

/**
 * Deduplicate URLs - normalize and remove duplicates
 */
function deduplicateUrls(urls: string[]): string[] {
  const normalized = urls.map(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.href.replace(/\/$/, '').toLowerCase();
    } catch {
      return url.toLowerCase().replace(/\/$/, '');
    }
  });
  
  return [...new Set(normalized)];
}

/**
 * Fetch URL with retry logic (3 retries, 3s delay)
 */
async function fetchWithRetry(url: string, maxRetries = MAX_RETRIES): Promise<string | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        console.log(`Fetched: ${url} (${html.length} bytes)`);
        return html;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
      console.warn(`Fetch attempt ${attempt} failed for ${url}: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Fetch attempt ${attempt} error for ${url}: ${lastError.message}`);
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  console.error(`All ${maxRetries} retries failed for ${url}:`, lastError?.message);
  return null;
}

/**
 * Analyze a competitor page and extract insights
 */
function analyzeCompetitorPage(html: string, url: string): CompetitorInsight {
  const insight: CompetitorInsight = {
    url,
    h1: [],
    h2: [],
    faqs: [],
    priceMentions: [],
    schemaTypes: [],
    wordCount: 0,
    sectionCount: 0,
  };
  
  try {
    // Extract H1 tags
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    insight.h1 = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
    
    // Extract H2 tags
    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
    insight.h2 = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
    insight.sectionCount = h2Matches.length;
    
    // Extract FAQ questions (common patterns)
    const faqPatterns = [
      /<dt[^>]*>([^<]+)<\/dt>/gi,
      /<div[^>]*class="[^"]*faq[^"]*"[^>]*>.*?<strong>([^<]+)<\/strong>/gi,
      /<h3[^>]*>([^<]*(?:FAQ|question|how much|how long|is|can|does|will)[^<]*)<\/h3>/gi,
    ];
    
    for (const pattern of faqPatterns) {
      const matches = html.match(pattern) || [];
      for (const match of matches) {
        const question = match.replace(/<[^>]+>/g, '').trim();
        if (question.length > 10 && question.length < 200) {
          insight.faqQuestions.push({ question, answer: '' });
        }
      }
    }
    
    // Extract price mentions (AED patterns)
    const pricePattern = /AED\s*[\d,]+(?:\s*-\s*AED\s*[\d,]+)?/gi;
    const priceMatches = html.match(pricePattern) || [];
    insight.priceMentions = [...new Set(priceMatches.map(p => p.trim()))];
    
    // Extract JSON-LD schema types
    const schemaPattern = /"@type"\s*:\s*"([^"]+)"/g;
    const schemaMatches = html.match(schemaPattern) || [];
    insight.schemaTypes = [...new Set(schemaMatches.map(m => m.replace(/"/g, '').replace('@type: ', '')))];
    
    // Count words (simplified)
    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    insight.wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    
  } catch (error) {
    console.error(`Error analyzing page ${url}:`, error);
  }
  
  return insight;
}

/**
 * Analyze multiple competitor pages and consolidate insights
 */
function consolidateCompetitorInsights(insights: CompetitorInsight[]): ConsolidatedAnalysis {
  const allFaqs: string[] = [];
  const allPrices: string[] = [];
  const allSections: string[] = [];
  const allSchemas: string[] = [];
  const allUrls: string[] = [];
  
  for (const insight of insights) {
    allUrls.push(insight.url);
    
    // Collect FAQs
    for (const faq of insight.faqs) {
      if (faq.question) allFaqs.push(faq.question);
    }
    
    // Collect prices
    allPrices.push(...insight.priceMentions);
    
    // Collect sections
    allSections.push(...insight.h2.slice(0, 10));
    
    // Collect schema types
    allSchemas.push(...insight.schemaTypes);
  }
  
  // Find most common sections
  const sectionCounts: Record<string, number> = {};
  for (const section of allSections) {
    const normalized = section.toLowerCase().substring(0, 50);
    sectionCounts[normalized] = (sectionCounts[normalized] || 0) + 1;
  }
  
  const commonSections = Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([section]) => section);
  
  // Identify missing sections (based on common SEO patterns)
  const knownSections = ['pricing', 'cost', 'process', 'how it works', 'benefits', 'faq', 'faq', 'contact', 'appointment', 'booking'];
  const missingSections = knownSections.filter(
    s => !commonSections.some(cs => cs.includes(s))
  );
  
  // Extract price range
  let priceRangeFound = '';
  if (allPrices.length > 0) {
    const prices = allPrices.map(p => parseInt(p.replace(/[^0-9]/g, ''))).filter(p => !isNaN(p) && p > 0);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      priceRangeFound = `AED ${min.toLocaleString()} - AED ${max.toLocaleString()}`;
    }
  }
  
  return {
    queriesUsed: [],
    urlsAnalyzed: deduplicateUrls(allUrls),
    faqQuestions: [...new Set(allFaqs)].slice(0, 15),
    priceRangeFound,
    commonSections,
    missingSections,
    schemaTypesUsed: [...new Set(allSchemas)],
    contentGaps: missingSections.slice(0, 5),
  };
}

/**
 * Generate two search queries for a service-location
 */
function generateSearchQueries(serviceName: string, cityName: string, stateName: string): { commercial: string; informational: string } {
  const service = serviceName.toLowerCase();
  const city = cityName.toLowerCase().replace(/-/g, ' ');
  const state = stateName.toLowerCase();
  
  // Commercial intent - people looking to book
  const commercial = `${service} ${city} ${state}`;
  
  // Informational intent - people researching
  const informational = `${service} cost ${state}`.replace('cost cost', 'cost');
  
  return { commercial, informational };
}

/**
 * Build dynamic prompt with competitor insights
 */
function buildCompetitorBasedPrompt(
  analysis: ConsolidatedAnalysis | null,
  pageData: {
    state_slug: string;
    state_name: string;
    city_slug: string;
    city_name: string;
    service_slug: string;
    service_name: string;
  },
  basePrompt: string
): string {
  let competitorSection = '';
  
  if (analysis && analysis.urlsAnalyzed.length > 0) {
    competitorSection = `
═══════════════════════════════════════════════════════════════
COMPETITOR ANALYSIS (from SERP research)
═══════════════════════════════════════════════════════════════

URLs Analyzed: ${analysis.urlsAnalyzed.length}
${analysis.urlsAnalyzed.map((u, i) => `${i + 1}. ${u}`).join('\n')}

FAQ QUESTIONS FOUND ON TOP RANKING PAGES:
${analysis.faqQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}

PRICE RANGES FOUND ON COMPETITORS: ${analysis.priceRangeFound || 'Not found'}

COMMON SECTIONS ON TOP PAGES: ${analysis.commonSections.join(', ') || 'None detected'}

MISSING SECTIONS (CONTENT GAPS): ${analysis.contentGaps.join(', ') || 'None'}

SCHEMA TYPES USED BY COMPETITORS: ${analysis.schemaTypesUsed.join(', ') || 'None'}

═══════════════════════════════════════════════════════════════
YOUR TASK: Create content that OUTPERFORMS these competitors
═══════════════════════════════════════════════════════════════

1. INCLUDE ALL FAQ QUESTIONS that competitors use (listed above)
2. ADD these sections that competitors are MISSING: ${analysis.contentGaps.join(', ')}
3. MENTION price range: ${analysis.priceRangeFound || 'AED 5,000 - 20,000'}
4. USE these schema types: FAQPage, HowTo, Product
5. ADD unique value props AppointPanda offers:
   - Verified DHA-licensed dentists
   - Transparent AED pricing
   - Real patient reviews (4.9+ rating)
   - Free booking consultation
6. MAKE content MORE comprehensive than competitors (aim for 1500+ words)

Write content that will rank HIGHER than these competitor pages.
`;
  } else {
    competitorSection = `
═══════════════════════════════════════════════════════════════
COMPETITOR ANALYSIS: Not available (generation without SERP research)
═══════════════════════════════════════════════════════════════
`;
  }
  
  // Replace placeholder in base prompt or append
  return basePrompt + competitorSection;
}

// ========================== MAIN SYSTEM PROMPT ==========================

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

CRITICAL CONTENT RULE:
Each page MUST include at least 2 REAL-WORLD INSIGHTS such as:
- When people in this area book appointments
- What problems they face (time, cost, language)
- What type of clinics dominate this area

If these are missing, the content is INVALID.

INSIGHT DEPTH RULE:
Each insight MUST be SPECIFIC and OBSERVABLE.

BAD:
- "people prefer convenience"

GOOD:
- "many clinics here stay open until 10pm because residents work late shifts"

BAD:
- "families care about kids"

GOOD:
- "parents here often look for clinics with play areas because children get anxious"

If insights are vague → content is INVALID.

COMPARISON RULE:
Mention at least one contrast:
- How this area differs from another nearby area
- OR how dental needs differ here vs other parts of the emirate

Example:
"Unlike Downtown, where clinics focus on tourists, residents here prefer long-term family dentists"

UNIQUE SECTION RULE:
Each page MUST include one section that is completely unique to this location.

Examples:
- "Where locals actually go for dental care in {area}"
- "What surprises residents about dentists in {area}"
- "The reality of dental pricing in {area}"

STRUCTURE RULE:
Randomly use one of these formats:
1. Lifestyle → Problem → Clinics → CTA
2. Problem → Insight → Recommendation → CTA
3. Area breakdown → Advice → CTA
4. Story → Insight → CTA

DO NOT reuse the same structure repeatedly.

ANTI-GENERIC CHECK:
At least ONE insight must include:
- a number (e.g. "until 10pm")
- OR a specific behavior pattern (e.g. "last-minute bookings after 7pm")

If all insights are broad/general → INVALID.

LANDMARK USAGE RULE:
Do not just mention landmarks.

Connect them to behavior:

BAD:
- "near Dubai Mall"

GOOD:
- "clinics near Dubai Mall tend to get last-minute bookings from shoppers and office workers"

If landmarks are not used meaningfully → INVALID.

LOCAL OPINION RULE:
Include at least one opinion or recommendation:

Examples:
- "most residents here avoid premium clinics unless necessary"
- "families here tend to stick with one dentist for years"

If content sounds neutral/informational only → INVALID.

WRITING STYLE VARIATION:
Randomly adopt one tone:
- conversational
- advisory
- slightly opinionated
- problem-solution focused

Do NOT use the same tone for all pages.

GRAMMAR RULE:
- NEVER use em-dashes (—) or long dashes
- Use proper punctuation: commas, periods, semicolons
- Write in complete, grammatically correct sentences
- Avoid hyphenation abuse
- Use proper contractions where natural

If content contains em-dashes → REWRITE.

═══
FAQ UNIQUENESS
═══
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

const USER_PROMPT_TEMPLATE = `Generate a city page for {location_name}, {emirate_name}.

This is NOT a generic SEO page. This should feel like insider advice from someone who understands how people in this area actually live.

LOCAL CONTEXT:
* Character: {area_character}
* Demographics: {demographics}
* Landmarks: {landmarks}
* Narrative: {narrative}

MANDATORY RULES:

1. PICK ONE REAL-LIFE ANGLE:
   * Busy professionals with no time
   * Families with kids
   * Expats needing language-friendly clinics
   * Budget-conscious residents
   * Premium/luxury lifestyle

2. ADD REAL HUMAN INSIGHTS:
   You MUST include:
   * When people usually visit dentists here (evenings, weekends, emergencies)
   * What they care about (price, speed, comfort, language)
   * What kind of clinics are common in this area

3. DO NOT EXPLAIN THE PLATFORM:
   Do NOT talk about features like "directory", "booking platform", etc.
   Assume the user already knows.

4. NO GENERIC LINES:
   Avoid anything that sounds like marketing:
   * "comprehensive services"
   * "world-class care"
   * "best dental experience"

5. MAKE IT SPECIFIC:
   If this content can work for another city → it is WRONG.

6. VARY YOUR STRUCTURE:
   Randomly use one of these formats:
   - Lifestyle → Problem → Clinics → CTA
   - Problem → Insight → Recommendation → CTA
   - Area breakdown → Advice → CTA
   - Story → Insight → CTA

7. INSIGHT DEPTH RULE:
   Each insight MUST be SPECIFIC and OBSERVABLE.

   BAD: "people prefer convenience"
   GOOD: "many clinics here stay open until 10pm because residents work late shifts"

   BAD: "families care about kids"
   GOOD: "parents here often look for clinics with play areas because children get anxious"

8. COMPARISON RULE:
   Mention at least one contrast showing how this area differs from nearby areas.

   Example: "Unlike Downtown, where clinics focus on tourists, residents here prefer long-term family dentists"

9. UNIQUE SECTION RULE:
   Each page MUST include one section completely unique to this location.

   Examples:
   - "Where locals actually go for dental care in {location_name}"
   - "What surprises residents about dentists in {location_name}"
   - "The reality of dental pricing in {location_name}"

10. ANTI-GENERIC CHECK:
    At least ONE insight must include a number or specific behavior.

    BAD: "clinics have convenient hours"
    GOOD: "clinics stay open until 10pm to serve working professionals"

11. LANDMARK USAGE RULE:
    Connect landmarks to behavior, not just mention them.

    BAD: "near Dubai Mall"
    GOOD: "clinics near Dubai Mall get last-minute bookings from shoppers"

12. LOCAL OPINION RULE:
    Include at least one opinion about dental care in this area.

    Examples:
    - "most residents here avoid premium clinics unless necessary"
    - "families here stick with one dentist for years"

13. WRITING STYLE:
    Randomly choose a tone: conversational, advisory, slightly opinionated, or problem-solution.

14. GRAMMAR RULE:
    - NEVER use em-dashes (—) or long dashes
    - Use proper punctuation: commas, periods, semicolons
    - Write in complete, grammatically correct sentences
    - Avoid hyphenation abuse
    - Use proper contractions where natural

FAIL CONDITIONS:
* Generic tone → rewrite
* No real-life insight → rewrite
* Sounds like template → rewrite
* Vague insights (not specific/observable) → rewrite
* No comparison to other areas → rewrite
* No unique section → rewrite
* Insights without numbers or specific behaviors → rewrite
* Landmarks mentioned but not connected to behavior → rewrite
* Content sounds neutral/informational only (no opinions) → rewrite
* Contains em-dashes (—) → rewrite
* Grammatically incorrect sentences → rewrite

OUTPUT:
Return ONLY JSON with:
{
  "page_type": "city",
  "page_slug": "/{emirate_slug}/{city_slug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": [],
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "section_1_title": "",
  "section_1_content": "",
  "section_2_title": "",
  "section_2_content": "",
  "section_3_title": "",
  "section_3_content": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [],
  "is_published": true
}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_ANGLES = [
  "Busy professionals with no time - focus on evening/weekend appointments, quick turnaround",
  "Families with kids - focus on pediatric specialists, family-friendly atmosphere, play areas",
  "Expats needing language-friendly clinics - focus on multilingual staff, international standards",
  "Budget-conscious residents - focus on affordable options, payment plans, insurance coverage",
  "Premium/luxury lifestyle - focus on spa-like clinics, advanced technology, concierge service"
];

// Service-specific prompts for generating unique service pages
const SERVICE_PROMPTS: Record<string, { angle: string; pain_points: string; why_unique: string }> = {
  "invisalign": {
    angle: "invisible orthodontic solution for professionals",
    pain_points: "Adults don't want metal braces in business meetings, concerns about treatment duration, unsure about effectiveness vs traditional braces",
    why_unique: "Unlike braces, aligners are removable for meetings and eating - most clinics offer free consultations"
  },
  "dental-implants": {
    angle: "permanent tooth replacement solution",
    pain_points: "Fear of surgery, cost concerns, unsure about implant brands, recovery time worries",
    why_unique: "Implants feel like natural teeth - different brands have different warranties, some offer same-day implants"
  },
  "veneers": {
    angle: "instant smile transformation",
    pain_points: "Cost per tooth, fear of tooth reduction, unsure about longevity, different material options (porcelain vs composite)",
    why_unique: "Veneers can transform your smile in 2 visits - but quality varies significantly by clinic and material"
  },
  "teeth-whitening": {
    angle: "quick cosmetic improvement",
    pain_points: "Sensitivity concerns, results not lasting, in-office vs at-home options, unsafe whitening products",
    why_unique: "Professional whitening is safer and faster than DIY kits - results can last 1-3 years with proper care"
  },
  "root-canal": {
    angle: "saving damaged teeth",
    pain_points: "Fear of pain, multiple visits needed, crown needed after, cost vs extraction",
    why_unique: "Root canals save your natural tooth - modern techniques make it virtually painless"
  },
  "dental-crowns": {
    angle: "protecting damaged teeth",
    pain_points: "Cost differences between materials, same-day vs multiple visits, durability concerns",
    why_unique: "Crowns protect weak teeth - same-day crowns now available at many clinics using CAD/CAM technology"
  },
  "braces": {
    angle: "traditional orthodontic treatment",
    pain_points: "Appearance concerns, food restrictions, cleaning difficulties, treatment duration",
    why_unique: "Modern braces are smaller and less visible - lingual braces hide completely behind teeth"
  },
  "tooth-extraction": {
    angle: "removing problem teeth",
    pain_points: "Pain concerns, swelling management, wisdom teeth complications, cost differences",
    why_unique: "Wisdom teeth removal is common - costs vary significantly based on complexity and anesthesia type"
  },
  "dental-check-up": {
    angle: "preventive dental care",
    pain_points: "Finding time, cost of x-rays, what to expect, how often to visit",
    why_unique: "Regular checkups prevent major problems - most clinics offer free first consultations"
  },
  "pediatric-dentistry": {
    angle: "children's dental care",
    pain_points: "Child afraid of dentist, finding pediatric specialist, behavior management techniques",
    why_unique: "Pediatric dentists specialize in children - first visit should be by age 1"
  }
};

const AREA_CHARACTERS: Record<string, Record<string, { character: string; demographics: string; landmarks: string; narrative: string }>> = {
  "dubai": {
    "deira": { character: "bustling commercial heart with traditional markets and old Dubai charm", demographics: "mixed income families, shift workers, small business owners, expats from South Asia", landmarks: "Dubai Creek, Gold Souk, City Centre Deira, Al Marjan Building", narrative: "people here value convenience and extended hours - many clinics open until 10pm to serve shift workers" },
    "jumeirah": { character: "beachfront upscale residential with families and professionals", demographics: "high-income families, expats, business owners", landmarks: "Jumeirah Beach, Burj Al Arab, Jumeirah Mosque, Beach Road", narrative: "residents here prioritize quality over cost - expect premium clinics with latest technology" },
    "bur-dubai": { character: "historic area with traditional buildings and mix of old/new", demographics: "local families, older residents, small businesses", landmarks: "Dubai Museum, Al Fahidi Fort, Meena Bazaar", narrative: "traditional community feel - locals prefer trusted family dentists they've known for years" },
    "karama": { character: "dense residential area with mix of villas and apartments", demographics: "mid-income families, salaried professionals, expats", landmarks: "Karama Market, Dubai Police Station", narrative: "practical, value-conscious residents who want good care without premium prices" },
    "mirdif": { character: "sprawling residential suburb with villas and family compounds", demographics: "large families, Emirati families, mid-high income", landmarks: "Mirdif City Centre, Uptown Mirdif", narrative: "family-oriented area - parents look for pediatric specialists and child-friendly environments" },
    "rashidiya": { character: "established residential area near airport", demographics: "families, airport workers, mid-income", landmarks: "Rashidiya Park, Metro Station", narrative: "practical community - appreciate clinics that accept insurance and offer payment plans" },
    "al-quoz": { character: "industrial-artistic hub with galleries and workshops", demographics: "artists, creative professionals, small business owners", landmarks: "Al Quoz Industrial Areas, Galleries", narrative: "creative community - appreciate holistic dental approaches and natural options" },
    "al-barsha": { character: "residential and commercial mix near Mall of Emirates", demographics: "families, professionals, shoppers", landmarks: "Mall of Emirates, Barsha Heights, Tecom", narrative: "busy area - people want efficient appointments without long waits" },
    "jlt": { character: "high-rise residential towers near marina", demographics: "young professionals, expats, singles", landmarks: "JLT Towers, Cluster P", narrative: "time-poor professionals who book last-minute and prefer online scheduling" },
    "marina": { character: "waterfront lifestyle with skyscrapers and restaurants", demographics: "young professionals, expats, tourists", landmarks: "Marina Walk, Dubai Marina Mall, Pier 7", narrative: "cosmopolitan crowd that expects premium service and modern facilities" },
    "business-bay": { character: "corporate district with offices and residential towers", demographics: "executives, business professionals, entrepreneurs", landmarks: "Business Bay towers, Dubai Canal", narrative: "time-strapped executives who need quick, efficient dental visits during work hours" },
    "downtown": { character: "city center with iconic landmarks and tourism", demographics: "tourists, business visitors, high-income residents", landmarks: "Burj Khalifa, Dubai Mall, DIFC", narrative: "visitors and short-term residents - need urgent care and English-speaking dentists" },
    "sheikh-zayed-road": { character: "major highway corridor with skyscrapers", demographics: "professionals, commuters, business owners", landmarks: "Trade Centre, World Trade Centre", narrative: "convenience-focused - appreciate clinics with parking and late hours" },
    "al-awir": { character: "desert outskirts with farms and villas", demographics: "Emirati families, farmers, rural residents", landmarks: "Al Awir Farms, Desert", narrative: "traditional community - prefer familiar dentists and word-of-mouth recommendations" },
    "international-city": { character: "large residential area with diverse expat community", demographics: "expats from many countries, budget-conscious workers", landmarks: "Dragon Mart, International City phases", narrative: "multicultural community - need multilingual clinics and affordable options" },
    "silicon-oasis": { character: "tech hub with residential compounds", demographics: "tech professionals, engineers, families", landmarks: "Silicon Oasis headquarters, Cedre Shopping Centre", narrative: "tech-savvy residents who book online and appreciate modern equipment" },
    "academic-city": { character: "education district with universities", demographics: "students, professors, academic staff", landmarks: "Dubai International Academic City, universities", narrative: "budget-conscious students who need affordable basic care and flexible payment" },
    "motor-city": { character: "sports and automotive themed community", demographics: "motorsport enthusiasts, families, car enthusiasts", landmarks: "Motor City racetrack, Ibn Battuta Mall", narrative: "active community - need flexible appointments around work and sports schedules" },
    "sports-city": { character: "sports complex with residential areas", demographics: "athletes, fitness enthusiasts, families", landmarks: "Dubai Sports City, Cricket Stadium", narrative: "health-conscious residents who need sports dentistry and emergency dental care" },
    "discovery-gardens": { character: "large residential compound with gardens", demographics: "families, expats, mid-income", landmarks: "Discovery Gardens, Ibn Battuta", narrative: "quiet residential area - families appreciate child-friendly clinics" },
    "al-hebar": { character: "outlying industrial and residential area", demographics: "workers, families, industrial workers", landmarks: "Industrial areas", narrative: "underserved area - residents need affordable basic dental care" },
    "al-khawan": { character: "traditional residential area near Sharjah border", demographics: "families, mixed income", landmarks: "Local markets", narrative: "price-sensitive residents who appreciate value and quality" },
    "emirates-hills": { character: "exclusive gated villa community", demographics: "ultra-high-net-worth individuals, business owners", landmarks: "Emirates Hills, Montgomerie Golf", narrative: "expect luxury concierge dental service with premium materials" },
    "green-community": { character: "planned community with green spaces", demographics: "families, nature-lovers", landmarks: "Green Community, Jebel Ali", narrative: "family-focused residents who value preventive care and education" },
    "jebel-ali": { character: "industrial port area with residential pockets", demographics: "industrial workers, logistics professionals, families", landmarks: "Jebel Ali Port, Industrial areas", narrative: "hard-working community - need clinics that understand fatigue and physical labor effects on teeth" },
    "umm-suqeim": { character: "beach area with villas and hotels", demographics: "families, hotel workers, beachgoers", landmarks: "Umm Suqeim Beach, Wild Wadi", narrative: "mix of luxury and local - residents appreciate honesty and don't want overtreatment" }
  },
  "abu-dhabi": {
    "khalifa-city": { character: "planned city with government offices and residential", demographics: "government employees, professionals, families", landmarks: "Khalifa City A, B, Masdar City", narrative: "well-planned community - appreciate organized clinics with modern equipment" },
    "corniche": { character: "waterfront promenade with towers and beaches", demographics: "professionals, families, tourists", landmarks: "Corniche Beach, Abu Dhabi Mall", narrative: "cosmopolitan residents who expect high standards and professional service" },
    "al-reem-island": { character: "reclaimed island with high-rise towers", demographics: "expats, young professionals, families", landmarks: "Reem Island towers, Sorbonne University", narrative: "modern community - tech-savvy and book appointments online" },
    "saadiyat-island": { character: "cultural island with museums and beaches", demographics: "cultural workers, artists, high-income expats", landmarks: "Louvre Abu Dhabi, Saadiyat Beach", narrative: "educated community that values artistic, aesthetic dental work" },
    "yas-island": { character: "entertainment hub with theme parks and hotels", demographics: "tourists, entertainment workers, event staff", narrative: "fast-paced area - need clinics that handle urgent cases and tourists without appointments" },
    "al-ain": { character: "garden city with traditional and modern areas", demographics: "local families, students, professionals", landmarks: "Al Ain Zoo, Camel Market, Forts", narrative: "traditional community - families have long-term relationships with their dentists" },
    "al-musaffah": { character: "industrial and residential area", demographics: "industrial workers, laborers, families", landmarks: "Industrial area", narrative: "working-class community needs affordable basic dental care" },
    "al-nahda": { character: "established residential area near stadium", demographics: "families, sports enthusiasts", landmarks: "Hazza Bin Zayed Stadium", narrative: "sports-oriented community - need dental care for active lifestyles" },
    "mohamed-bin-zayed-city": { character: "residential suburb with villas", demographics: "Emirati families, mid-high income", landmarks: "MBZ City, Schools", narrative: "family-oriented area - parents prioritize children's dental health" }
  },
  "sharjah": {
    "al-corniche": { character: "waterfront area with parks and residential", demographics: "families, local residents", landmarks: "Al Corniche, Sharjah Museum", narrative: "traditional families who appreciate conservative treatment approaches" },
    "al-qasba": { name: "canal area with tourism and residential", demographics: "families, tourists", landmarks: "Al Qasba Canal, Eye Wheel", narrative: "family-friendly area with children - need pediatric specialists" },
    "al-majaz": { character: "cultural district with parks and museums", demographics: "families, students, culture enthusiasts", landmarks: "Sharjah Art Museum, Al Majaz Waterfront", narrative: "educated community that values knowledge about dental health" },
    "al-nahda": { character: "commercial and residential mix", demographics: "business owners, families, shop owners", narrative: "practical community - appreciate transparent pricing and no-nonsense approach" }
  },
  "ajman": {
    "al-alia": { character: "residential area near Ajman City Centre", demographics: "families, workers", landmarks: "Ajman City Centre", narrative: "newer area with young families - appreciate modern clinics" },
    "al-hamidiya": { character: "established residential area", demographics: "local families, long-term residents", narrative: "traditional community with strong family ties - trust familiar dentists" },
    "emirates-city": { character: "new development with towers", demographics: "expats, professionals", narrative: "growing community - appreciate efficient service" }
  },
  "ras-al-khaimah": {
    "al-nakheel": { character: "coastal area with hotels and residential", demographics: "tourism workers, families", narrative: "tourism-focused area - need flexible appointments for hospitality workers" },
    "al-hammadiya": { character: "traditional residential area", demographics: "local families", narrative: "traditional community values long-term dentist relationships" },
    "al-jeer": { character: "coastal fishing village area", demographics: "fishermen, local families", narrative: "traditional area - need basic affordable dental care" }
  },
  "fujairah": {
    "al-fujairah-city": { character: "mountain-fringed coastal city", demographics: "families, mountain residents", landmarks: "Fujairah Fort, Beach", narrative: "tight-knit community - word-of-mouth recommendations matter" },
    "al-siji": { character: "industrial and residential area", demographics: "workers, families", narrative: "working community needs affordable basic dental services" }
  },
  "umm-al-quwain": {
    "al-rashidya": { character: "old residential area near the lagoon", demographics: "local families, fishermen", landmarks: "UAQ Lagoon, Old Town", narrative: "traditional community with deep roots - prefer familiar dentists" },
    "al-mudah": { character: "developing residential area", demographics: "new families, workers", narrative: "growing community needs modern dental options" }
  }
};

const CITY_KEYS = [
  "deira", "jumeirah", "bur-dubai", "karama", "mirdif", "rashidiya", "al-quoz", "al-barsha", "jlt", "marina", "business-bay", "downtown", 
  "sheikh-zayed-road", "al-awir", "international-city", "silicon-oasis", "academic-city", "motor-city", "sports-city", 
  "discovery-gardens", "al-hebar", "al-khawan", "emirates-hills", "green-community", "jebel-ali", "umm-suqeim",
  "khalifa-city", "corniche", "al-reem-island", "saadiyat-island", "yas-island", "al-ain", "al-musaffah", "al-nahda", "mohamed-bin-zayed-city",
  "al-corniche", "al-qasba", "al-majaz", "al-nahda", "al-alia", "al-hammadiya", "emirates-city", "al-nakheel", "al-hammadiya", "al-jeer",
  "al-fujairah-city", "al-siji", "al-rashidya", "al-mudah"
];

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
      character: "mixed residential area with working professionals and families",
      demographics: "mid-income residents, families, salaried workers",
      landmarks: "local markets, community centers, residential compounds",
      narrative: "residents here prefer affordable clinics and often visit after work hours or weekends"
    };
  }
  
  return areaData;
}

function getServicePrompt(serviceSlug: string) {
  return SERVICE_PROMPTS[serviceSlug] || {
    angle: "dental procedure",
    pain_points: "cost concerns, finding qualified providers, treatment options",
    why_unique: "quality and experience vary significantly between providers"
  };
}

async function generateServiceContent(pageData: any, aimlapiKey: string, forceRegenerate: boolean): Promise<any> {
  const serviceSlug = pageData.slug.replace("services/", "");
  const serviceData = getServicePrompt(serviceSlug);
  
  const prompt = `Generate a service page for ${serviceSlug.replace(/-/g, " ")} in UAE.

SERVICE CONTEXT:
* Treatment type: ${serviceSlug}
* Focus angle: ${serviceData.angle}
* Patient pain points: ${serviceData.pain_points}
* What makes UAE unique: ${serviceData.why_unique}

═══════════════════════════════════════════════════════════════════════
AI-OPTIMIZED STRUCTURE (CRITICAL FOR AI OVERVIEW EXTRACTION)
═══════════════════════════════════════════════════════════════════════
Your content MUST be structured to help AI systems (Google AI Overviews, Perplexity, ChatGPT) extract and cite content. Use this exact format:

1. AI_DEFINITION: Start with 2-3 sentences directly answering "What is [treatment]?" - this is what AI will quote
2. PROCESS_STEPS: Numbered step-by-step guide (6-8 steps) 
3. COST_RANGE: AED price table with min/max for each component
4. CHECKLIST: "Is it right for me?" - bullet points with YES/NO applicability
5. COMPARISON: Optional - compare treatment alternatives

MANDATORY RULES:

1. WRITE LIKE A DENTAL EXPERT ADVISING A PATIENT:
   - Don't sell - inform and educate
   - Include real costs ranges for UAE in AED
   - Mention realistic timelines
   - Include what to ask during consultations

2. UAE-SPECIFIC CONTENT:
   - Include cost ranges in AED (dirhams)
   - Mention DHA/DOH licensing requirements
   - Reference insurance coverage where relevant
   - Consider expat vs local patient perspectives

3. FAQ UNIQUENESS:
   - 10 FAQs about this specific procedure
   - Include UAE-specific questions (insurance, licensing, location)
   - Answer questions patients actually ask

4. NO GENERIC MARKETING:
   - Don't say "world-class care"
   - Don't say "book your appointment today"
   - Don't use template language

5. GRAMMAR RULE:
   - NEVER use em-dashes (—)
   - Use proper punctuation

OUTPUT:
Return ONLY JSON with:
{
  "page_type": "service",
  "page_slug": "/services/${serviceSlug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": [],
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [],
  "is_published": true,
  "ai_definition": "2-3 sentence direct answer to 'What is [treatment]?'",
  "ai_process_steps": [{"step": 1, "title": "", "description": ""}, ...],
  "ai_cost_range": [{"treatment": "", "min_aed": 0, "max_aed": 0, "notes": ""}, ...],
  "ai_checklist": [{"criteria": "", "applies": true/false, "description": ""}, ...]
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
    
    // More robust JSON extraction
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    
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

async function generateServiceLocationContent(pageData: any, aimlapiKey: string, forceRegenerate: boolean): Promise<any> {
  const parts = pageData.slug.split("/").filter(Boolean);
  const stateSlug = parts[0];
  const citySlug = parts[1];
  const serviceSlug = parts[2];
  
  const serviceData = getServicePrompt(serviceSlug);
  const areaData = getAreaData(stateSlug, citySlug);
  
  const prompt = `Generate a comprehensive service-location page for ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name}, ${pageData.state_name}.

LOCATION CONTEXT:
* City character: ${areaData.character}
* Demographics: ${areaData.demographics}
* What locals say: ${areaData.narrative}

SERVICE CONTEXT:
* Treatment: ${serviceSlug}
* Patient concerns: ${serviceData.pain_points}
* UAE perspective: ${serviceData.why_unique}

MANDATORY RULES:

1. COMBINE LOCATION + SERVICE:
   - How does this area's character affect dental needs for this service?
   - What do residents here specifically need for this treatment?
   - Reference local clinics or patterns

2. LOCATION-SPECIFIC INSIGHTS:
   - What type of patients seek this service in this area?
   - Are there more premium or budget options here?
   - What are the local considerations?

3. UAE-SPECIFIC:
   - Cost ranges in AED
   - DHA/DOH requirements
   - Insurance patterns
   - Expat considerations

4. FAQ UNIQUENESS:
   - 10 FAQs specific to this location + service combination
   - Include local area references

5. NO GENERIC CONTENT:
   - Don't swap location names into templates
   - Must be specific insights

6. GRAMMAR:
   - No em-dashes (—)

7. COMPREHENSIVE SEO FIELDS:
   You MUST include these additional fields for enhanced SEO and AI optimization:
   - price_min: Minimum price in AED (number)
   - price_max: Maximum price in AED (number)
   - price_note: Short note about pricing (string)
   - price_last_updated: Date string like "April 2026"
   - process_steps: Array of {step, title, description, duration} objects (5-6 steps)
   - process_time_months: String like "12-24 months" or "2-3 visits"
   - treatment_options: Array of {type, name, price_min, price_max, duration, visibility, best_for} objects
   - benefits: Array of {title, description, icon} objects (5-6 benefits)
   - candidates: Array of {description, is_suitable, conditions} objects
   - alternatives: Array of {name, slug, reason} objects
   - quick_answer: 50-100 word AI summary for featured snippets
   - related_questions: Array of {question, answer} objects (4 questions)
   - last_reviewed_by: Name of dental expert who reviewed
   - last_reviewed_date: Date string like "April 2026"
   - medical_accuracy_verified: Boolean (default true)
   - expert_credential: String like "DHA Licensed Orthodontist"

OUTPUT:
Return ONLY JSON with:
{
  "page_type": "service-location",
  "page_slug": "/${stateSlug}/${citySlug}/${serviceSlug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": [],
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [],
  "price_min": 5000,
  "price_max": 15000,
  "price_note": "Price ranges vary by clinic and case complexity",
  "price_last_updated": "April 2026",
  "process_steps": [],
  "process_time_months": "12-24 months",
  "treatment_options": [],
  "benefits": [],
  "candidates": [],
  "alternatives": [],
  "quick_answer": "",
  "related_questions": [],
  "last_reviewed_by": "Dr. [Name]",
  "last_reviewed_date": "April 2026",
  "medical_accuracy_verified": true,
  "expert_credential": "DHA Licensed Dentist",
  "is_published": true
}`;

  try {
    const aiResponse = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    console.log("SL_GEN: AI response type:", typeof aiResponse);

    if (!aiResponse) {
      return { success: false, error: "No response from AI" };
    }

    const content = String(aiResponse);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("SL_GEN: No JSON in response:", content.substring(0, 300));
      return { success: false, error: "Invalid JSON in response" };
    }

    try {
      const pageDataResult = JSON.parse(jsonMatch[0]);
      return { success: true, data: pageDataResult };
    } catch (parseErr) {
      console.error("SL_GEN: JSON parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
      return { success: false, error: "JSON parse failed" };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

/**
 * Generate service-location content with competitor analysis
 */
async function generateServiceLocationContentWithAnalysis(
  pageData: any, 
  aimlapiKey: string, 
  analysis: ConsolidatedAnalysis | null,
  forceRegenerate: boolean
): Promise<any> {
  const parts = pageData.slug.split("/").filter(Boolean);
  const stateSlug = parts[0];
  const citySlug = parts[1];
  const serviceSlug = parts[2];
  
  const serviceData = getServicePrompt(serviceSlug);
  const areaData = getAreaData(stateSlug, citySlug);
  
  // Build base prompt
  let prompt = `Generate a comprehensive service-location page for ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name}, ${pageData.state_name}.

LOCATION CONTEXT:
* City character: ${areaData.character}
* Demographics: ${areaData.demographics}
* What locals say: ${areaData.narrative}

SERVICE CONTEXT:
* Treatment: ${serviceSlug}
* Patient concerns: ${serviceData.pain_points}
* UAE perspective: ${serviceData.why_unique}

MANDATORY RULES:

1. COMBINE LOCATION + SERVICE:
   - How does this area's character affect dental needs for this service?
   - What do residents here specifically need for this treatment?
   - Reference local clinics or patterns

2. LOCATION-SPECIFIC INSIGHTS:
   - What type of patients seek this service in this area?
   - Are there more premium or budget options here?
   - What are the local considerations?

3. UAE-SPECIFIC:
   - Cost ranges in AED
   - DHA/DOH requirements
   - Insurance patterns
   - Expat considerations

4. FAQ UNIQUENESS:
   - 10 FAQs specific to this location + service combination
   - Include local area references

5. NO GENERIC CONTENT:
   - Don't swap location names into templates
   - Must be specific insights

6. GRAMMAR:
   - No em-dashes (—)

7. COMPREHENSIVE SEO FIELDS:
   You MUST include these additional fields for enhanced SEO and AI optimization:
   - price_min: Minimum price in AED (number)
   - price_max: Maximum price in AED (number)
   - price_note: Short note about pricing (string)
   - price_last_updated: Date string like "April 2026"
   - process_steps: Array of {step, title, description, duration} objects (5-6 steps)
   - process_time_months: String like "12-24 months" or "2-3 visits"
   - treatment_options: Array of {type, name, price_min, price_max, duration, visibility, best_for} objects
   - benefits: Array of {title, description, icon} objects (5-6 benefits)
   - candidates: Array of {description, is_suitable, conditions} objects
   - alternatives: Array of {name, slug, reason} objects
   - quick_answer: 50-100 word AI summary for featured snippets
   - related_questions: Array of {question, answer} objects (4 questions)
   - last_reviewed_by: Name of dental expert who reviewed
   - last_reviewed_date: Date string like "April 2026"
   - medical_accuracy_verified: Boolean (default true)
   - expert_credential: String like "DHA Licensed Orthodontist"

OUTPUT:
Return ONLY JSON with:
{
  "page_type": "service-location",
  "page_slug": "/${stateSlug}/${citySlug}/${serviceSlug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": [],
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [],
  "price_min": 5000,
  "price_max": 15000,
  "price_note": "Price ranges vary by clinic and case complexity",
  "price_last_updated": "April 2026",
  "process_steps": [],
  "process_time_months": "12-24 months",
  "treatment_options": [],
  "benefits": [],
  "candidates": [],
  "alternatives": [],
  "quick_answer": "",
  "related_questions": [],
  "last_reviewed_by": "Dr. [Name]",
  "last_reviewed_date": "April 2026",
  "medical_accuracy_verified": true,
  "expert_credential": "DHA Licensed Dentist",
  "is_published": true
}`;

  // If we have competitor analysis, append the competitor section to the prompt
  if (analysis && analysis.urlsAnalyzed.length > 0) {
    prompt += `

═══════════════════════════════════════════════════════════════
COMPETITOR ANALYSIS (from SERP research)
═══════════════════════════════════════════════════════════════

URLs Analyzed: ${analysis.urlsAnalyzed.length}
${analysis.urlsAnalyzed.map((u, i) => `${i + 1}. ${u}`).join('\n')}

FAQ QUESTIONS FOUND ON TOP RANKING PAGES:
${analysis.faqQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}

PRICE RANGES FOUND ON COMPETITORS: ${analysis.priceRangeFound || 'Not found'}

COMMON SECTIONS ON TOP PAGES: ${analysis.commonSections.join(', ') || 'None detected'}

MISSING SECTIONS (CONTENT GAPS): ${analysis.contentGaps.join(', ') || 'None'}

SCHEMA TYPES USED BY COMPETITORS: ${analysis.schemaTypesUsed.join(', ') || 'None'}

═══════════════════════════════════════════════════════════════
YOUR TASK: Create content that OUTPERFORMS these competitors
═══════════════════════════════════════════════════════════════

1. INCLUDE ALL FAQ QUESTIONS that competitors use (listed above)
2. ADD these sections that competitors are MISSING: ${analysis.contentGaps.join(', ')}
3. MENTION price range: ${analysis.priceRangeFound || 'AED 5,000 - 20,000'}
4. USE these schema types: FAQPage, HowTo, Product
5. ADD unique value props AppointPanda offers:
   - Verified DHA-licensed dentists
   - Transparent AED pricing
   - Real patient reviews (4.9+ rating)
   - Free booking consultation
6. MAKE content MORE comprehensive than competitors (aim for 1500+ words)

Write content that will rank HIGHER than these competitor pages.
`;
  }

  try {
    const aiResponse = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    console.log("SL_GEN: AI response type:", typeof aiResponse);

    if (!aiResponse) {
      return { success: false, error: "No response from AI" };
    }

    const content = String(aiResponse);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("SL_GEN: No JSON in response:", content.substring(0, 300));
      return { success: false, error: "Invalid JSON in response" };
    }

    try {
      const pageDataResult = JSON.parse(jsonMatch[0]);
      return { success: true, data: pageDataResult };
    } catch (parseErr) {
      console.error("SL_GEN: JSON parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
      return { success: false, error: "JSON parse failed" };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

/**
 * Save SEO page with competitor analysis data
 */
async function saveSeoPageWithCompetitorAnalysis(supabase: any, pageData: any, analysis: ConsolidatedAnalysis | null): Promise<void> {
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
  // Convert date string to proper format or skip if invalid
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

  // Add competitor analysis data
  if (analysis) {
    saveData.competitor_analysis = {
      queries_used: analysis.queriesUsed,
      urls_analyzed: analysis.urlsAnalyzed,
      faq_questions: analysis.faqQuestions,
      price_range_found: analysis.priceRangeFound,
      common_sections: analysis.commonSections,
      missing_sections: analysis.contentGaps,
      schema_types_used: analysis.schemaTypesUsed,
      generated_at: new Date().toISOString(),
    };
  }

  console.log(`page-content-generator: Saving page with competitor analysis: ${pageData.page_slug}`);
  console.log(`page-content-generator: Competitor analysis: ${analysis ? 'included' : 'none'}`);

  // Save to seo_pages
  const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

  if (error) {
    console.error(`page-content-generator: Save error:`, JSON.stringify(error));
    throw error;
  }

  console.log(`page-content-generator: Successfully saved ${pageData.page_slug} with competitor analysis`);
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
          max_tokens: 4000,
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
    
    // Try to find JSON in code blocks first
    let jsonMatch = cleanedText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue
      }
    }
    
    // Try to find JSON object directly - look for opening { and try to parse
    const jsonStart = cleanedText.indexOf('{');
    if (jsonStart !== -1) {
      // Try to find the closing brace by counting brackets
      let depth = 0;
      let endPos = -1;
      for (let i = jsonStart; i < cleanedText.length; i++) {
        if (cleanedText[i] === '{') depth++;
        else if (cleanedText[i] === '}') depth--;
        if (depth === 0) {
          endPos = i + 1;
          break;
        }
      }
      
      if (endPos !== -1) {
        const jsonStr = cleanedText.substring(jsonStart, endPos);
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Continue
        }
      }
    }
    
    // Last resort: try matching any {...} pattern
    const anyMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (anyMatch) {
      try {
        return JSON.parse(anyMatch[0]);
      } catch {
        return null;
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

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace(/{location_name}/g, locationName)
    .replace(/{emirate_name}/g, emirateName)
    .replace(/{emirate_slug}/g, emirateSlug)
    .replace(/{city_slug}/g, citySlug)
    .replace(/{area_character}/g, areaData.character)
    .replace(/{demographics}/g, areaData.demographics)
    .replace(/{landmarks}/g, areaData.landmarks)
    .replace(/{narrative}/g, areaData.narrative)
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
  
  // Determine page_type - use what AI returns, or derive from slug if missing
  let pageType = pageData.page_type;
  if (!pageType) {
    if (pageData.page_slug?.includes("services/") && pageData.page_slug?.split("/").length === 2) {
      pageType = "service";
    } else if (pageData.page_slug?.includes("/services/")) {
      pageType = "service-location";
    } else if (pageData.page_slug?.match(/^\/[a-z]+\/[a-z-]+\/$/)) {
      pageType = "state";
    } else if (pageData.page_slug?.match(/^\/[a-z]+\/[a-z-]+\/[a-z-]+\/$/)) {
      pageType = "city";
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
  if (pageData.body_content) {
    contentParts.push(pageData.body_content);
  }
  
  if (contentParts.length > 0) {
    saveData.content = contentParts.filter(Boolean).join("\n\n");
  }

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
  
  // Save to seo_pages
  const { error } = await supabase.from("seo_pages").upsert(saveData, { onConflict: "slug" });

  if (error) {
    console.error(`page-content-generator: Save error details:`, JSON.stringify(error));
    throw error;
  }

  // Also save to page_content for service pages (non-blocking)
  if (pageType === "service" && pageData.page_slug) {
    try {
      const pageContentData = {
        page_slug: pageData.page_slug,
        page_type: "service",
        meta_title: pageData.meta_title || null,
        meta_description: pageData.meta_description || null,
        h1: pageData.h1 || null,
        hero_intro: pageData.hero_intro || pageData.intro_text || null,
        body_content: pageData.body_content || null,
        faqs: pageData.faqs || [],
        is_published: true,
      };
      
      await supabase.from("page_content").upsert(pageContentData, { onConflict: "page_slug" });
      console.log(`page-content-generator: Saved to page_content ${pageData.page_slug}`);
    } catch (pcError) {
      console.warn(`page-content-generator: page_content save failed (non-blocking):`, pcError);
    }
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
        console.log(`page-content-generator: Generating ${page.slug}...`);

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
      console.log("page-content-generator: All service pages slugs:", servicePages.map(p => p.slug).join(", "));

      // Get existing pages
      console.log("page-content-generator: Fetching existing seo_pages...");
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
      console.log(`page-content-generator: Found ${existingPages.length} existing seo_pages`);
      const existingSlugs = new Set(existingPages.map(p => p.slug));

      let pagesToGenerate = servicePages;
      if (!force_regenerate) {
        pagesToGenerate = servicePages.filter(p => !existingSlugs.has(p.slug));
      }

      let startIndex = cursor ? pagesToGenerate.findIndex(p => p.slug === cursor) : 0;
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
            lastProcessedSlug = page.slug;
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
        if (existing.some(p => p.slug === pageData.slug)) {
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
            slug: `/${stateData.slug}/${city.slug}/${treatment.slug}`,
            type: "service-location",
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
      const existingSlugs = new Set(existingPages.map(p => p.slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.slug));
      }

      let startIndex = cursor ? pagesToGenerate.findIndex(p => p.slug === cursor) : 0;
      if (startIndex === -1) startIndex = 0;
      else startIndex += 1;

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating ${page.slug}...`);

        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);

          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.slug;
          } else if (result.skipped) {
            skipped++;
          } else {
            failed++;
            errors.push(`SL ${page.slug}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${page.slug}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
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
            slug: `/${emirateSlug}/${city.slug}/${treatment.slug}`,
            type: "service-location",
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
      const existingSlugs = new Set(existingPages.map(p => p.slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.slug));
      }

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.slug === cursor);
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
        console.log(`page-content-generator: Generating ${page.slug}...`);
        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);
          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.slug;
          } else {
            failed++;
            errors.push(`SL ${page.slug}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${page.slug}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
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
          slug: `/${emirateSlug}/${citySlug}/${treatment.slug}`,
          type: "service-location",
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
      const existingSlugs = new Set(existingPages.map(p => p.slug));

      let pagesToGenerate = slPages;
      if (!force_regenerate) {
        pagesToGenerate = slPages.filter(p => !existingSlugs.has(p.slug));
      }

      // Find start index based on cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = pagesToGenerate.findIndex(p => p.slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1; // Start after the cursor
      }

      const pagesToProcess = pagesToGenerate.slice(startIndex, startIndex + batchLimit);

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (const page of pagesToProcess) {
        console.log(`page-content-generator: Generating ${page.slug}...`);
        try {
          const result = await generateServiceLocationContent(page, aimlapiKey, force_regenerate);
          if (result.success) {
            await saveSeoPage(supabase, result.data);
            processed++;
            lastProcessedSlug = page.slug;
          } else {
            failed++;
            errors.push(`SL ${page.slug}: ${result.error}`);
          }
        } catch (pageErr) {
          failed++;
          errors.push(`Error for ${page.slug}: ${pageErr instanceof Error ? pageErr.message : String(pageErr)}`);
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
        if (existingPages.some(p => p.slug === pageData.slug)) {
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

    // NEW: Generate single service-location with optional competitor analysis
    if (action === "generate_competitor_content") {
      const emirateSlug = body.emirate_slug;
      const citySlug = body.city_slug;
      const serviceSlug = body.service_slug;
      const useCompetitorAnalysis = body.use_competitor_analysis ?? true;
      const forceRegenerate = body.force_regenerate ?? false;

      if (!emirateSlug || !citySlug || !serviceSlug) {
        return new Response(JSON.stringify({ success: false, error: "emirate_slug, city_slug, and service_slug are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`page-content-generator: Generating competitor-based content for ${emirateSlug}/${citySlug}/${serviceSlug}`);
      console.log(`page-content-generator: Use competitor analysis: ${useCompetitorAnalysis}`);

      // Get state, city, treatment data
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
      const treatment = treatments.find(t => t.slug === serviceSlug);
      
      if (!treatment) {
        return new Response(JSON.stringify({ success: false, error: `Treatment not found: ${serviceSlug}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const serpApiKey = Deno.env.get("SERPAPI_KEY");
      
      // Perform competitor analysis if flag is enabled
      let analysis: ConsolidatedAnalysis | null = null;
      
      if (useCompetitorAnalysis && serpApiKey) {
        console.log("page-content-generator: Starting competitor analysis...");
        
        // Generate search queries
        const queries = generateSearchQueries(treatment.name, city.name, state.name);
        console.log(`page-content-generator: Queries - Commercial: "${queries.commercial}", Informational: "${queries.informational}"`);
        
        // Search both queries (2s delay between)
        const commercialUrls = await searchGoogleWithSerpApi(queries.commercial, serpApiKey);
        await new Promise(resolve => setTimeout(resolve, SERPAPI_DELAY_MS));
        
        const informationalUrls = await searchGoogleWithSerpApi(queries.informational, serpApiKey);
        
        // Combine and deduplicate
        const allUrls = deduplicateUrls([...commercialUrls, ...informationalUrls]);
        console.log(`page-content-generator: Total unique URLs: ${allUrls.length}`);
        
        // Limit to crawl budget
        const urlsToCrawl = allUrls.slice(0, MAX_URLS_TO_CRAWL);
        
        // Crawl and analyze pages
        const insights: CompetitorInsight[] = [];
        
        for (const url of urlsToCrawl) {
          console.log(`page-content-generator: Crawling ${url}...`);
          const html = await fetchWithRetry(url);
          
          if (html) {
            const insight = analyzeCompetitorPage(html, url);
            insights.push(insight);
            console.log(`page-content-generator: Analyzed ${url} - ${insight.h2.length} sections, ${insight.faqQuestions.length} FAQs`);
          }
        }
        
        // Consolidate insights
        if (insights.length > 0) {
          analysis = consolidateCompetitorInsights(insights);
          analysis.queriesUsed = [queries.commercial, queries.informational];
          console.log(`page-content-generator: Consolidated analysis - ${analysis.urlsAnalyzed.length} URLs, ${analysis.faqQuestions.length} FAQs`);
        }
      } else if (!serpApiKey) {
        console.warn("page-content-generator: SERPAPI_KEY not configured, skipping competitor analysis");
      }

      // Build page data
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

      // Generate content with competitor-based prompt
      const result = await generateServiceLocationContentWithAnalysis(pageData, aimlapiKey, analysis, forceRegenerate);
      
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save with competitor analysis data
      await saveSeoPageWithCompetitorAnalysis(supabase, result.data, analysis);

      return new Response(JSON.stringify({ 
        success: true, 
        slug: pageData.slug,
        competitor_analysis: analysis ? {
          queries_used: analysis.queriesUsed,
          urls_analyzed: analysis.urlsAnalyzed.length,
          faq_count: analysis.faqQuestions.length,
          price_range: analysis.priceRangeFound,
        } : null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Bulk generate all service-locations with competitor analysis
    if (action === "generate_all_competitor_content") {
      const useCompetitorAnalysis = body.use_competitor_analysis ?? true;
      const emirateFilter = body.emirate_filter || null;
      const batchSize = body.batch_size || 1;
      const cursor = body.cursor || null;
      const forceRegenerate = body.force_regenerate ?? false;

      console.log(`page-content-generator: Bulk competitor content generation`);
      console.log(`page-content-generator: Use competitor analysis: ${useCompetitorAnalysis}, Emirate filter: ${emirateFilter}, Batch: ${batchSize}`);

      // Get all states
      const states = await fetchAllRows(supabase, "states", "id, slug, name", { is_active: true });
      
      // Filter states if needed
      let targetStates = states;
      if (emirateFilter) {
        targetStates = states.filter(s => s.slug === emirateFilter);
      }

      // Get all cities
      const allCities = await fetchAllRows(supabase, "cities", "id, slug, name, state_id", { is_active: true });
      
      // Get all treatments
      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });

      // Build all service-location combinations
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

      // Filter existing if not force regenerating
      if (!forceRegenerate) {
        const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
        const existingSlugs = new Set(existingPages.map(p => p.slug));
        slPages = slPages.filter(p => !existingSlugs.has(p.slug));
      }

      // Find start position for cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = slPages.findIndex(p => p.slug === cursor);
        if (startIndex === -1) startIndex = 0;
        else startIndex += 1;
      }

      const pagesToProcess = slPages.slice(startIndex, startIndex + batchSize);
      
      console.log(`page-content-generator: Processing ${pagesToProcess.length} of ${slPages.length} pages`);

      const serpApiKey = Deno.env.get("SERPAPI_KEY");
      let processed = 0;
      let failed = 0;
      const errors: string[] = [];
      let lastProcessedSlug = null;

      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i];
        console.log(`page-content-generator: [${i + 1}/${pagesToProcess.length}] Processing ${page.slug}...`);
        
        try {
          // Perform competitor analysis (with rate limiting)
          let analysis: ConsolidatedAnalysis | null = null;
          
          if (useCompetitorAnalysis && serpApiKey) {
            const queries = generateSearchQueries(page.service_name, page.city_name, page.state_name);
            
            const commercialUrls = await searchGoogleWithSerpApi(queries.commercial, serpApiKey);
            await new Promise(resolve => setTimeout(resolve, SERPAPI_DELAY_MS));
            
            const informationalUrls = await searchGoogleWithSerpApi(queries.informational, serpApiKey);
            
            const allUrls = deduplicateUrls([...commercialUrls, ...informationalUrls]);
            const urlsToCrawl = allUrls.slice(0, MAX_URLS_TO_CRAWL);
            
            const insights: CompetitorInsight[] = [];
            
            for (const url of urlsToCrawl) {
              const html = await fetchWithRetry(url);
              if (html) {
                insights.push(analyzeCompetitorPage(html, url));
              }
            }
            
            if (insights.length > 0) {
              analysis = consolidateCompetitorInsights(insights);
              analysis.queriesUsed = [queries.commercial, queries.informational];
            }
          } else if (!serpApiKey) {
            console.warn("page-content-generator: SERPAPI_KEY not configured");
          }

          // Generate content
          const result = await generateServiceLocationContentWithAnalysis(page, aimlapiKey, analysis, true);
          
          if (result.success) {
            await saveSeoPageWithCompetitorAnalysis(supabase, result.data, analysis);
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
        
        // Small delay between pages
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const remaining = slPages.length - (startIndex + pagesToProcess.length);
      const hasMore = remaining > 0;

      console.log(`page-content-generator: Batch complete - ${processed} processed, ${failed} failed, ${remaining} remaining`);

      return new Response(JSON.stringify({
        processed,
        failed,
        errors: errors.slice(0, 10), // Limit errors to 10
        cursor: lastProcessedSlug,
        has_more: hasMore,
        remaining,
        total_count: slPages.length,
        use_competitor_analysis: useCompetitorAnalysis,
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
