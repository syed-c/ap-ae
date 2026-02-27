import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==========================================
// CONTENT STUDIO - STRICT FIELD SEPARATION
// ==========================================
// This tool is ONLY allowed to write to body content fields.
// It must NEVER write to: meta_title, meta_description, og_title, og_description, faqs
// Those are managed by Meta Optimizer and FAQ Studio respectively.

const CONTENT_STUDIO_ALLOWED_FIELDS = [
  'h1', 'page_intro', 'h2_sections', 'content', 
  'internal_links_intro', 'word_count', 'is_thin_content',
  'last_content_edit_source', 'updated_at', 'is_optimized',
  'optimized_at', 'metadata_hash', 'is_duplicate', 
  'similarity_score', 'similar_to_slug', 'last_generated_at'
];

const CONTENT_STUDIO_BLOCKED_FIELDS = [
  'meta_title', 'meta_description', 'og_title', 'og_description', 'faqs'
];

function validateContentStudioWrite(fields: string[]): { valid: boolean; blockedFields: string[] } {
  const blockedFields = fields.filter(f => CONTENT_STUDIO_BLOCKED_FIELDS.includes(f));
  return { valid: blockedFields.length === 0, blockedFields };
}

interface ContentRequest {
  action: "generate_content" | "preview_content" | "apply_content" | "manual_edit" | "rollback_version";
  page_id?: string;
  version_id?: string;
  config?: {
    word_count?: number;
    rewrite_entire?: boolean;
    generate_intro?: boolean;
    generate_sections?: boolean;
    // generate_faqs REMOVED - FAQ Studio responsibility
    generate_internal_links?: boolean;
    expand_existing?: boolean;
    save_as_draft?: boolean;
    do_not_overwrite_existing?: boolean;
    rewrite_only_thin_sections?: boolean;
  };
  content?: {
    // meta_title REMOVED - Meta Optimizer responsibility
    // meta_description REMOVED - Meta Optimizer responsibility
    h1?: string;
    content?: string;
    intro_paragraph?: string;
    h2_sections?: any[];
    // faq REMOVED - FAQ Studio responsibility
    closing_paragraph?: string;
    internal_links_intro?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const AIMLAPI_KEY = Deno.env.get("AIMLAPI_KEY");

    if (!AIMLAPI_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AIMLAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
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

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (roles ?? []).some((r) => 
      ["super_admin", "district_manager", "content_team", "seo_team"].includes(r.role)
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ContentRequest = await req.json();
    const { action, page_id, version_id, config, content } = body;
    const now = new Date().toISOString();

    // AI call helper with retries
    async function callAIWithRetry(requestBody: object, maxRetries = 4): Promise<Response> {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          console.log(`content-generation-studio: Retry attempt ${attempt + 1}/${maxRetries}`);
        }
        
        try {
          const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AIMLAPI_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) return response;
          
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(`AI gateway returned ${response.status}`);
            continue;
          }
          
          return response;
        } catch (networkError) {
          lastError = networkError instanceof Error ? networkError : new Error(String(networkError));
        }
      }
      throw lastError || new Error("AI gateway failed after retries");
    }

    // Master system prompt for AppointPanda content (non-clinic pages)
    const PLATFORM_SYSTEM_PROMPT = `You are generating SEO content ONLY for AppointPanda, a dental listing and appointment platform.

=== CRITICAL BUSINESS CONTEXT ===
- AppointPanda helps users find, compare, and book dentists and dental clinics
- We are NOT a dental clinic - we are a directory/booking platform
- ALL content must be written in AppointPanda's first-party voice: "we", "our platform", "AppointPanda helps patients..."

You must NEVER write as:
- a dentist or dental clinic
- a guest author or third-party blog
- Never claim medical diagnosis

=== CONTENT QUALITY STANDARDS ===
- Simple, human, friendly language
- Non-academic, conversational tone
- No keyword stuffing - natural usage only
- Written for patients first
- Clear, helpful, trustworthy
- No exaggerated claims ("best dentist", fake statistics)

=== STRUCTURE RULES ===
- Exactly ONE H1 per page
- 4-6 H2 sections with meaningful headings
- H3 only when logically belonging under an H2
- No bullet spam, no filler text
- 3-5 contextual FAQs at bottom

=== UNIQUENESS REQUIREMENT (CRITICAL) ===
- Each page MUST be completely unique - this is non-negotiable
- NEVER reuse paragraphs, sentence structures, or phrasing patterns
- Start each section with a different approach (question, statement, scenario, statistic)
- Vary sentence lengths dramatically (some short, some complex)
- Use location-specific or context-specific details unique to this page
- Even similar pages (e.g., two city pages) must read completely differently
- Rotate opening styles: "When you need...", "Finding...", "Located in...", "Patients seeking...", etc.
- Add unique local context: neighborhoods, landmarks, demographics
- Include varied examples and scenarios specific to the location/service

=== SEO COMPLIANCE ===
- Meta title under 60 characters, keyword near beginning
- Meta description under 155 characters with clear CTA
- Google E-E-A-T compliance
- No AI footprints or repetitive patterns

=== CALL TO ACTION ===
End with calm, helpful CTA encouraging users to:
- Explore dentists on AppointPanda
- Book appointments through our platform`;

    // CLINIC-SPECIFIC system prompt - focuses on the clinic itself for branded SEO
    const CLINIC_SYSTEM_PROMPT = `You are generating SEO content for a DENTAL CLINIC/PRACTICE profile page.

=== CRITICAL BUSINESS CONTEXT ===
- This content is for the clinic's profile page to help it RANK for the clinic name
- Write as a neutral, informative third-party describing THIS clinic
- DO NOT mention "AppointPanda", "our platform", or any directory references
- Focus 100% on the CLINIC: its services, location, team, patient experience
- Goal: When someone searches the clinic name on Google, this page should rank

=== VOICE & TONE ===
- Write ABOUT the clinic, not FOR the clinic (neutral third-party perspective)
- Use the clinic name naturally throughout the content
- "This practice offers...", "[Clinic Name] provides...", "Patients visiting [Clinic Name] can expect..."
- DO NOT use "we", "our" (that would imply you ARE the clinic)
- DO NOT use "they" excessively - use the clinic name for SEO

=== CONTENT QUALITY STANDARDS ===
- Simple, human, friendly language
- Professional but approachable tone
- No keyword stuffing - natural clinic name usage
- Written for patients researching this specific clinic
- Helpful, informative, trustworthy
- No exaggerated claims ("best dentist in the city", fake reviews)

=== STRUCTURE RULES ===
- Exactly ONE H1 (should include clinic name)
- 4-6 H2 sections covering: About, Services, Location, Patient Experience, etc.
- H3 only when logically belonging under an H2
- No bullet spam, no filler text
- 3-5 FAQs specific to this clinic

=== UNIQUENESS REQUIREMENT ===
- Each clinic page must be completely unique
- NEVER reuse generic dental content across clinics
- Personalize based on clinic name, location, and any known details
- Even similar clinics must read differently

=== SEO COMPLIANCE (BRANDED SEARCH) ===
- Meta title: "[Clinic Name] | Dental Services in [City]" (under 60 chars)
- Meta description: Unique description mentioning clinic name (under 155 chars)
- Include clinic name naturally 3-5 times in content
- Location references (city, neighborhood) for local SEO
- Google E-E-A-T compliance

=== WHAT TO INCLUDE ===
- Clinic overview and what makes it notable
- Services offered (general, cosmetic, emergency, etc.)
- Location and accessibility information
- What patients can expect during a visit
- FAQs about the clinic specifically

=== WHAT TO AVOID ===
- Do NOT invent specific facts (founding year, staff names, awards)
- Do NOT make up patient testimonials
- Do NOT claim specific certifications unless provided
- Do NOT mention AppointPanda or any booking platform`;

    // Generate unique anti-duplication seed based on slug and random factors
    function generateUniquenessSeed(slug: string, pageType: string): string {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      
      // Opening style variations
      const openingStyles = [
        "Start with a compelling question that addresses the reader's immediate concern.",
        "Open with a local statistic or fact about this specific area.",
        "Begin with a patient scenario that resonates with local residents.",
        "Start by describing what makes this location/service unique.",
        "Open with a brief history or context about dental care in this area.",
        "Begin with a direct statement addressing the primary patient need.",
        "Start with a comparison or contrast that highlights key differences.",
        "Open with an engaging anecdote about dental care experiences."
      ];
      
      // Structure variations
      const structureStyles = [
        "Use a problem-solution framework throughout.",
        "Organize around patient journey stages.",
        "Structure as a comprehensive guide with numbered steps.",
        "Use a Q&A conversational format within sections.",
        "Organize by patient type (families, seniors, busy professionals).",
        "Structure around common concerns and how to address them.",
        "Use a comparison framework highlighting options.",
        "Organize chronologically from initial visit to ongoing care."
      ];
      
      const selectedOpening = openingStyles[timestamp % openingStyles.length];
      const selectedStructure = structureStyles[(timestamp + 3) % structureStyles.length];
      
      return `
=== UNIQUENESS DIRECTIVE (ID: ${randomId}) ===
This content MUST be completely different from all other pages. Use these specific instructions:

OPENING STYLE: ${selectedOpening}
STRUCTURE APPROACH: ${selectedStructure}
UNIQUE IDENTIFIER: ${slug.toUpperCase()}-${randomId}

MANDATORY DIFFERENTIATION:
- Do NOT use generic dental industry phrases
- Invent specific local context (neighborhood references, regional characteristics)
- Use varied sentence structures (mix short punchy sentences with longer explanatory ones)
- Include at least 3 unique examples or scenarios not used elsewhere
- Vary paragraph lengths dramatically (some 2-3 sentences, some 5-6)
- Use different transitional phrases than typical SEO content
`;
    }

    // Generate content for a page
    async function generateContent(pageData: any, wordCount: number, clinicData?: any) {
      const { page_type, slug, title, content: existingContent } = pageData;
      
      // Determine if this is a clinic page (uses different voice/strategy)
      const isClinicPage = page_type === "clinic" || page_type === "dentist";
      
      // Generate uniqueness seed
      const uniquenessSeed = generateUniquenessSeed(slug, page_type);
      
      // Build context based on page type
      let pageContext = "";
      const parts = slug.split("/").filter(Boolean);
      
      switch (page_type) {
        case "state":
          const stateName = title || parts[0]?.toUpperCase() || "this state";
          pageContext = `This is a STATE directory page for ${stateName}.
Context: Show all dental providers in ${stateName}. Explain how AppointPanda helps patients find dentists across the state.
Include: Overview of dental care landscape, how to find a dentist, what AppointPanda offers, popular services.`;
          break;
          
        case "city":
          const cityName = title || parts[1] || parts[0] || "this city";
          const stateAbbr = parts[0]?.toUpperCase() || "";
          pageContext = `This is a CITY directory page for ${cityName}, ${stateAbbr}.
Context: Show dentists in ${cityName}. Explain how AppointPanda helps local residents find dental care.
Include: Local dental care overview, finding the right dentist, services available, cost considerations.
LOCAL SPECIFICITY: Mention specific aspects of ${cityName} - its neighborhoods, community character, or regional healthcare landscape.`;
          break;
          
        case "treatment":
        case "service":
          const serviceName = title || slug.replace(/-/g, " ");
          pageContext = `This is a SERVICE/TREATMENT page for ${serviceName}.
Context: Explain what ${serviceName} is, who needs it, what to expect.
Include: What is this treatment, who is it for, process overview, cost considerations, how AppointPanda helps find providers.`;
          break;
          
        case "service_location":
        case "city_treatment":
          const treatmentName = title || parts[parts.length - 1]?.replace(/-/g, " ") || "dental treatment";
          const locationCity = parts[1]?.replace(/-/g, " ") || "this city";
          const locationState = parts[0]?.toUpperCase() || "";
          pageContext = `This is a SERVICE + LOCATION page for ${treatmentName} in ${locationCity}, ${locationState}.
Context: Explain ${treatmentName} and how to find providers offering it in ${locationCity}.
Include: What is ${treatmentName}, local availability, cost in this area, how to choose a provider, AppointPanda's role.
IMPORTANT: Make this unique - combine local ${locationCity} context with ${treatmentName} specifics. Don't just merge generic content.`;
          break;
          
        case "clinic":
        case "dentist":
          // For clinic pages, extract clinic name and location for branded SEO
          const clinicName = clinicData?.name || title || "this dental practice";
          const clinicCity = clinicData?.city || "";
          const clinicState = clinicData?.state || "";
          const clinicAddress = clinicData?.address || "";
          const clinicServices = clinicData?.services?.join(", ") || "general dental services";
          
          pageContext = `This is a CLINIC PROFILE page for: ${clinicName}
${clinicCity ? `Location: ${clinicCity}${clinicState ? `, ${clinicState}` : ""}` : ""}
${clinicAddress ? `Address: ${clinicAddress}` : ""}
${clinicServices ? `Known services: ${clinicServices}` : ""}

GOAL: Help this page RANK when someone searches for "${clinicName}" on Google.

Content Focus:
- Use "${clinicName}" naturally 3-5 times throughout the content
- Write ABOUT the clinic from a neutral third-party perspective
- Include: About ${clinicName}, Services offered, Location & accessibility, Patient experience, FAQs about ${clinicName}
- DO NOT invent specific facts (founding year, staff names, awards, patient counts)
- DO NOT create fake testimonials
- Focus on what patients searching for this clinic would want to know`;
          break;
          
        case "static":
          pageContext = `This is a STATIC page (About, Features, Policy, etc.).
Context: Write informative content appropriate for the page's purpose.
Include: Clear explanation of the topic, how it relates to AppointPanda, user benefits.`;
          break;
          
        default:
          pageContext = `This is a general page on AppointPanda.
Context: Write helpful, informative content for dental patients.
Include: Clear explanations, how AppointPanda helps, relevant information for the topic.`;
      }

      // Select the appropriate system prompt
      const systemPrompt = isClinicPage ? CLINIC_SYSTEM_PROMPT : PLATFORM_SYSTEM_PROMPT;
      
      // Build user prompt - include uniqueness seed for differentiation
      const userPrompt = isClinicPage 
        ? `Generate SEO-optimized content for this CLINIC profile page:

PAGE URL: /${slug}
PAGE TYPE: ${page_type}
TARGET WORD COUNT: ${wordCount} words

${pageContext}

${existingContent ? `EXISTING CONTENT (for reference, improve upon it):
${existingContent.slice(0, 500)}...` : "No existing content - create from scratch."}

${uniquenessSeed}

Generate comprehensive, unique content that helps this clinic rank for its name. Remember: NO AppointPanda mentions, write about the clinic only.`
        : `Generate SEO-optimized content for this page:

PAGE URL: /${slug}
PAGE TYPE: ${page_type}
TARGET WORD COUNT: ${wordCount} words

${pageContext}

${existingContent ? `EXISTING CONTENT (for reference, but write COMPLETELY NEW unique content):
${existingContent.slice(0, 500)}...` : "No existing content - create from scratch."}

${uniquenessSeed}

CRITICAL: This content MUST be 100% unique. Do not reuse any phrases, structures, or patterns from other pages. Generate fresh, original content following the uniqueness directive above.`;

      const requestBody = {
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        // STRICT TOOL SEPARATION: Content Studio does NOT generate meta_title, meta_description, or FAQs
        // Those are handled by Meta Optimizer and FAQ Studio respectively
        tools: [
          {
            type: "function",
            function: {
              name: "generate_page_content",
              description: isClinicPage 
                ? "Generate BODY CONTENT ONLY for a dental clinic profile page (no meta tags, no FAQs)" 
                : "Generate BODY CONTENT ONLY for SEO page (no meta tags, no FAQs - those are handled separately)",
              parameters: {
                type: "object",
                properties: {
                  // meta_title REMOVED - Meta Optimizer responsibility
                  // meta_description REMOVED - Meta Optimizer responsibility
                  h1: { type: "string", description: isClinicPage ? "Main H1 with clinic name" : "Main H1 heading" },
                  intro_paragraph: { type: "string", description: "Opening paragraph 50-100 words" },
                  h2_sections: {
                    type: "array",
                    description: "4-6 H2 sections covering the page topic comprehensively",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string", description: "H2 section heading" },
                        content: { type: "string", description: "Section content 80-150 words" },
                        h3_subsections: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              heading: { type: "string" },
                              content: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  },
                  // faq REMOVED - FAQ Studio responsibility (strict separation)
                  closing_paragraph: { type: "string", description: isClinicPage ? "Closing paragraph (no CTA to external platforms)" : "Closing with CTA" },
                  internal_links_intro: { type: "string", description: "Optional bridge sentence before internal links section" }
                },
                required: ["h1", "intro_paragraph", "h2_sections", "closing_paragraph"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_page_content" } }
      };
      const response = await callAIWithRetry(requestBody);

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
        if (response.status === 402) throw new Error("AI credits exhausted. Please add credits.");
        throw new Error(`AI service error (${response.status})`);
      }

      const aiJson = await response.json();
      
      // Extract from tool call
      if (aiJson.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = aiJson.choices[0].message.tool_calls[0];
        if (toolCall.function?.arguments) {
          try {
            return JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error("Failed to parse tool arguments:", e);
          }
        }
      }
      
      // Fallback: try parsing content
      const content = aiJson.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      throw new Error("Failed to generate content");
    }

    // Build full content markdown from generated sections
    // NOTE: FAQs are NOT included here - they are managed separately by FAQ Studio
    function buildContentMarkdown(generated: any): string {
      let markdown = "";
      
      if (generated.intro_paragraph) {
        markdown += generated.intro_paragraph + "\n\n";
      }
      
      if (generated.h2_sections && Array.isArray(generated.h2_sections)) {
        for (const section of generated.h2_sections) {
          markdown += `## ${section.heading}\n\n${section.content}\n\n`;
          
          if (section.h3_subsections && Array.isArray(section.h3_subsections)) {
            for (const subsection of section.h3_subsections) {
              markdown += `### ${subsection.heading}\n\n${subsection.content}\n\n`;
            }
          }
        }
      }
      
      // FAQs REMOVED - FAQ Studio is responsible for FAQs (strict tool separation)
      // The FAQ section will be rendered from the dedicated `faqs` JSONB column
      
      if (generated.closing_paragraph) {
        markdown += generated.closing_paragraph + "\n";
      }
      
      // Add internal links intro if provided
      if (generated.internal_links_intro) {
        markdown += "\n" + generated.internal_links_intro + "\n";
      }
      
      return markdown;
    }

    // Count words in content
    function countWords(text: string): number {
      if (!text) return 0;
      return text.split(/\s+/).filter(Boolean).length;
    }

    // Simple hash for content fingerprinting
    function hashContent(content: string): string {
      let hash = 0;
      const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
      for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }

    // Check content uniqueness against existing pages - ENHANCED with stricter checks
    async function checkContentUniqueness(content: string, pageId: string, pageType: string): Promise<{
      isUnique: boolean;
      similarity: number;
      similarSlug: string | null;
    }> {
      // Get more candidates for comparison (100 instead of 50)
      const { data: candidates } = await supabaseAdmin
        .from('seo_pages')
        .select('id, slug, content')
        .eq('page_type', pageType)
        .neq('id', pageId)
        .not('content', 'is', null)
        .limit(100);
      
      let maxSimilarity = 0;
      let similarSlug: string | null = null;
      
      // Normalize content for comparison
      const normalizeText = (text: string) => text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      const words1 = new Set(normalizeText(content));
      
      // Also check opening sentences (first 100 words) for intro uniqueness
      const intro1 = normalizeText(content.slice(0, 500));
      
      for (const candidate of candidates || []) {
        if (!candidate.content) continue;
        
        const words2 = new Set(normalizeText(candidate.content));
        const intro2 = normalizeText(candidate.content.slice(0, 500));
        
        if (words1.size === 0 || words2.size === 0) continue;
        
        // Calculate word overlap similarity
        let shared = 0;
        for (const word of words1) {
          if (words2.has(word)) shared++;
        }
        const wordSimilarity = shared / Math.max(words1.size, words2.size);
        
        // Calculate intro overlap (stricter check for opening)
        let introShared = 0;
        const introSet1 = new Set(intro1);
        for (const word of intro2) {
          if (introSet1.has(word)) introShared++;
        }
        const introSimilarity = intro2.length > 0 ? introShared / Math.max(intro1.length, intro2.length) : 0;
        
        // Combined similarity (weight intro more heavily as it's often most duplicated)
        const combinedSimilarity = (wordSimilarity * 0.6) + (introSimilarity * 0.4);
        
        if (combinedSimilarity > maxSimilarity) {
          maxSimilarity = combinedSimilarity;
          similarSlug = candidate.slug;
        }
      }
      
      // Stricter threshold: 70% instead of 80%
      return {
        isUnique: maxSimilarity < 0.70,
        similarity: maxSimilarity,
        similarSlug
      };
    }

    // Save content version for rollback
    async function saveContentVersion(pageId: string, contentData: any, source: string, reason: string) {
      // Get current max version
      const { data: versions } = await supabaseAdmin
        .from("seo_content_versions")
        .select("version_number")
        .eq("seo_page_id", pageId)
        .order("version_number", { ascending: false })
        .limit(1);
      
      const nextVersion = (versions?.[0]?.version_number || 0) + 1;
      
      // Mark existing versions as not current
      await supabaseAdmin
        .from("seo_content_versions")
        .update({ is_current: false })
        .eq("seo_page_id", pageId);
      
      // Insert new version
      await supabaseAdmin.from("seo_content_versions").insert({
        seo_page_id: pageId,
        version_number: nextVersion,
        meta_title: contentData.meta_title,
        meta_description: contentData.meta_description,
        h1: contentData.h1,
        content: contentData.content,
        word_count: countWords(contentData.content),
        seo_score: contentData.seo_score,
        faq: contentData.faq,
        internal_links: contentData.internal_links,
        change_source: source,
        change_reason: reason,
        changed_by: userId,
        is_current: true,
      });
    }

    // Handle actions
    switch (action) {
      case "generate_content":
      case "preview_content": {
        if (!page_id) {
          return new Response(JSON.stringify({ error: "page_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get page data
        const { data: page, error: pageError } = await supabaseAdmin
          .from("seo_pages")
          .select("*")
          .eq("id", page_id)
          .single();

        if (pageError || !page) {
          return new Response(JSON.stringify({ error: "Page not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const wordCount = config?.word_count || 700;
        
        // For clinic pages, fetch additional clinic data for better content
        let clinicData = null;
        if (page.page_type === "clinic" || page.page_type === "dentist") {
          // Try to extract clinic ID from slug (e.g., /clinic/clinic-slug)
          const slugParts = page.slug.split("/").filter(Boolean);
          const clinicSlug = slugParts[slugParts.length - 1];
          
          // Fetch clinic data for richer content
          const { data: clinic } = await supabaseAdmin
            .from("clinics")
            .select("id, name, city, state, address, services, description")
            .eq("slug", clinicSlug)
            .single();
          
          if (clinic) {
            clinicData = {
              name: clinic.name,
              city: clinic.city,
              state: clinic.state,
              address: clinic.address,
              services: clinic.services || [],
              description: clinic.description,
            };
          }
        }
        
        const generated = await generateContent(page, wordCount, clinicData);
        
        // Build full content
        const fullContent = buildContentMarkdown(generated);
        const actualWordCount = countWords(fullContent);

        // For preview, just return the generated content
        if (action === "preview_content") {
          return new Response(JSON.stringify({
            ...generated,
            content: fullContent,
            word_count: actualWordCount,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // For generate_content, save it
        if (!config?.save_as_draft) {
          // Save version for rollback
          await saveContentVersion(page_id, {
            meta_title: page.meta_title,
            meta_description: page.meta_description,
            h1: page.h1,
            content: page.content,
            faq: null,
          }, "ai_backup", "Auto-backup before AI generation");

          // Check uniqueness before saving
          const uniquenessResult = await checkContentUniqueness(fullContent, page_id, page.page_type);
          
          // Update the page with uniqueness info
          // STRICT SEPARATION: Content Studio does NOT write to meta_title, meta_description, or faqs
          const contentHash = hashContent(fullContent);
          
          // Build update object - ONLY body content fields
          const updateData: Record<string, any> = {
            // meta_title REMOVED - Meta Optimizer responsibility
            // meta_description REMOVED - Meta Optimizer responsibility
            h1: generated.h1,
            page_intro: generated.intro_paragraph || null,
            h2_sections: generated.h2_sections || null,
            internal_links_intro: generated.internal_links_intro || null,
            content: fullContent,
            word_count: actualWordCount,
            is_thin_content: actualWordCount < 300,
            is_optimized: true,
            optimized_at: now,
            updated_at: now,
            metadata_hash: contentHash,
            is_duplicate: !uniquenessResult.isUnique,
            similarity_score: uniquenessResult.similarity,
            similar_to_slug: uniquenessResult.similarSlug,
            last_generated_at: now,
            last_content_edit_source: 'content_studio',
          };
          
          // Validate we're not writing to blocked fields
          const validation = validateContentStudioWrite(Object.keys(updateData));
          if (!validation.valid) {
            console.error(`Content Studio attempted to write to blocked fields: ${validation.blockedFields.join(', ')}`);
            // Remove blocked fields from update
            for (const blocked of validation.blockedFields) {
              delete updateData[blocked];
            }
          }
          
          const { error: updateError } = await supabaseAdmin
            .from("seo_pages")
            .update(updateData)
            .eq("id", page_id);

          if (updateError) {
            console.error("Update error:", updateError);
            return new Response(JSON.stringify({ error: "Failed to save content" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Save new version - ONLY body content fields (no meta, no faqs)
          await saveContentVersion(page_id, {
            // meta_title REMOVED - Meta Optimizer responsibility
            // meta_description REMOVED - Meta Optimizer responsibility
            h1: generated.h1,
            content: fullContent,
            seo_score: generated.seo_score,
            // faq REMOVED - FAQ Studio responsibility
          }, "content_studio", `Generated ${actualWordCount} words (body content only)`);
        }

        return new Response(JSON.stringify({
          success: true,
          ...generated,
          content: fullContent,
          word_count: actualWordCount,
          is_unique: !page.is_duplicate,
          similarity_score: page.similarity_score || 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "apply_content": {
        if (!page_id || !content) {
          return new Response(JSON.stringify({ error: "page_id and content required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current page for backup
        const { data: currentPage } = await supabaseAdmin
          .from("seo_pages")
          .select("*")
          .eq("id", page_id)
          .single();

        if (currentPage) {
          await saveContentVersion(page_id, {
            meta_title: currentPage.meta_title,
            meta_description: currentPage.meta_description,
            h1: currentPage.h1,
            content: currentPage.content,
          }, "ai_backup", "Auto-backup before applying preview");
        }

        // Build content if we have sections
        let fullContent = content.content || "";
        if (content.intro_paragraph || content.h2_sections) {
          fullContent = buildContentMarkdown(content);
        }
        const wordCount = countWords(fullContent);

        // Update page
        const { error: updateError } = await supabaseAdmin
          .from("seo_pages")
          .update({
            meta_title: content.meta_title,
            meta_description: content.meta_description,
            h1: content.h1,
            content: fullContent,
            word_count: wordCount,
            is_thin_content: wordCount < 300,
            is_optimized: true,
            optimized_at: now,
            updated_at: now,
          })
          .eq("id", page_id);

        if (updateError) {
          return new Response(JSON.stringify({ error: "Failed to apply content" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save new version
        await saveContentVersion(page_id, {
          meta_title: content.meta_title,
          meta_description: content.meta_description,
          h1: content.h1,
          content: fullContent,
          faq: content.faq,
        }, "ai_applied", "Content applied from preview");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "manual_edit": {
        if (!page_id || !content) {
          return new Response(JSON.stringify({ error: "page_id and content required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current page for backup
        const { data: currentPage } = await supabaseAdmin
          .from("seo_pages")
          .select("*")
          .eq("id", page_id)
          .single();

        if (currentPage) {
          await saveContentVersion(page_id, {
            meta_title: currentPage.meta_title,
            meta_description: currentPage.meta_description,
            h1: currentPage.h1,
            content: currentPage.content,
          }, "manual_backup", "Auto-backup before manual edit");
        }

        const wordCount = countWords(content.content || "");

        // Update page
        const { error: updateError } = await supabaseAdmin
          .from("seo_pages")
          .update({
            meta_title: content.meta_title,
            meta_description: content.meta_description,
            h1: content.h1,
            content: content.content,
            word_count: wordCount,
            is_thin_content: wordCount < 300,
            updated_at: now,
          })
          .eq("id", page_id);

        if (updateError) {
          return new Response(JSON.stringify({ error: "Failed to save edits" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save new version
        await saveContentVersion(page_id, {
          meta_title: content.meta_title,
          meta_description: content.meta_description,
          h1: content.h1,
          content: content.content,
        }, "manual_edit", "Manual edit by admin");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "rollback_version": {
        if (!page_id || !version_id) {
          return new Response(JSON.stringify({ error: "page_id and version_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the version to restore
        const { data: version, error: versionError } = await supabaseAdmin
          .from("seo_content_versions")
          .select("*")
          .eq("id", version_id)
          .single();

        if (versionError || !version) {
          return new Response(JSON.stringify({ error: "Version not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current page for backup
        const { data: currentPage } = await supabaseAdmin
          .from("seo_pages")
          .select("*")
          .eq("id", page_id)
          .single();

        if (currentPage) {
          await saveContentVersion(page_id, {
            meta_title: currentPage.meta_title,
            meta_description: currentPage.meta_description,
            h1: currentPage.h1,
            content: currentPage.content,
          }, "rollback_backup", `Backup before rollback to v${version.version_number}`);
        }

        // Update page with version content
        const { error: updateError } = await supabaseAdmin
          .from("seo_pages")
          .update({
            meta_title: version.meta_title,
            meta_description: version.meta_description,
            h1: version.h1,
            content: version.content,
            word_count: version.word_count,
            is_thin_content: (version.word_count || 0) < 300,
            updated_at: now,
          })
          .eq("id", page_id);

        if (updateError) {
          return new Response(JSON.stringify({ error: "Failed to rollback" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Mark all versions as not current
        await supabaseAdmin
          .from("seo_content_versions")
          .update({ is_current: false })
          .eq("seo_page_id", page_id);

        // Mark restored version as current
        await supabaseAdmin
          .from("seo_content_versions")
          .update({ is_current: true })
          .eq("id", version_id);

        return new Response(JSON.stringify({ success: true, restored_version: version.version_number }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  } catch (error) {
    console.error("content-generation-studio error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
