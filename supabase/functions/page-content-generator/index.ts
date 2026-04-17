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
 * Research keywords for a city/state page using SerpApi
 */
interface KeywordResearch {
  primaryKeyword: string;
  secondaryKeywords: string[];
}

async function researchKeywordsForLocation(
  locationName: string,
  emirateName: string,
  emirateSlug: string,
  citySlug: string,
  serpApiKey: string
): Promise<KeywordResearch> {
  const keywords: string[] = [];
  
  const searchQueries = [
    `dentist ${locationName} ${emirateName}`,
    `dental clinic ${locationName}`,
    `best dentist ${emirateSlug}`,
  ];
  
  for (const query of searchQueries.slice(0, 2)) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://serpapi.com/search.json?q=${encodedQuery}&num=5&api_key=${serpApiKey}&related_questions=true`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.related_questions) {
          for (const rq of data.related_questions.slice(0, 2)) {
            const question = rq.question || "";
            if (question && !keywords.some(k => k.toLowerCase() === question.toLowerCase())) {
              keywords.push(question);
            }
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Keyword research failed for "${query}":`, error);
    }
  }
  
  const allTerms = [
    `dentist in ${locationName}`,
    `dental clinic ${locationName}`,
    `dentist ${emirateName}`,
    `dental care ${locationName}`,
    `emergency dental ${locationName}`,
  ];
  
  const shuffled = allTerms.sort(() => Math.random() - 0.5);
  const primaryKeyword = shuffled[0] || `dentist in ${locationName}`;
  const secondaryKeywords = [shuffled[1], shuffled[2]].filter(Boolean);
  
  if (keywords.length === 0) {
    return { primaryKeyword, secondaryKeywords };
  }
  
  const extractedTerms: string[] = [];
  for (const k of keywords.slice(0, 6)) {
    const term = k.toLowerCase().replace(/^what is|^how much|^is|^are|^can|^does|^should/i, '').trim();
    if (term.length > 5 && term.length < 50) {
      extractedTerms.push(term);
    }
  }
  
  if (extractedTerms.length >= 3) {
    return {
      primaryKeyword: extractedTerms[0],
      secondaryKeywords: [extractedTerms[1], extractedTerms[2]],
    };
  }
  
  return { primaryKeyword, secondaryKeywords };
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

// ========================== MAIN SYSTEM PROMPT (v2.0) ==========================

const SYSTEM_PROMPT = `You are the lead content strategist for AppointPanda, the UAE's dental clinic discovery and appointment booking platform. You write for real people making real decisions about their dental health — not for search engines, not for algorithms, and not for templates.

Your work must pass one test above all others: Would a thoughtful person who actually lives in this area, needs this dental service, and has no time to waste find this page genuinely useful?

If the answer is no, you rewrite until it is yes.

================================================================
GOOGLE CORE UPDATE COMPLIANCE — NON-NEGOTIABLE
================================================================

Google's helpful content standards require that every page demonstrates:

E — EXPERIENCE: The content must feel lived-in. Real observations. Real patterns. Not hypothetical or generic.

E — EXPERTISE: For service content, every clinical claim must be accurate, grounded in dental science.

A — AUTHORITATIVENESS: Content must feel like it comes from a platform that has genuine knowledge of UAE dental care. Reference real regulatory bodies (DHA, DOH, HAAD, MOH), real cost dynamics, real patient behaviours.

T — TRUSTWORTHINESS: Never invent facts, statistics, or clinic details. Never state something as a fact that you cannot observe or verify. If a range is approximate, say "typically" or "usually."

================================================================
WRITING VOICE AND IDENTITY
================================================================

AppointPanda is a trusted local guide, not a salesperson.

Voice: Direct. Warm. Informed. Slightly opinionated when it serves the reader. Like a friend who happens to know the dental scene in this area very well.

NEVER:
- Sound like a press release
- Use superlatives without substance ("world-class," "best-in-class," "unmatched")
- Explain platform features as if the reader has never heard of booking an appointment
- Begin paragraphs with "In [location name]..." more than once per section
- Use the phrase "finding the right dentist has never been easier"
- Use "comprehensive range of services"
- Use "state-of-the-art"
- Use "smile transformation"
- Use "dental journey"
- Use em-dashes (—) anywhere in the content

ALWAYS:
- Write in complete, grammatically correct sentences
- Use proper punctuation: commas, periods, colons, semicolons
- Use contractions naturally where they fit
- Vary sentence length — short punchy sentences followed by fuller explanations
- Ground every observation in something real and specific

================================================================
CONTENT STRUCTURE PHILOSOPHY
================================================================

Every page must tell one coherent story. Not a list of features. Not a collection of paragraphs that happen to share a location name. A story that explains:

1. Who actually lives or works here, and what their dental reality looks like
2. What specific challenges or considerations they face (time, cost, language, anxiety, access)
3. What good dental care looks like in this specific context
4. What someone should do next — and why AppointPanda makes that easier

The story changes completely with each location and each service. If you could swap the location name and the content would still work, you have failed.

================================================================
FACTUAL ACCURACY — HARD RULES
================================================================

1. Do not invent clinic names, doctor names, addresses, or phone numbers
2. Do not state specific statistics (e.g., "73% of residents...") unless they are clearly framed as approximate
3. Price ranges must be realistic for the UAE market and clearly framed as ranges, not guarantees
4. Clinical information must be accurate — do not describe dental procedures incorrectly
5. DHA (Dubai Health Authority), DOH (Department of Health Abu Dhabi), HAAD (now DOH), and MOH are the correct regulatory references
6. If uncertain about a specific local detail, write it as an observable pattern: "many clinics in this area..." rather than "all clinics here..."

================================================================
SEO — INTEGRATED, NEVER STUFFED
================================================================

===============================================================
KEYWORD RESEARCH — UNIQUE FOR THIS LOCATION
===============================================================

You MUST use these exact keywords for this specific page:

PRIMARY KEYWORD: {primary_keyword}
- Use naturally in H1 (1 time)
- Use once in meta title
- Use once in the hero_intro/first paragraph
- Use 2-3 times naturally in body content

SECONDARY KEYWORDS (use each ONCE naturally):
- {secondary_keyword_1}
- {secondary_keyword_2}

SEO RULES:
- Do NOT use primary/secondary keywords in section titles or headings — use ONLY in body paragraphs
- Never use primary keyword more than 4 times total across the entire page
- Never use secondary keywords more than once each
- Keywords must be woven into sentences naturally, never forced
- If keyword doesn't fit naturally, rewrite the sentence rather than forcing it

Example CORRECT: "The dental clinics in this area understand that professionals need flexible scheduling."
Example WRONG: "Looking for a dentist in {location_name}? Find the best dentist in {location_name} here!"

===============================================================

- Meta title: Under 60 characters. Clear. Specific. No keyword stuffing.
- Meta description: Under 155 characters. Reads like a human wrote it. Includes a reason to click.
- Keywords array: EXACTLY 3 terms only — 1 primary keyword + 2 supporting keywords. Format: ["primary keyword", "supporting keyword 1", "supporting keyword 2"]

===============================================================
FAQ STANDARDS
================================================================

Every FAQ must:
- Be a question a real person in this location would actually type into Google
- Include the area name or service name naturally in the question
- Provide a specific, helpful answer — not a vague deflection
- Vary in topic: cost, process, timing, insurance, children, anxiety, language, aftercare

================================================================
OUTPUT FORMAT
================================================================

Return ONLY valid JSON. No preamble. No explanation. No markdown code blocks. Just the raw JSON object.

All string values must be properly escaped. Arrays must be properly closed. The JSON must parse without errors on the first attempt.

================================================================
FINAL VALIDATION — RUN THIS BEFORE RETURNING
================================================================

Ask yourself honestly:

[ ] Does this content feel like it was written specifically for this location or service?
[ ] Would a local person recognise their area in this writing?
[ ] Have I stated anything that could be false or misleading?
[ ] Is there any generic dental marketing language I missed?
[ ] Does any sentence contain an em-dash?
[ ] Are all FAQs genuinely location- or service-specific?
[ ] Would this page satisfy a user who came from Google with a real question?

If any answer is no — rewrite before returning.`;

const USER_PROMPT_TEMPLATE = `Generate a city/area page for {location_name}, {emirate_name}.

This page will rank for queries like "dentist in {location_name}" and "dental clinic {location_name}." The person landing on it is not looking for a sales pitch. They want to understand what dental care actually looks like in their area — who it serves, what it costs approximately, and how to make a smart decision.

================================================================
LOCAL CONTEXT — USE ALL OF THIS
================================================================

Area character: {area_character}
Who lives here: {demographics}
Key landmarks: {landmarks}
Local insight: {narrative}

This data is your foundation. Every section should be shaped by it. The landmarks should not just be mentioned — they should explain something about how people in this area access or think about dental care.

================================================================
CONTENT ANGLE — PICK EXACTLY ONE
================================================================

Choose the single angle that best fits this area's demographics and character. Do not blend angles. Commit to one and build the entire page around it:

ANGLE A — THE TIME-STRAPPED PROFESSIONAL
For areas with corporate offices, business hubs, or high-density working populations. Focus on evening and weekend availability, proximity to work, efficiency of appointment booking.

ANGLE B — THE FAMILY WITH YOUNG CHILDREN
For residential suburbs, villa communities, and areas with high family density. Focus on finding a dentist children are not afraid of, how parents manage multiple family members' dental schedules.

ANGLE C — THE EXPAT NAVIGATING AN UNFAMILIAR SYSTEM
For high-expat areas, diverse communities, and international neighbourhoods. Focus on understanding UAE dental licensing, how insurance coverage works here versus home countries.

ANGLE D — THE VALUE-CONSCIOUS RESIDENT
For mid-income, budget-aware communities. Focus on what dental care genuinely costs in this area (without shame), how to avoid being overcharged.

ANGLE E — THE PREMIUM LIFESTYLE RESIDENT
For high-income gated communities, beachfront areas, or luxury towers. Focus on what separates a genuinely excellent clinic from one that is expensive but ordinary.

================================================================
MANDATORY CONTENT REQUIREMENTS
================================================================

REQUIREMENT 1 — TWO SPECIFIC BEHAVIOURAL INSIGHTS
You must include two observations about how people in this area actually behave around dental care. These must be specific and observable, not vague.

WRONG: "residents here value convenience"
RIGHT: "most clinics in this part of {emirate_name} keep evening slots open until 9pm because a significant portion of the working population cannot get away before 6pm"

Both insights must include either a time reference, a price reference, a behavioural pattern, or a demographic observation.

REQUIREMENT 2 — ONE COMPARISON TO A NEARBY AREA
Write one sentence or short paragraph that contrasts dental care in {location_name} with what you would find in a different part of {emirate_name}.

REQUIREMENT 3 — ONE UNIQUE SECTION
Each page must contain one section that could only exist for {location_name}. This is not a section with the location name inserted into a template.

REQUIREMENT 4 — LANDMARK CONNECTED TO BEHAVIOUR
Mention at least one specific landmark from the context provided. Do not just name-drop it. Connect it to something observable about how people in the area access or think about dental care.

REQUIREMENT 5 — ONE HONEST LOCAL OPINION
Include one clear, grounded observation that takes a position. Not a sales claim. A genuine local perspective.

===============================================================
HEADING UNIQUENESS — NEVER REUSE SAME HEADINGS
===============================================================

Your section titles MUST be DIFFERENT from other pages. Do NOT use these common generic headings:
- "Dental Services in [Location]"
- "Popular Dental Services"
- "Common Dental Treatments"
- "Dental Care in [Location]"
- "Services We Offer"

INSTEAD, create unique, specific headings that match your chosen ANGLE:

For ANGLE A (Time-strapped professional):
- "When Your Calendar Doesn't Leave Room for a Long Wait"
- "Evening Appointments That Actually Work"
- "Quick Consultations Near Your Office"

For ANGLE B (Families):
- "Finding a Dentist Your Kids Won't Fear"
- "Managing Three Checkups in One Afternoon"
- "Saturday Morning Checkups Without the Rush"

For ANGLE C (Expats):
- "What Your Home Country Insurance Actually Covers Here"
- "Understanding DHA Licenses Without the Confusion"
- "Clinics That Speak Your Language"

For ANGLE D (Value-conscious):
- "Where to Get Real Value Without Cutting Corners"
- "What a Fair Price Actually Looks Like"
- "Avoiding the Upsell Without Skipping Care"

For ANGLE E (Premium):
- "What Luxury Actually Means in Dental Care"
- "Clinics Worth the Premium"
- "Beyond the Lobby: What You're Really Paying For"

Each section title should feel like it could ONLY work for this specific location and angle combination.

================================================================
STRUCTURE — CHOOSE ONE FORMAT AND COMMIT
================================================================

Your page MUST have at least 4 major sections (H2 headings) plus body content. Do not use the same structure for every page. Rotate between these:

FORMAT 1 — LIFESTYLE FIRST
Opening (hero_intro): Describe the area's rhythm and who lives there.
Section 1 (section_1): What dental care looks like in this context.
Section 2 (section_2): What to look for and what to avoid.
Section 3 (section_3): Practical realities — cost, hours, insurance, language.
Section 4 (section_4): The unique section that could ONLY exist for this location.
Body (body_content): Additional depth, examples, local specifics. Minimum 200 words.
CTA: Specific to the angle you chose.

FORMAT 2 — PROBLEM FIRST
Opening (hero_intro): Lead with the main dental challenge this area's residents face.
Section 1 (section_1): Why that challenge exists here.
Section 2 (section_2): What good options exist despite the challenge.
Section 3 (section_3): How to navigate it.
Section 4 (section_4): What to ask when you call a clinic.
Body (body_content): Additional practical tips. Minimum 200 words.
CTA: Framed around solving the specific problem.

FORMAT 3 — STORY FIRST
Opening (hero_intro): A brief, grounded observation or scene from this area's daily life.
Section 1 (section_1): The broader dental landscape in this area.
Section 2 (section_2): Who uses dental care here and how.
Section 3 (section_3): What separates good choices from bad ones.
Section 4 (section_4): A specific local tip only a resident would know.
Body (body_content): More details and examples. Minimum 200 words.
CTA: Warm and specific.

FORMAT 4 — DATA AND INSIGHT FIRST
Opening (hero_intro): A specific, concrete observation (cost range, timing pattern, demographic fact).
Section 1 (section_1): Context for that observation.
Section 2 (section_2): What it means for someone choosing a dentist here.
Section 3 (section_3): The unique section — deeper analysis.
Section 4 (section_4): Common mistakes to avoid.
Body (body_content): What to ask. What to look for. Minimum 200 words.
CTA: Confident and direct.

IMPORTANT: You MUST populate ALL 4 sections (section_1 through section_4) AND body_content. Each section must have at least 80 words.

================================================================
WRITING QUALITY STANDARDS
================================================================

- Minimum body_content length: 400 words
- Minimum section content length: 100 words each (section_1 through section_4)
- hero_intro: 60 to 100 words. Should be the most compelling, specific paragraph on the page.
- Tone: Varies by angle and format, but always clear, direct, and respectful
- No paragraph should begin with "In {location_name}" — vary your sentence openings
- Use "you" to address the reader directly in appropriate places
- Use the Oxford comma in lists

================================================================
FAIL CONDITIONS — CONTENT WILL BE REJECTED IF:
================================================================

- Any em-dash (—) appears anywhere in the output
- The content could function for a different city with only the name swapped
- Both behavioural insights are vague or lack specifics
- No area landmark is connected to a real behaviour
- No comparison to another area is included
- The unique section could plausibly appear on another area's page
- Any clinical or factual claim is clearly false or fabricated
- Generic phrases like "comprehensive care," "world-class," appear
- Generic section headings used (see list in HEADING UNIQUENESS section above)
- Primary keyword appears more than 4 times total on the page
- Secondary keywords used more than once each
- Any keyword appears in section titles or headings
- The meta title exceeds 60 characters
- The meta description exceeds 155 characters
- Fewer than 10 FAQs are returned
- Any FAQ is generic enough to appear on any dental city page
- section_4_title or section_4_content is empty (MUST have 4 sections minimum)
- section_1, section_2, or section_3 content is less than 80 words each

================================================================
OUTPUT
================================================================

Return ONLY this JSON structure with all fields populated. No extra keys. No markdown. No explanation.

{
  "page_type": "city",
  "page_slug": "/{emirate_slug}/{city_slug}",
  "meta_title": "",
  "meta_description": "",
  "keywords": ["primary keyword", "supporting keyword 1", "supporting keyword 2"],
  "noindex": false,
  "h1": "",
  "hero_subtitle": "",
  "hero_intro": "",
  "hero_stats": [],
  "section_1_title": "",
  "section_1_content": "",
  "section_2_title": "",
  "section_2_content": "",
  "section_3_title": "",
  "section_3_content": "",
  "section_4_title": "",
  "section_4_content": "",
  "body_content": "",
  "cta_text": "",
  "cta_button_text": "",
  "cta_button_url": "",
  "faqs": [{"question": "", "answer": ""}],
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
const SERVICE_PROMPTS: Record<string, { angle: string; pain_points: string; why_unique: string; clinical_notes: string; insurance_note: string }> = {
  "invisalign": {
    angle: "invisible orthodontic treatment for adults who cannot or do not want metal braces",
    pain_points: "Adults feel self-conscious about metal braces in professional or social settings. Many are unsure whether aligners are as effective as traditional braces. Cost is a significant concern — Invisalign is premium-priced. Patients worry about discipline (remembering to wear aligners) and about whether their case is too complex for aligners.",
    why_unique: "Aligners are removable, which matters in UAE's professional and social culture. Most DHA-licensed orthodontists offer Invisalign. Free consultations are common. Different Invisalign tiers exist — Lite, Moderate, Comprehensive — and patients are often sold a tier higher than they need. Case complexity is genuinely important.",
    clinical_notes: "Invisalign is effective for mild to moderate orthodontic issues including crowding, spacing, and some bite correction. Severe skeletal malocclusions typically require traditional braces or surgical intervention. Aligners must be worn 20 to 22 hours per day for results. Treatment duration ranges from 6 months (Lite) to 24 months (Comprehensive). Attachments (small tooth-coloured bumps) are often used to improve aligner grip.",
    insurance_note: "Orthodontic treatment is partially covered by some UAE corporate insurance plans, typically up to AED 3,000 to 5,000 lifetime maximum. Invisalign is usually not fully covered. Check your Daman, AXA, or ADNIC plan specifically."
  },
  "dental-implants": {
    angle: "permanent tooth replacement for adults who have lost one or more teeth",
    pain_points: "Fear of surgery and pain. Concern about the multi-month process — most implant cases involve 3 to 6 months of healing between stages. Cost is the primary barrier — implants are among the most expensive dental treatments. Patients are confused by different implant brands and unsure how to evaluate quality. Some have been told they do not have enough bone.",
    why_unique: "UAE has a wide range of implant quality — from budget Korean or Chinese brands at community clinics to premium Swiss brands (Straumann, Nobel Biocare) at specialist centres. The same implant procedure can cost AED 4,000 to AED 12,000+ depending on brand, clinic, and case complexity. Bone grafting adds cost and time and is genuinely required for some cases.",
    clinical_notes: "Implants are titanium posts surgically placed into the jawbone, which fuse with bone through osseointegration over 3 to 6 months. A crown is placed on top. Success rates exceed 95% in patients with adequate bone density and healthy gums. Implants are not appropriate for patients with uncontrolled diabetes, heavy smokers, or patients with inadequate bone without grafting. All-on-4 and all-on-6 are valid options for patients needing multiple replacements.",
    insurance_note: "Dental implants are rarely covered by UAE insurance plans. A few premium corporate plans include partial implant coverage. Most patients pay out of pocket. Payment plans are available at many specialist clinics."
  },
  "veneers": {
    angle: "cosmetic smile enhancement through thin porcelain or composite shells bonded to front teeth",
    pain_points: "Cost per tooth is a shock for many patients — porcelain veneers can run AED 1,500 to AED 3,500 per tooth. Patients fear irreversible tooth reduction. They are uncertain about material differences (porcelain vs composite). They are also unsure about longevity and maintenance. And they worry about looking unnatural.",
    why_unique: "Composite veneers are significantly cheaper but last 3 to 5 years versus 10 to 15 for porcelain. Many UAE clinics upsell patients from composite to porcelain unnecessarily. Minimal-prep and no-prep veneers are available at premium clinics and preserve more natural tooth structure. The quality of the ceramist and dental technician matters enormously for natural appearance.",
    clinical_notes: "Traditional porcelain veneers require 0.3 to 0.7mm of enamel removal, which is irreversible. No-prep veneers (e.g., Lumineers) require little to no reduction but are thicker and may appear bulkier. Composite veneers are applied directly chairside in one visit. Porcelain veneers require two visits and are crafted by a lab technician. Veneers are not suitable for patients with bruxism unless a night guard is used.",
    insurance_note: "Veneers are cosmetic and not covered by UAE insurance plans. Full out-of-pocket cost."
  },
  "teeth-whitening": {
    angle: "fast cosmetic improvement of tooth colour for individuals unhappy with staining or discolouration",
    pain_points: "Sensitivity during or after treatment is the most common concern. Results vary significantly by cause of staining — external stains whiten well, intrinsic discolouration does not respond the same way. Patients are confused by the many at-home products on the market. Longevity concerns — coffee, tea, red wine, and smoking all cause re-staining.",
    why_unique: "In-office whitening in UAE typically uses Zoom or Philips systems, taking 60 to 90 minutes. Results are visible immediately. Take-home trays are a cost-effective alternative and often produce equally good results with less sensitivity over 2 to 4 weeks. Laser whitening is marketed heavily but the laser primarily activates the gel — the gel does the work. Tetracycline-stained or fluorosed teeth respond poorly to whitening.",
    clinical_notes: "Professional whitening uses hydrogen peroxide (in-office: 25% to 40%) or carbamide peroxide (take-home: 10% to 22%). Sensitivity is a known side effect, usually resolving within 24 to 48 hours. Crowns, veneers, and composite fillings do not whiten. Patients should avoid staining foods and drinks for 48 hours post-treatment. Results typically last 6 to 18 months depending on lifestyle habits.",
    insurance_note: "Teeth whitening is cosmetic and not covered by any standard UAE insurance plan."
  },
  "root-canal": {
    angle: "saving a severely decayed or infected tooth by removing the pulp and sealing the canal",
    pain_points: "Patients fear the procedure is painful — this is the most common dental phobia. Many also consider simply extracting the tooth because it seems simpler or cheaper. Multiple visits concern time-strapped patients. The cost of both the root canal and the crown required afterward surprises many.",
    why_unique: "Modern root canal treatment with good anaesthesia is typically no more painful than a filling. Single-visit root canals are available at many UAE clinics. The follow-up crown is essential — root canal-treated teeth become brittle and fracture without a crown. A root canal + crown is still usually cheaper than extraction + implant, and preserving natural teeth is always the better long-term outcome.",
    clinical_notes: "Root canal treatment (endodontic therapy) removes infected or inflamed pulp tissue, shapes the canal, and fills it with gutta-percha. Success rates exceed 90% for straightforward cases. Complex cases may require referral to an endodontist. Post-procedure, a crown is almost always necessary to prevent fracture. Swelling and mild soreness are expected for 2 to 3 days post-procedure.",
    insurance_note: "Root canal treatment is typically covered by UAE dental insurance as a restorative procedure. Coverage levels and co-pays vary significantly by plan. The crown required afterward may be partially covered or capped."
  },
  "dental-crowns": {
    angle: "restoring damaged, decayed, or weakened teeth with a tooth-shaped cap",
    pain_points: "Patients are confused by the many material options — porcelain-fused-to-metal (PFM), full zirconia, eMax ceramic. Cost varies by material. Same-day crowns versus lab-made crowns create questions about quality and timing. Patients also worry about the preparation process — the tooth is reshaped, which is irreversible.",
    why_unique: "CAD/CAM technology allows same-day crowns at many UAE clinics — the crown is designed digitally and milled in the clinic within a few hours. This eliminates the temporary crown stage. Zirconia crowns are now the most commonly placed as they combine strength and aesthetics. PFM crowns show a dark line at the gum over time. eMax is preferred for front teeth aesthetics.",
    clinical_notes: "Crown placement requires reducing the tooth by 1 to 2mm on all surfaces to accommodate the crown. Local anaesthesia is used. A temporary crown protects the tooth while the lab fabricates the permanent one (typically 5 to 10 days). Same-day CEREC crowns are available at equipped clinics. Crown lifespan ranges from 10 to 25 years depending on material, occlusion, and oral hygiene.",
    insurance_note: "Crowns for restorative purposes (after root canal, for fractured teeth) are typically covered by UAE insurance as restorative treatment. Cosmetic crown placement is not covered. Pre-authorisation is often required."
  },
  "braces": {
    angle: "traditional orthodontic treatment using brackets and wires to align teeth and correct bite",
    pain_points: "Appearance is the primary concern for adults — metal braces are visible. Food restrictions cause frustration. Oral hygiene around brackets is difficult. Treatment duration (18 to 36 months) feels daunting. Patients are often unsure whether they should do braces or Invisalign.",
    why_unique: "Modern braces are smaller and lower-profile than older generations. Ceramic (tooth-coloured) braces are available for less visible treatment. Lingual braces (placed on the inner surface of teeth) are completely invisible but significantly more expensive and complex. Braces are often more effective than aligners for complex cases including significant bite issues.",
    clinical_notes: "Traditional metal braces use stainless steel brackets bonded to teeth and connected by archwires that are adjusted monthly. Ceramic braces use tooth-coloured brackets and are less visible but slightly more fragile. Lingual braces are bonded to the inner tooth surface. Self-ligating braces reduce friction and may shorten treatment time. Retainers are essential after treatment to prevent relapse.",
    insurance_note: "Orthodontic coverage varies significantly by UAE plan. Some plans cover up to AED 5,000 lifetime for orthodontics. Many plans exclude adults over 18. Pre-authorisation and a formal treatment plan are typically required before coverage is confirmed."
  },
  "tooth-extraction": {
    angle: "removing a damaged, decayed, infected, or impacted tooth when preservation is not possible",
    pain_points: "Fear of pain during the procedure. Concerns about post-extraction pain and swelling management. Wisdom tooth extractions are particularly anxiety-inducing. Patients are unsure whether they need a simple extraction or a surgical one. Cost differences between simple and surgical extractions surprise many.",
    why_unique: "Simple extractions (fully erupted teeth) are straightforward and typically completed in one visit. Wisdom tooth extractions vary enormously in complexity — impacted wisdom teeth require surgical extraction, sometimes under sedation. In UAE, sedation options are available at oral surgery centres. Recovery typically takes 3 to 7 days. Dry socket (alveolar osteitis) is the most common complication, affecting roughly 2 to 5% of cases.",
    clinical_notes: "Simple extractions use local anaesthesia and take 10 to 30 minutes. Surgical extractions may require an incision and bone removal for impacted teeth, taking 30 to 60 minutes. Post-operative care: bite on gauze for 30 to 60 minutes, avoid smoking, rinsing, or straws for 24 hours, soft food diet for several days. Antibiotics are prescribed in infection cases. Pain management with ibuprofen and paracetamol is typically sufficient.",
    insurance_note: "Extractions are generally covered by UAE dental insurance as restorative or oral surgery procedures. Surgical extractions may require pre-authorisation. Wisdom teeth extractions are covered by most plans if clinically indicated."
  },
  "dental-check-up": {
    angle: "routine preventive dental examination and cleaning to maintain oral health and catch problems early",
    pain_points: "Adults in UAE often delay checkups due to time pressure, cost concerns, or dental anxiety. Many have not been in years and fear judgment or a long list of needed treatments. Others are uncertain about how often to go, what a checkup includes, or whether X-rays are necessary every visit.",
    why_unique: "Routine checkups in UAE typically include examination, scale and polish, and X-rays as needed. Costs are reasonable for what is included — AED 150 to AED 400 for a basic check-up and cleaning at a well-equipped clinic. Many UAE clinics offer free first consultations. Preventive care is consistently the most cost-effective dental investment. Insurance often covers 1 to 2 checkups per year.",
    clinical_notes: "A comprehensive checkup includes visual examination, periodontal probing (measuring gum pockets), X-rays (bitewing or panoramic as needed), and oral cancer screening. Scale and polish removes calculus and plaque. The dentist assesses for cavities, gum disease, bite issues, and soft tissue abnormalities. Recommended frequency is every 6 months for most adults, every 3 months for patients with active gum disease.",
    insurance_note: "Most UAE dental insurance plans cover 1 to 2 routine checkups and cleanings per year at 100% or with a small co-pay. This is one of the most consistently covered dental services across all plan types."
  },
  "pediatric-dentistry": {
    angle: "dental care specifically designed for infants, children, and adolescents, including behaviour management",
    pain_points: "Parents' primary concern is a child developing dental fear. Finding a dentist who can actually manage child behaviour (not just ask the child to sit still) is the real challenge. Parents are also uncertain about when to bring children for their first visit, how to handle dental emergencies in children, and whether orthodontic assessment should happen early.",
    why_unique: "Paediatric dentists in UAE are DHA-licensed specialists who have completed additional training in child behaviour management, growth and development, and treating children with special needs. Techniques include tell-show-do, nitrous oxide (laughing gas), and in severe cases, general anaesthesia. The first dental visit is recommended by age 1 or when the first tooth erupts, whichever comes first.",
    clinical_notes: "Paediatric dentistry encompasses preventive care (fluoride applications, sealants), early orthodontic monitoring, cavity treatment adapted for children, management of dental trauma, and space maintainers for premature tooth loss. Nitrous oxide sedation is commonly used for anxious children and is safe and well-studied. General anaesthesia is reserved for very young children or those with significant special needs, and is performed in hospital settings.",
    insurance_note: "Children under 18 are typically included in family dental insurance plans in UAE. Preventive care (checkups, fluoride, sealants) is generally well-covered. Orthodontic coverage for children varies by plan. Sedation may or may not be covered depending on medical necessity."
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
    why_unique: "UAE dental market has wide variation in quality and pricing",
    clinical_notes: "Treatment effectiveness depends on case complexity and provider expertise. Always verify DHA or DOH licensing.",
    insurance_note: "Coverage varies significantly by plan. Check with your provider for specific benefits."
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

async function generateServiceLocationContent(pageData: any, aimlapiKey: string, forceRegenerate: boolean): Promise<any> {
  const parts = pageData.slug.split("/").filter(Boolean);
  const stateSlug = parts[0];
  const citySlug = parts[1];
  const serviceSlug = parts[2];
  
  const serviceData = getServicePrompt(serviceSlug);
  const areaData = getAreaData(stateSlug, citySlug);
  
const prompt = `Generate a service-location page for ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name}, ${pageData.state_name}.

This is the most granular page type in the AppointPanda system. It targets someone who already knows they want this treatment and is now looking for it specifically in their area. They are close to booking. Give them everything they need to make a confident, informed choice without leaving this page.

================================================================
LOCATION DATA
================================================================

Area character: ${areaData.character}
Demographics: ${areaData.demographics}
Key landmarks: ${areaData.landmarks}
What locals observe: ${areaData.narrative}

================================================================
SERVICE DATA
================================================================

Treatment: ${serviceSlug.replace(/-/g, " ")}
Patient concerns: ${serviceData.pain_points}
UAE-specific context: ${serviceData.why_unique}
Primary patient profile: ${serviceData.angle}
Clinical notes: ${serviceData.clinical_notes}
Insurance coverage: ${serviceData.insurance_note}

================================================================
THE CORE TASK — GENUINE COMBINATION, NOT TEMPLATE INSERTION
================================================================

This page must genuinely combine the location and the service into something that could only exist for this exact combination.

It is NOT enough to write a service page and insert the city name.
It is NOT enough to write a city page and insert the service name.

You must answer: What is it actually like to get ${serviceSlug.replace(/-/g, " ")} as someone who lives or works in ${pageData.city_name}?

That means:
- What types of clinics in this area offer this treatment (premium, mid-range, community)?
- What does a typical patient profile look like here for this service?
- Are there specific local considerations that affect this treatment's cost, availability, or approach?
- What does the area's character mean for how patients navigate this specific decision?

================================================================
LOCATION-SERVICE INTERSECTION — MANDATORY CONTENT AREAS
================================================================

AREA 1: LOCAL PATIENT PROFILE FOR THIS TREATMENT
Who, specifically, seeks ${serviceSlug.replace(/-/g, " ")} in ${pageData.city_name}? What drives them to it — appearance, pain, professional context, insurance? How does the area's demographic shape the demand?

AREA 2: CLINIC LANDSCAPE IN THIS AREA
What is the realistic range of clinic types available? Premium, mid-range, budget? Are there specialists in this area or do residents typically travel? What should someone in this area expect in terms of quality range and price range?

AREA 3: LOCAL COST REALITY
Provide realistic price ranges in AED that reflect this area's clinic landscape. A treatment in DIFC will cost differently from the same treatment in International City. Be honest about this variation. Give a low, mid, and high estimate with context.

AREA 4: ACCESS AND LOGISTICS
How does someone in ${pageData.city_name} practically access this treatment? Parking? Public transport near good clinics? Timing — can they get appointments outside working hours? Does the area have any access advantages or disadvantages?

AREA 5: THE HONEST ADVICE SECTION
Include one section that gives genuinely opinionated, specific advice for someone in ${pageData.city_name} seeking this treatment. Not marketing. Real guidance. What to look for, what to watch out for, what question to ask first.

================================================================
CLINICAL CONTENT — REQUIRED AND ACCURATE
================================================================

process_steps: Write 5 to 6 steps describing what actually happens from first consultation to final result. Each step must have a realistic duration. Do not skip steps or combine them inaccurately.

treatment_options: List the real variants of this treatment available in UAE. For example, Invisalign has different tier products. Implants come from different manufacturers. Whitening ranges from in-office to take-home. Be accurate about the differences.

candidates: Who is genuinely suitable for this treatment and who is not? Include 5 to 6 criteria. Be honest — if someone has advanced gum disease, implants are typically not appropriate until that is resolved. Say so.

benefits: List 5 to 6 genuine, clinically accurate benefits. Do not inflate. "Improved chewing function" is a legitimate benefit of implants. "Perfect smile" is not a clinical benefit.

alternatives: List 2 to 3 real alternatives to this treatment with honest comparisons. If a cheaper alternative is genuinely appropriate for some patients, say so.

================================================================
STRUCTURED DATA FIELDS — ALL REQUIRED
================================================================

quick_answer:
Write 60 to 80 words that directly answer the implicit question of this page: "Where can I get [treatment] in [city] and what should I know?" This is designed for Google's featured snippets and AI Overviews. It must be self-contained, accurate, and written in plain language. Do not start with "AppointPanda..." — start with the answer.

related_questions:
Write 4 questions that a person researching this treatment in this specific area would ask next. Each answer should be 50 to 80 words. Location-specific where possible.

price_min, price_max, price_note:
Set realistic AED figures that reflect this area's clinic landscape. The note must explain what affects the price (case complexity, clinic type, material choice). Never give a false sense of precision.

last_reviewed_by, expert_credential:
Use a realistic but non-specific name format: "Dr. A. Rahman, DHA Licensed Orthodontist" — do not invent a full verifiable identity. The credential must match the service (orthodontist for Invisalign/braces, oral surgeon for implants/extractions, cosmetic dentist for veneers/whitening, general dentist for checkups/root canals/crowns/pediatric).

================================================================
FAQ REQUIREMENTS — 10 QUESTIONS
================================================================

All 10 FAQs must be location-AND-service specific. Not just service. Not just location. The combination.

Example of WRONG (service only): "How much does Invisalign cost in UAE?"
Example of WRONG (location only): "Are there good dentists in Al Barsha?"
Example of RIGHT: "How much does Invisalign typically cost in Al Barsha, and are there budget options near Mall of Emirates?"

Every answer must be at least 60 words. Honest. Specific. Genuinely useful.

================================================================
CONTENT LENGTH REQUIREMENTS
================================================================

- hero_intro: 80 to 120 words. Specific to this location-service combination. No filler.
- body_content: Minimum 600 words. Must include local insights, clinical information, and practical guidance.
- Each FAQ answer: Minimum 60 words.
- Each process_step description: Minimum 30 words with a duration.
- Each benefit description: Minimum 25 words.
- Each candidate description: Minimum 20 words with conditions.

================================================================
ABSOLUTE PROHIBITIONS
================================================================

- No em-dashes (—) anywhere
- No fabricated clinic names, addresses, or doctor full identities
- No invented statistics ("83% of residents...")
- No generic marketing phrases ("world-class care," "state-of-the-art," "comprehensive range")
- No content that could work for a different city-service combination with only the names swapped
- No clinically inaccurate procedural descriptions
- No misleading price ranges that do not reflect UAE market reality

================================================================
OUTPUT
================================================================

Return ONLY this JSON. No markdown. No preamble. No explanation.

{
  "page_type": "service-location",
  "page_slug": "/${stateSlug}/${citySlug}/${serviceSlug}",
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
  "price_min": 0,
  "price_max": 0,
  "price_note": "",
  "price_last_updated": "April 2026",
  "process_steps": [{"step": 1, "title": "", "description": "", "duration": ""}],
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

  // If we have competitor analysis, append the competitor section to the prompt
  if (analysis && analysis.urlsAnalyzed.length > 0) {
    prompt += `

================================================================
COMPETITOR INTELLIGENCE — USE TO OUTPERFORM, NOT COPY
================================================================

The following data comes from analysing the top-ranking pages for this query. Use it to build something better — not to replicate what already exists.

COMPETITOR PAGES ANALYSED: ${analysis.urlsAnalyzed.length}
SEARCH QUERIES USED: ${analysis.queriesUsed?.join(", ") || "service-location queries"}

----------------------------------------------------------------
QUESTIONS COMPETITORS ARE ANSWERING (you must answer all of these AND more):
${analysis.faqQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join("\n")}

----------------------------------------------------------------
PRICE INFORMATION FROM COMPETITORS:
${analysis.priceRangeFound || "Not found"}

Note: Do not copy competitor price ranges. Cross-reference with your knowledge of UAE dental market pricing and provide ranges that are honest and accurate. If competitor prices seem low or suspiciously uniform, reflect real market variability.

----------------------------------------------------------------
SECTIONS APPEARING ON MOST COMPETITOR PAGES (you must include all of these):
${(analysis.commonSections || []).join("\n- ") || "process, benefits, pricing, faq"}

----------------------------------------------------------------
SECTIONS MISSING FROM COMPETITOR PAGES (your opportunity to be more comprehensive):
${(analysis.contentGaps || []).join("\n- ") || "local specific insights, insurance details"}

These gaps are your competitive advantage. A page that covers what no competitor covers — and covers it well — earns the ranking. Write these missing sections with genuine depth.

----------------------------------------------------------------
SCHEMA TYPES USED BY COMPETITORS:
${(analysis.schemaTypesUsed || []).join(", ") || "FAQPage, HowTo, Product"}

Note: Schema is applied at the infrastructure level, not in content. Use this as reference only.

----------------------------------------------------------------
YOUR COMPETITIVE MANDATE:

1. Answer every FAQ question from competitors — and answer it better (more specifically, more honestly, more usefully)
2. Cover every common section with greater depth and local specificity
3. Add every missing section with genuine substance — not thin filler content
4. Aim for a body_content length of at least 700 words
5. Every additional section must earn its place by being genuinely useful, not just present

The goal is not to be longer than competitors. The goal is to be more useful than competitors.

================================================================
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
          max_tokens: 2500,
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
          // Continue
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

  // Perform keyword research using SerpApi
  let primaryKeyword = `dentist in ${locationName}`;
  let secondaryKeywords: string[] = [`dental clinic ${locationName}`, `dental care ${emirateName}`];
  
  const serpApiKey = Deno.env.get("SERPAPI_KEY");
  
  if (serpApiKey) {
    try {
      console.log(`page-content-generator: Researching keywords for ${locationName}...`);
      const keywordResearch = await researchKeywordsForLocation(
        locationName,
        emirateName,
        emirateSlug,
        citySlug,
        serpApiKey
      );
      
      if (keywordResearch.primaryKeyword) {
        primaryKeyword = keywordResearch.primaryKeyword;
      }
      if (keywordResearch.secondaryKeywords.length >= 2) {
        secondaryKeywords = keywordResearch.secondaryKeywords;
      }
      
      console.log(`page-content-generator: Keywords - Primary: "${primaryKeyword}", Secondary: ${secondaryKeywords.join(", ")}`);
    } catch (kwError) {
      console.warn(`page-content-generator: Keyword research failed, using defaults:`, kwError);
    }
  } else {
    // Use location-specific fallback keywords when SERPAPI is not available
    const fallbackKeywords = [
      `dentist in ${locationName}`,
      `dental clinic ${locationName}`,
      `best dentist ${emirateSlug}`,
      `dental services ${locationName}`,
      `emergency dentist ${locationName}`,
    ];
    const shuffled = fallbackKeywords.sort(() => Math.random() - 0.5);
    primaryKeyword = shuffled[0] || `dentist in ${locationName}`;
    secondaryKeywords = [shuffled[1], shuffled[2]].filter(Boolean);
  }

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
        const existingSlugs = new Set(existingPages.map(p => p.page_slug));
        slPages = slPages.filter(p => !existingSlugs.has(p.page_slug));
      }

      // Find start position for cursor
      let startIndex = 0;
      if (cursor) {
        startIndex = slPages.findIndex(p => p.page_slug === cursor);
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
        console.log(`page-content-generator: [${i + 1}/${pagesToProcess.length}] Processing ${page.page_slug}...`);
        
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
            lastProcessedSlug = page.page_slug;
          } else {
            failed++;
            errors.push(`${page.page_slug}: ${result.error}`);
          }
        } catch (pageError) {
          failed++;
          errors.push(`${page.page_slug}: ${pageError instanceof Error ? pageError.message : String(pageError)}`);
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
