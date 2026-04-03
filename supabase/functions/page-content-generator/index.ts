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

MANDATORY RULES:

1. WRITE LIKE A DENTAL EXPERT ADVISING A PATIENT:
   - Don't sell - inform and educate
   - Include real costs ranges for UAE
   - Mention realistic timelines
   - Include what to ask during consultations

2. UAE-SPECIFIC CONTENT:
   - Include cost ranges in AED
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
  "is_published": true
}`;

  try {
    const response = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    if (!response?.choices?.[0]?.message?.content) {
      return { success: false, error: "No response from AI" };
    }

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { success: false, error: "Invalid JSON in response" };
    }

    const pageDataResult = JSON.parse(jsonMatch[0]);
    return { success: true, data: pageDataResult };
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
  "is_published": true
}`;

  try {
    const response = await callAIWithRetry([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], aimlapiKey);

    if (!response?.choices?.[0]?.message?.content) {
      return { success: false, error: "No response from AI" };
    }

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { success: false, error: "Invalid JSON in response" };
    }

    const pageDataResult = JSON.parse(jsonMatch[0]);
    return { success: true, data: pageDataResult };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

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

    // NEW: Generate service pages only
    if (action === "generate_services") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 3;

      const treatments = await fetchAllRows(supabase, "treatments", "id, slug, name", { is_active: true });
      
      // Build service pages
      const servicePages = treatments.map(t => ({
        slug: `services/${t.slug}`,
        type: "service",
        service_slug: t.slug,
        service_name: t.name,
      }));

      // Get existing pages
      const existingPages = await fetchAllRows(supabase, "seo_pages", "slug", {});
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

    // NEW: Generate service-location pages (e.g., /dubai/mirdif/invisalign)
    if (action === "generate_service_locations") {
      const cursor = body.cursor || null;
      const batchLimit = body.batch_limit || 3;

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
