import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OptimizeRequest {
  action: "optimize_page" | "audit_page" | "batch_optimize" | "get_progress" | "generate_content" | "fix_by_issue_type" | "generate_service_location_content" | "generate_location_content";
  page_id?: string;
  page_slug?: string;
  page_type?: string;
  batch_size?: number;
  run_id?: string;
  issue_type?: "meta_title" | "meta_description" | "h1" | "h2" | "content";
  custom_prompt?: string;
  page_ids?: string[];
  // Service-location specific fields
  slug?: string;
  cityName?: string;
  stateAbbr?: string;
  stateSlug?: string;
  serviceName?: string;
  serviceSlug?: string;
  wordCount?: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Use AIMLAPI for AI access
    const AIMLAPI_KEY = Deno.env.get("AIMLAPI_KEY");

    if (!AIMLAPI_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AIMLAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Use getClaims for JWT verification (compatible with ES256 signing)
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("seo-content-optimizer: JWT verification failed", claimsError);
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify super_admin role
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isSuperAdmin = (roles ?? []).some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: OptimizeRequest = await req.json();
    const { action, page_id, page_slug, page_type, batch_size = 10, run_id, issue_type, custom_prompt, page_ids } = body;
    const now = new Date().toISOString();

    // Helper to call AI with retries for transient errors (502, 503, 504) and connection errors
    async function callAIWithRetry(body: object, maxRetries = 4): Promise<Response> {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          // Exponential backoff: 2s, 4s, 8s, 16s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          console.log(`seo-content-optimizer: Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
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

          // Success or non-retryable error (4xx errors except rate limiting)
          if (response.ok) {
            return response;
          }
          
          // Retry on server errors and rate limiting
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(`AI gateway returned ${response.status}`);
            console.warn(`seo-content-optimizer: AI gateway error ${response.status}, will retry...`);
            continue;
          }
          
          // Non-retryable client error
          return response;
        } catch (networkError) {
          // Handle connection errors (connection reset, timeout, etc.)
          lastError = networkError instanceof Error ? networkError : new Error(String(networkError));
          console.warn(`seo-content-optimizer: Network error (${lastError.message}), will retry...`);
        }
      }
      throw lastError || new Error("AI gateway failed after retries");
    }

    // AppointPanda Master SEO Prompt - First-party platform voice
    const APPOINTPANDA_SYSTEM_PROMPT = `You are generating SEO content ONLY for AppointPanda, a dental listing and appointment platform.

=== CRITICAL BUSINESS CONTEXT (NON-NEGOTIABLE) ===
- AppointPanda helps users find, compare, and book dentists and dental clinics
- We are NOT a dental clinic - we are a directory/booking platform
- We are NOT writing content for third parties
- ALL content must be written in AppointPanda's first-party voice: "we", "our platform", "AppointPanda helps patients..."

You must NEVER write as:
- a dentist or dental clinic
- a guest author
- a third-party blog

=== STRUCTURE-AWARE WRITING ===
For EVERY page you MUST:
1. Understand the page type (location / service / service+location / other)
2. Create proper heading hierarchy: One H1 only, multiple H2s, H3s only when logically belonging under an H2
3. Do NOT flatten the hierarchy or dump all content into one block
4. Do NOT repeat the same structure across different pages

=== BULK GENERATION UNIQUENESS (MANDATORY) ===
For EACH page generated:
- Treat it as a completely independent document
- NEVER reuse paragraphs, headings, or phrasing from other pages
- Vary structure, examples, phrasing, and flow
- Avoid templated writing patterns
- Even if pages share the same service or are in nearby cities, they MUST read differently

=== HEADING & STRUCTURE RULES (STRICT) ===
- One H1 only - must reflect page intent + location/service when relevant
- Use multiple H2 sections (4-6 recommended)
- Use H3 only when they logically belong under an H2
- Headings must describe what follows (no filler headings)
- Do NOT skip heading levels
- Do NOT repeat the same H2 titles across multiple pages
- Do NOT force keywords into every heading

=== GOOGLE E-E-A-T COMPLIANCE (CRITICAL) ===
Experience: Reflect real patient questions and concerns
Expertise: Correct dental terminology, clear explanations without medical instructions
Authoritativeness: Align with common dental standards, no random or fake sources
Trustworthiness: No exaggerated claims, no "best dentist" language, no guarantees, no fake awards/statistics

=== SEO BEST PRACTICES (MANDATORY) ===
- Natural keyword usage only - NO keyword stuffing
- Unique phrasing per page
- Meta title under 60 characters with primary keyword near beginning
- Meta description under 155 characters with clear call-to-action
- Strong internal consistency between title, H1, and content

=== PLATFORM POSITIONING (VERY IMPORTANT) ===
Because this content is for AppointPanda:
- Explain how our platform helps users: find dentists, compare clinics, explore services, book appointments
- Mention AppointPanda naturally
- Keep tone helpful, not promotional
- Never sound like an advertisement

=== CALL TO ACTION ===
End with a calm, helpful CTA such as:
- Encouraging users to explore dentists on AppointPanda
- Inviting users to book appointments through our platform

=== OUTPUT FORMAT ===
- Meta title (under 60 chars)
- Meta description (under 155 chars)
- H1 (clear page intent)
- Structured content using H2/H3
- FAQ section (3-5 questions)
- Soft closing paragraph mentioning AppointPanda

DO NOT: Mention prompts or instructions, explain your process, copy content between pages.`;

    // Generate SEO-optimized content using AI
    async function generateSeoContent(pageData: {
      slug: string;
      page_type: string;
      name: string;
      cityName?: string;
      stateName?: string;
      stateAbbr?: string;
      existingContent?: string;
      issueType?: "meta_title" | "meta_description" | "h1" | "h2" | "content";
      customPrompt?: string;
    }) {
      const prompt = buildSeoPrompt(pageData);
      
      // Build system prompt with AppointPanda-specific instructions
      let systemContent = APPOINTPANDA_SYSTEM_PROMPT;

      // Add issue-specific focus
      if (pageData.issueType) {
        const issueInstructions: Record<string, string> = {
          meta_title: `

=== FOCUS: META TITLES ===
- Keep under 60 characters
- Include primary keyword at the beginning
- Add location for local pages
- Use format: [Primary Keyword] in [Location] | AppointPanda
- Make titles compelling and click-worthy
- Write from AppointPanda's perspective (e.g., "Find Dentists in..." not "Best Dentist...")`,
          meta_description: `

=== FOCUS: META DESCRIPTIONS ===
- Keep under 155 characters
- Start with an action verb (Discover, Find, Book, Compare)
- Include clear value proposition from AppointPanda's perspective
- Add call-to-action (book now, compare clinics, read reviews)
- Include location for local pages`,
          h1: `

=== FOCUS: H1 HEADINGS ===
- Each page needs exactly ONE H1
- H1 should contain primary keyword naturally
- Keep between 20-70 characters
- Make it descriptive and specific
- Different from but related to meta title
- Write from platform perspective (e.g., "Find [Service] Dentists in [City]")`,
          h2: `

=== FOCUS: H2 STRUCTURE ===
- Create 4-6 meaningful H2 sections
- H2s should organize content logically
- Include keywords naturally in H2s
- Suggested H2s: About [Service/Location], What to Expect, How AppointPanda Helps, Cost Considerations, FAQs
- VARY H2 headings between pages - no templated repetition`,
          content: `

=== FOCUS: RICH CONTENT (Fix Thin Content) ===
- Minimum 400-600 words
- Include compelling introduction mentioning AppointPanda's role
- Add service/treatment descriptions
- Include location-specific information
- Add 3-5 FAQs with detailed answers
- Use proper formatting (headings, paragraphs, lists)
- Include how AppointPanda helps patients in this area
- End with platform CTA`,
        };
        systemContent += issueInstructions[pageData.issueType] || "";
      }

      // Add custom prompt if provided
      if (pageData.customPrompt) {
        systemContent += `\n\n=== CUSTOM INSTRUCTIONS FROM ADMINISTRATOR ===\n${pageData.customPrompt}`;
      }

      systemContent += "\n\nReturn ONLY valid JSON, no markdown.";
      
      const requestBody = {
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_seo_content",
              description: "Generate SEO-optimized content for a page",
              parameters: {
                type: "object",
                properties: {
                  meta_title: { type: "string", description: "SEO title under 60 chars" },
                  meta_description: { type: "string", description: "Meta description under 155 chars" },
                  h1: { type: "string", description: "Main H1 heading" },
                  h2_sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        content: { type: "string" },
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
                  intro_paragraph: { type: "string", description: "Opening paragraph" },
                  faq: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" }
                      }
                    }
                  },
                  keywords: { type: "array", items: { type: "string" } },
                  seo_score: { type: "number", description: "Estimated SEO score 0-100" }
                },
                required: ["meta_title", "meta_description", "h1", "intro_paragraph"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_seo_content" } }
      };

      const response = await callAIWithRetry(requestBody);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add credits to continue.");
        }
        const text = await response.text();
        console.error("AI response error:", response.status, text);
        throw new Error(`AI service unavailable (${response.status}). Please try again.`);
      }

      const aiJson = await response.json();
      console.log("AI response structure:", JSON.stringify(Object.keys(aiJson)));
      
      // Check for tool_calls in the response
      if (aiJson.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = aiJson.choices[0].message.tool_calls[0];
        console.log("Tool call found:", toolCall.function?.name);
        if (toolCall.function?.arguments) {
          try {
            return JSON.parse(toolCall.function.arguments);
          } catch (parseErr) {
            console.error("Failed to parse tool call arguments:", parseErr);
          }
        }
      }
      
      // Fallback: try to parse content directly if no tool_calls
      const content = aiJson.choices?.[0]?.message?.content;
      if (content) {
        console.log("Trying to parse direct content response");
        try {
          // Try to extract JSON from content (may be wrapped in markdown)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseErr) {
          console.error("Failed to parse content as JSON:", parseErr);
        }
      }

      console.error("No valid SEO content in AI response:", JSON.stringify(aiJson).slice(0, 500));
      return null;
    }

    function buildSeoPrompt(pageData: {
      slug: string;
      page_type: string;
      name: string;
      cityName?: string;
      stateName?: string;
      stateAbbr?: string;
      existingContent?: string;
    }): string {
      const { slug, page_type, name, cityName, stateName, stateAbbr, existingContent } = pageData;
      
      let context = "";
      
      switch (page_type) {
        case "state":
          context = `Generate unique SEO content for AppointPanda's ${name} state directory page.

PAGE CONTEXT:
- This is a STATE-level page showing all dental providers in ${name}
- Users land here to explore dentists across ${name}

CONTENT DIRECTION:
- Explain how AppointPanda helps patients find dentists across ${name}
- Mention major cities in ${name} where we list providers
- Discuss dental care landscape in ${name} (licensing, common needs)
- Include ${name}-specific details to make content unique
- H2 sections should cover: Overview of Dental Care in ${name}, How to Find a Dentist in ${name}, What AppointPanda Offers, Popular Dental Services, FAQs`;
          break;
          
        case "city":
          context = `Generate unique SEO content for AppointPanda's ${name}, ${stateAbbr || stateName || ""} city directory page.

PAGE CONTEXT:
- This is a CITY-level page showing dentists in ${name}
- Users are looking for local dental care options

CONTENT DIRECTION:
- Explain how AppointPanda helps ${name} residents find dentists
- Reference ${name} neighborhoods, landmarks, or local context when helpful
- Discuss how residents typically approach dental care locally
- Include what makes dental care in ${name} accessible through our platform
- H2 sections should cover: Dental Care in ${name}, Finding the Right Dentist, Services Available, Cost & Insurance, FAQs
- NEVER invent statistics or claims about ${name}`;
          break;
          
        case "treatment":
          context = `Generate unique SEO content for AppointPanda's ${name} service page.

PAGE CONTEXT:
- This is a TREATMENT/SERVICE page about ${name}
- Users want to understand this dental service and find providers

CONTENT DIRECTION:
- Explain ${name} clearly - what it is, why patients may need it, general benefits
- Describe what patients can expect during the procedure
- Mention cost and insurance considerations carefully (use "may", "can", "often", "depends")
- Explain how AppointPanda helps patients find ${name} specialists
- H2 sections should cover: About ${name}, What to Expect, Benefits, Cost Considerations, How AppointPanda Helps, FAQs
- Use cautious language - no guarantees or promises`;
          break;
          
        case "city_treatment":
          context = `Generate unique SEO content for AppointPanda's ${name} providers in ${cityName}, ${stateAbbr || ""} page.

PAGE CONTEXT:
- This is a SERVICE + LOCATION page combining treatment info with local context
- Users want ${name} specifically in ${cityName}

CONTENT DIRECTION:
- Explain ${name} clearly and specifically for ${cityName} residents
- Reference ${cityName} naturally - don't force location keywords
- Explain how AppointPanda helps ${cityName} patients find ${name} providers
- Include local considerations for this treatment
- H2 sections should cover: ${name} in ${cityName}, What to Know, Finding Specialists, Cost in ${cityName} Area, FAQs
- NEVER invent statistics about ${cityName}`;
          break;
          
        case "clinic":
          context = `Generate unique SEO content for a dental clinic profile on AppointPanda: ${name}.

PAGE CONTEXT:
- This is a CLINIC PROFILE page
- Users want to learn about this specific practice

CONTENT DIRECTION:
- Write from AppointPanda's perspective as the directory hosting this profile
- Describe the practice overview based on available information
- Explain what patients can expect
- Mention how AppointPanda helps patients book with this clinic
- Keep tone informative, not promotional for the clinic`;
          break;
          
        case "blog":
          context = `Generate unique SEO content for AppointPanda's dental health blog post: "${name}".

PAGE CONTEXT:
- This is a BLOG POST on AppointPanda's dental health blog
- Educational content for patients

CONTENT DIRECTION:
- Write from AppointPanda's first-party voice
- Provide educational value and practical tips
- Demonstrate dental expertise without giving medical instructions
- Include how AppointPanda can help readers find appropriate dental care
- End with a soft CTA to explore dentists on our platform`;
          break;
          
        default:
          context = `Generate unique SEO content for AppointPanda's page about ${name}.
Page type: ${page_type}. Write from AppointPanda's first-party platform voice.`;
      }
      
      return `${context}

PAGE URL: ${slug}
${existingContent ? `\nEXISTING CONTENT TO IMPROVE (rewrite completely, do not copy):\n${existingContent.slice(0, 500)}` : ""}

REQUIREMENTS:
1. 100% unique content - will NOT be flagged as duplicate by search engines
2. Location/service-specific information woven naturally throughout
3. Proper H1 > H2 > H3 hierarchy (one H1, 4-6 H2s, H3s only where logical)
4. Include 3-5 FAQs that match real user search intent
5. Mention AppointPanda naturally in the content
6. End with a soft, helpful CTA encouraging platform use`;
    }

    if (action === "optimize_page" && (page_id || page_slug)) {
      // Get the page data
      let query = supabaseAdmin.from("seo_pages").select("*");
      if (page_id) query = query.eq("id", page_id);
      if (page_slug) query = query.eq("slug", page_slug);
      
      const { data: page, error: pageError } = await query.single();
      
      if (pageError || !page) {
        return new Response(JSON.stringify({ success: false, error: "Page not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get additional context based on page type
      let additionalData: any = {};
      
      if (page.page_type === "city") {
        const citySlug = page.slug.split("/").pop();
        const { data: city } = await supabaseAdmin
          .from("cities")
          .select("name, states(name, abbreviation)")
          .eq("slug", citySlug)
          .single();
        if (city) {
          const stateData = Array.isArray(city.states) ? city.states[0] : city.states;
          additionalData = {
            name: city.name,
            stateName: stateData?.name,
            stateAbbr: stateData?.abbreviation,
          };
        }
      }

      // Generate optimized content
      const seoContent = await generateSeoContent({
        slug: page.slug,
        page_type: page.page_type,
        name: page.title || additionalData.name || page.slug.split("/").pop()?.replace(/-/g, " ") || "",
        cityName: additionalData.cityName,
        stateName: additionalData.stateName,
        stateAbbr: additionalData.stateAbbr,
        existingContent: page.content,
        issueType: issue_type,
        customPrompt: custom_prompt,
      });

      if (!seoContent) {
        return new Response(JSON.stringify({ success: false, error: "Failed to generate content" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build structured content from H2 sections
      let structuredContent = seoContent.intro_paragraph || "";
      if (seoContent.h2_sections) {
        for (const section of seoContent.h2_sections) {
          structuredContent += `\n\n## ${section.heading}\n\n${section.content}`;
          if (section.h3_subsections) {
            for (const subsection of section.h3_subsections) {
              structuredContent += `\n\n### ${subsection.heading}\n\n${subsection.content}`;
            }
          }
        }
      }

      // Add FAQ section
      if (seoContent.faq && seoContent.faq.length > 0) {
        structuredContent += "\n\n## Frequently Asked Questions\n\n";
        for (const faq of seoContent.faq) {
          structuredContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
        }
      }

      // Update the page (ensure seo_score is integer)
      // IMPORTANT: Only set is_optimized = true if we actually have content
      const finalScore = Math.round(Number(seoContent.seo_score) || 85);
      const hasRealContent = structuredContent && structuredContent.trim().length > 100;
      
      const { error: updateError } = await supabaseAdmin
        .from("seo_pages")
        .update({
          meta_title: seoContent.meta_title,
          meta_description: seoContent.meta_description,
          h1: seoContent.h1,
          content: hasRealContent ? structuredContent : null,
          og_title: seoContent.meta_title,
          og_description: seoContent.meta_description,
          seo_score: finalScore,
          is_optimized: hasRealContent, // Only mark optimized if real content exists
          optimized_at: hasRealContent ? now : null,
          updated_at: now,
          word_count: hasRealContent ? structuredContent.split(/\s+/).filter(Boolean).length : 0,
        })
        .eq("id", page.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ success: false, error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the optimization
      await supabaseAdmin.from("seo_metadata_history").insert({
        slug: page.slug,
        previous_title: page.meta_title,
        previous_meta_description: page.meta_description,
        previous_h1: page.h1,
        new_title: seoContent.meta_title,
        new_meta_description: seoContent.meta_description,
        new_h1: seoContent.h1,
        change_reason: "AI-powered SEO optimization",
        changed_by: userId,
        batch_id: `optimize_${Date.now()}`,
      });

      return new Response(JSON.stringify({
        success: true,
        page_id: page.id,
        slug: page.slug,
        optimized: seoContent,
        seo_score: seoContent.seo_score,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "audit_page" && (page_id || page_slug)) {
      let query = supabaseAdmin.from("seo_pages").select("*");
      if (page_id) query = query.eq("id", page_id);
      if (page_slug) query = query.eq("slug", page_slug);
      
      const { data: page } = await query.single();
      
      if (!page) {
        return new Response(JSON.stringify({ success: false, error: "Page not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Analyze page using AI with retry
      const auditRequestBody = {
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an SEO auditor. Analyze the page and return a detailed audit."
          },
          {
            role: "user",
            content: `Audit this page:
URL: ${page.slug}
Title: ${page.meta_title || "MISSING"}
Description: ${page.meta_description || "MISSING"}
H1: ${page.h1 || "MISSING"}
Content length: ${page.content?.length || 0} characters
Word count: ${page.word_count || 0}

Provide:
1. Overall SEO score (0-100)
2. Issues found with severity (critical/high/medium/low)
3. Specific recommendations
4. What's working well`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "seo_audit",
              description: "Return SEO audit results",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        category: { type: "string" },
                        issue: { type: "string" },
                        recommendation: { type: "string" }
                      }
                    }
                  },
                  strengths: { type: "array", items: { type: "string" } },
                  needs_optimization: { type: "boolean" }
                },
                required: ["score", "issues", "needs_optimization"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "seo_audit" } }
      };

      const response = await callAIWithRetry(auditRequestBody);

      if (!response.ok) {
        const text = await response.text();
        console.error("AI audit error:", response.status, text);
        throw new Error(`AI service unavailable (${response.status}). Please try again.`);
      }

      const aiJson = await response.json();
      let audit = { score: 0, issues: [], strengths: [], needs_optimization: true };

      if (aiJson.choices?.[0]?.message?.tool_calls?.[0]) {
        const toolCall = aiJson.choices[0].message.tool_calls[0];
        if (toolCall.function?.arguments) {
          audit = JSON.parse(toolCall.function.arguments);
        }
      }

      // Update page with audit results (ensure score is integer)
      const auditScore = Math.round(Number(audit.score) || 0);
      await supabaseAdmin
        .from("seo_pages")
        .update({
          seo_score: auditScore,
          last_audited_at: now,
          needs_optimization: audit.needs_optimization,
          updated_at: now,
        })
        .eq("id", page.id);

      return new Response(JSON.stringify({
        success: true,
        page_id: page.id,
        slug: page.slug,
        audit,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "batch_optimize") {
      // Create a run record
      const { data: runData } = await supabaseAdmin
        .from("seo_audit_runs")
        .insert({
          run_type: "ai_content_optimization",
          status: "running",
          started_at: now,
          triggered_by: userId,
          total_pages: 0,
          processed_pages: 0,
          fixed_pages: 0,
        })
        .select("id")
        .single();

      const runId = runData?.id;

      // Get pages that need optimization (no content or low score)
      let query = supabaseAdmin
        .from("seo_pages")
        .select("id, slug, page_type, title, meta_title, content, seo_score")
        .or("content.is.null,seo_score.lt.50,is_optimized.is.null");
      
      if (page_type) {
        query = query.eq("page_type", page_type);
      }

      const { data: pages } = await query.limit(batch_size);

      if (!pages || pages.length === 0) {
        if (runId) {
          await supabaseAdmin.from("seo_audit_runs").update({
            status: "completed",
            completed_at: now,
            summary: { message: "No pages need optimization" }
          }).eq("id", runId);
        }

        return new Response(JSON.stringify({
          success: true,
          message: "No pages need optimization",
          run_id: runId,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update total count
      if (runId) {
        await supabaseAdmin.from("seo_audit_runs").update({
          total_pages: pages.length,
        }).eq("id", runId);
      }

      const results = {
        optimized: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Process pages one by one to stay within rate limits
      for (const page of pages) {
        try {
          const seoContent = await generateSeoContent({
            slug: page.slug,
            page_type: page.page_type,
            name: page.title || page.slug.split("/").pop()?.replace(/-/g, " ") || "",
            existingContent: page.content,
          });

          if (seoContent) {
            let structuredContent = seoContent.intro_paragraph || "";
            if (seoContent.h2_sections) {
              for (const section of seoContent.h2_sections) {
                structuredContent += `\n\n## ${section.heading}\n\n${section.content}`;
              }
            }

            await supabaseAdmin
              .from("seo_pages")
              .update({
                meta_title: seoContent.meta_title,
                meta_description: seoContent.meta_description,
                h1: seoContent.h1,
                content: structuredContent,
                seo_score: seoContent.seo_score || 80,
                is_optimized: true,
                optimized_at: now,
                updated_at: now,
              })
              .eq("id", page.id);

            results.optimized++;
          } else {
            results.failed++;
            results.errors.push(`Failed to optimize ${page.slug}`);
          }

          // Update progress
          if (runId) {
            await supabaseAdmin.from("seo_audit_runs").update({
              processed_pages: results.optimized + results.failed,
              fixed_pages: results.optimized,
            }).eq("id", runId);
          }

          // Small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 500));

        } catch (err) {
          results.failed++;
          results.errors.push(`Error on ${page.slug}: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }

      // Complete the run
      if (runId) {
        await supabaseAdmin.from("seo_audit_runs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          processed_pages: results.optimized + results.failed,
          fixed_pages: results.optimized,
          error_count: results.failed,
          errors: results.errors.slice(0, 20),
          summary: {
            optimized: results.optimized,
            failed: results.failed,
            page_type_filter: page_type || "all",
          },
        }).eq("id", runId);
      }

      return new Response(JSON.stringify({
        success: true,
        run_id: runId,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_progress" && run_id) {
      const { data: run } = await supabaseAdmin
        .from("seo_audit_runs")
        .select("*")
        .eq("id", run_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        run,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Fix by issue type with custom prompt support
    if (action === "fix_by_issue_type" && issue_type && page_ids && page_ids.length > 0) {
      console.log(`seo-content-optimizer: Fixing ${page_ids.length} pages for issue type: ${issue_type}`);
      
      const results = {
        optimized: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const pageId of page_ids) {
        try {
          // Get page data
          const { data: page, error: pageError } = await supabaseAdmin
            .from("seo_pages")
            .select("*")
            .eq("id", pageId)
            .single();

          if (pageError || !page) {
            results.failed++;
            results.errors.push(`Page ${pageId} not found`);
            continue;
          }

          // Get additional context for city pages
          let additionalData: any = {};
          if (page.page_type === "city") {
            const citySlug = page.slug.split("/").pop();
            const { data: city } = await supabaseAdmin
              .from("cities")
              .select("name, states(name, abbreviation)")
              .eq("slug", citySlug)
              .single();
            if (city) {
              const stateData = Array.isArray(city.states) ? city.states[0] : city.states;
              additionalData = {
                name: city.name,
                stateName: stateData?.name,
                stateAbbr: stateData?.abbreviation,
              };
            }
          }

          // Generate optimized content with issue type focus
          const seoContent = await generateSeoContent({
            slug: page.slug,
            page_type: page.page_type,
            name: page.title || additionalData.name || page.slug.split("/").pop()?.replace(/-/g, " ") || "",
            cityName: additionalData.cityName,
            stateName: additionalData.stateName,
            stateAbbr: additionalData.stateAbbr,
            existingContent: page.content,
            issueType: issue_type,
            customPrompt: custom_prompt,
          });

          if (!seoContent) {
            results.failed++;
            results.errors.push(`Failed to generate content for ${page.slug}`);
            continue;
          }

          // Build updates based on what was generated
          const updates: any = {
            updated_at: now,
            is_optimized: true,
            optimized_at: now,
          };

          // Always update the fields that are generated
          if (seoContent.meta_title) updates.meta_title = seoContent.meta_title;
          if (seoContent.meta_description) updates.meta_description = seoContent.meta_description;
          if (seoContent.h1) updates.h1 = seoContent.h1;
          
          // Build structured content if h2_sections or intro_paragraph exist
          if (seoContent.intro_paragraph || seoContent.h2_sections) {
            let structuredContent = seoContent.intro_paragraph || "";
            if (seoContent.h2_sections) {
              for (const section of seoContent.h2_sections) {
                structuredContent += `\n\n## ${section.heading}\n\n${section.content}`;
                if (section.h3_subsections) {
                  for (const subsection of section.h3_subsections) {
                    structuredContent += `\n\n### ${subsection.heading}\n\n${subsection.content}`;
                  }
                }
              }
            }
            if (seoContent.faq && seoContent.faq.length > 0) {
              structuredContent += "\n\n## Frequently Asked Questions\n\n";
              for (const faq of seoContent.faq) {
                structuredContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
              }
            }
            updates.content = structuredContent;
          }

          if (seoContent.seo_score) updates.seo_score = Math.round(Number(seoContent.seo_score));

          // Update page
          const { error: updateError } = await supabaseAdmin
            .from("seo_pages")
            .update(updates)
            .eq("id", page.id);

          if (updateError) {
            results.failed++;
            results.errors.push(`Update failed for ${page.slug}: ${updateError.message}`);
            continue;
          }

          // Log to history
          await supabaseAdmin.from("seo_metadata_history").insert({
            slug: page.slug,
            previous_title: page.meta_title,
            previous_meta_description: page.meta_description,
            previous_h1: page.h1,
            new_title: updates.meta_title || page.meta_title,
            new_meta_description: updates.meta_description || page.meta_description,
            new_h1: updates.h1 || page.h1,
            change_reason: `AI fix: ${issue_type}${custom_prompt ? ' with custom instructions' : ''}`,
            changed_by: userId,
            batch_id: `fix_${issue_type}_${Date.now()}`,
          });

          results.optimized++;

          // Delay to avoid rate limits
          await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
          results.failed++;
          results.errors.push(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        issue_type,
        custom_prompt: custom_prompt || null,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate content for service-location pages
    if (action === "generate_service_location_content") {
      const { slug, cityName, stateAbbr, stateSlug, serviceName, serviceSlug, wordCount = 400, custom_prompt: customPrompt } = body as any;
      
      if (!slug || !cityName || !serviceName) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Missing required fields: slug, cityName, serviceName" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`seo-content-optimizer: Generating content for service-location: ${slug}`);

      // ANTI-DUPLICATION: Fetch titles/H1s of sibling pages (same service, different cities OR same city, different services)
      let siblingContext = "";
      try {
        // Get recently generated sibling pages to avoid duplication
        const slugParts = slug.split("/").filter(Boolean); // e.g. ["dubai", "jumeirah", "teeth-cleaning"]
        
        // Find pages with same service in different cities
        const { data: siblingPages } = await supabaseAdmin
          .from("seo_pages")
          .select("slug, h1, meta_title")
          .neq("slug", slug)
          .not("h1", "is", null)
          .like("slug", `%/${serviceSlug || slugParts[slugParts.length - 1]}`)
          .limit(8);
        
        // Also find pages in same city with different services
        const { data: sameCityPages } = await supabaseAdmin
          .from("seo_pages")
          .select("slug, h1, meta_title")
          .neq("slug", slug)
          .not("h1", "is", null)
          .like("slug", `%/${slugParts[1] || cityName.toLowerCase()}/%`)
          .limit(5);

        const allSiblings = [...(siblingPages || []), ...(sameCityPages || [])];
        if (allSiblings.length > 0) {
          siblingContext = `\n\nANTI-DUPLICATION CONTEXT — These are H1s/titles from SIBLING pages. Your content MUST be completely different in structure, phrasing, opening, and flow:\n${allSiblings.map(s => `- ${s.slug}: H1="${s.h1}", Title="${s.meta_title}"`).join("\n")}\n\nDo NOT reuse any of these headings, opening lines, or paragraph structures. Vary your approach significantly.`;
        }
      } catch (e) {
        console.warn("seo-content-optimizer: Could not fetch sibling pages for dedup:", e);
      }

      // Generate a unique content seed based on slug hash to force variation
      const slugHash = Array.from(slug).reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const writingAngles = [
        "Focus on patient decision-making journey and what questions to ask during consultation.",
        "Lead with the emotional aspect — dental anxiety, confidence, lifestyle impact.",
        "Take a practical/logistical angle — cost factors, time investment, recovery planning.",
        "Emphasize the technology and modern approaches available for this treatment.",
        "Focus on family considerations — how this treatment benefits different age groups.",
        "Lead with prevention — when this treatment prevents bigger problems.",
        "Take a comparison angle — how this treatment differs from alternatives.",
        "Focus on the UAE expat experience — navigating dental care as a newcomer.",
      ];
      const selectedAngle = writingAngles[slugHash % writingAngles.length];

      // Build the service-location specific prompt with comprehensive UAE-focused instructions
      let serviceLocationPrompt = `You are a senior healthcare SEO content writer and local search strategist.

You are writing a SERVICE-LOCATION PAGE for AppointPanda, a dental directory platform (NOT a clinic website).
This page helps users find dentists offering a specific treatment in a specific UAE location.

INPUT VARIABLES:
- Service: ${serviceName}
- Area: ${cityName}
- Emirate: ${stateAbbr || ''}
- Country: United Arab Emirates
- URL: ${slug}
- Target word count: ${wordCount} words

UNIQUE WRITING ANGLE FOR THIS PAGE: ${selectedAngle}
You MUST use this angle as your primary narrative approach. This ensures each page reads differently.
${siblingContext}

IMPORTANT CONTEXT:
- AppointPanda does NOT provide treatment.
- It connects patients with licensed dentists and clinics.
- Content must guide, educate, and help patients choose — not advertise one clinic.
- The goal is to rank organically on Google using helpful content principles and E-E-A-T.
- Write from AppointPanda's first-party voice: "we", "our platform", "AppointPanda helps patients..."

GOOGLE & QUALITY REQUIREMENTS (MANDATORY):
- Google Helpful Content System compliance
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- YMYL medical safety guidelines
- Human written tone (no AI generic phrasing)
- Local intent optimization
- Semantic SEO (entities, variations, natural language)
- No keyword stuffing, promotional claims, fake statistics, copied templates, or filler paragraphs

WRITING STYLE:
- Write like a knowledgeable healthcare guide helping a patient choose safely.
- Tone: Clear, human, reassuring, informative. Not robotic, salesy, or repetitive.
- Avoid: "best clinic", "top dentist", "leading clinic", exaggerated claims.
- Use: Practical explanations, decision-making help, realistic expectations, safety guidance, UAE healthcare context.

LOCALIZATION RULES:
- Strongly localize to ${cityName}, ${stateAbbr || ''}, UAE.
- Include naturally: nearby communities, typical resident needs (family, professionals, expats), accessibility considerations, urban lifestyle relevance, DHA/MOHAP licensing context (informational only).
- Do NOT insert random landmarks or fake details.

STRUCTURE TO GENERATE (vary the order and naming of sections — do NOT use identical H2 headings as other pages):
- H1: Must include ${serviceName} and ${cityName} but phrase it uniquely (not always "Find X in Y")
- Intro: Who needs this treatment and why people search locally
- What Is ${serviceName}? — Explain procedure in simple language, realistic expectations
- When Should You Consider It? — Symptoms/situations patients experience
- Choosing a Dentist in ${cityName} — What to check: experience, technology, consultation clarity, treatment planning
- Cost of ${serviceName} in ${stateAbbr || 'UAE'} — Explain price ranges generally, factors affecting price, DO NOT invent exact numbers
- Safety & Regulations in UAE — DHA/MOHAP standards, why licensed dentists matter
- Questions Patients Usually Ask — 5-7 natural FAQs (informational, not promotional)
- How Our Directory Helps — How AppointPanda helps compare clinics, not promote one
- Closing — Encourage informed decision without call-to-action pressure

SEO RULES:
- Natural variations: dentist in ${cityName}, dental clinic in ${cityName}, ${serviceName} in ${stateAbbr || 'UAE'}, treatment options near me
- Semantic entities: procedure steps, recovery, consultation, treatment planning, oral health goals
- Do NOT repeat keywords unnaturally.

PROHIBITED: No guaranteed outcomes, superiority claims, fake doctor authority, medical diagnosis, or prescriptions.

CRITICAL UNIQUENESS RULES:
- Your opening paragraph MUST be completely unique — never start with "Looking for..." or "Finding..." patterns.
- Vary your H2 heading names — don't always use "What Is X?" format. Use creative alternatives like "Understanding X", "Your Guide to X", "X Explained" etc.
- Each FAQ must be unique to this specific location+service combination.`;

      // Add custom prompt if provided
      if (customPrompt) {
        serviceLocationPrompt += `\n\nADDITIONAL INSTRUCTIONS FROM ADMINISTRATOR:\n${customPrompt}`;
      }

      // Generate content using AI
      const seoContent = await generateSeoContent({
        slug,
        page_type: "city_treatment",
        name: serviceName,
        cityName,
        stateAbbr,
        customPrompt: serviceLocationPrompt,
      });

      if (!seoContent) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to generate content" 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build structured content
      let structuredContent = seoContent.intro_paragraph || "";
      if (seoContent.h2_sections) {
        for (const section of seoContent.h2_sections) {
          structuredContent += `\n\n## ${section.heading}\n\n${section.content}`;
          if (section.h3_subsections) {
            for (const subsection of section.h3_subsections) {
              structuredContent += `\n\n### ${subsection.heading}\n\n${subsection.content}`;
            }
          }
        }
      }
      if (seoContent.faq && seoContent.faq.length > 0) {
        structuredContent += "\n\n## Frequently Asked Questions\n\n";
        for (const faq of seoContent.faq) {
          structuredContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
        }
      }

      const finalScore = Math.round(Number(seoContent.seo_score) || 85);

      // Check if seo_page exists, if not create it
      const { data: existingPage, error: lookupError } = await supabaseAdmin
        .from("seo_pages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (lookupError) {
        console.error("seo-content-optimizer: Error looking up page:", lookupError);
      }

      const finalWordCount = structuredContent.split(/\s+/).filter(Boolean).length;
      console.log(`seo-content-optimizer: Saving content for ${slug} (${finalWordCount} words, existing: ${!!existingPage})`);

      if (existingPage) {
        // Update existing page
        const { error: updateError } = await supabaseAdmin
          .from("seo_pages")
          .update({
            meta_title: seoContent.meta_title,
            meta_description: seoContent.meta_description,
            h1: seoContent.h1,
            content: structuredContent,
            og_title: seoContent.meta_title,
            og_description: seoContent.meta_description,
            seo_score: finalScore,
            is_optimized: true,
            is_thin_content: false,
            optimized_at: now,
            updated_at: now,
            word_count: finalWordCount,
          })
          .eq("id", existingPage.id);

        if (updateError) {
          console.error("seo-content-optimizer: Update error:", updateError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to update page: ${updateError.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`seo-content-optimizer: Successfully updated ${slug}`);
      } else {
        // Create new page
        const { error: insertError } = await supabaseAdmin
          .from("seo_pages")
          .insert({
            slug,
            page_type: "service_location",
            title: `${serviceName} in ${cityName}, ${stateAbbr || ''}`,
            meta_title: seoContent.meta_title,
            meta_description: seoContent.meta_description,
            h1: seoContent.h1,
            content: structuredContent,
            og_title: seoContent.meta_title,
            og_description: seoContent.meta_description,
            seo_score: finalScore,
            is_optimized: true,
            is_thin_content: false,
            optimized_at: now,
            is_indexed: true,
            word_count: finalWordCount,
          });

        if (insertError) {
          console.error("seo-content-optimizer: Insert error:", insertError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to create page: ${insertError.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`seo-content-optimizer: Successfully created ${slug}`);
      }

      // Log the generation
      await supabaseAdmin.from("seo_metadata_history").insert({
        slug,
        new_title: seoContent.meta_title,
        new_meta_description: seoContent.meta_description,
        new_h1: seoContent.h1,
        change_reason: `AI-generated service-location content for ${serviceName} in ${cityName}`,
        changed_by: userId,
        batch_id: `service_location_${Date.now()}`,
      });

      return new Response(JSON.stringify({
        success: true,
        slug,
        serviceName,
        cityName,
        stateAbbr,
        wordCount: structuredContent.split(/\s+/).length,
        seo_score: finalScore,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NEW: Generate content for location pages (states and cities)
    if (action === "generate_location_content") {
      const { slug, pageType, locationName, stateAbbr, wordCount = 300 } = body as any;
      
      if (!slug || !locationName || !pageType) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Missing required fields: slug, locationName, pageType" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`seo-content-optimizer: Generating content for location: ${slug} (${pageType})`);

      // Build location-specific prompt
      const isState = pageType === "state";
      let locationPrompt = `Generate unique, high-quality SEO content for a dental directory ${isState ? "state" : "city"} page.

PAGE DETAILS:
- URL: ${slug}
- Location: ${locationName}${stateAbbr && !isState ? `, ${stateAbbr}` : ""}
- Page Type: ${isState ? "State Overview" : "City Dental Directory"}
- Target word count: ${wordCount} words

CONTENT REQUIREMENTS:
1. LOCATION-SPECIFIC FOCUS:
   - Reference ${locationName} specifically throughout the content
   - ${isState 
     ? `Include information about dental care across ${locationName} state
        - Mention major cities and regions within ${locationName}
        - Reference state-specific dental regulations or insurance considerations
        - Highlight why ${locationName} residents choose local dental providers`
     : `Include specific neighborhood and community references in ${locationName}
        - Mention local landmarks or areas patients might recognize
        - Reference accessibility and convenience for ${locationName} residents
        - Highlight what makes dental care in ${locationName} special`}

2. DENTAL DIRECTORY FOCUS:
   - Explain how to find the best dentist in ${locationName}
   - List types of dental services available in the area
   - Include tips for choosing a dental provider
   - Mention common dental needs and solutions

3. E-E-A-T COMPLIANCE (Google's Quality Guidelines):
   - Experience: Include patient experience perspectives
   - Expertise: Demonstrate knowledge of dental care options
   - Authoritativeness: Reference established dental guidelines
   - Trustworthiness: Provide accurate, helpful information

4. SEO BEST PRACTICES:
   - Meta title: "Find Top Dentists in ${locationName}${stateAbbr && !isState ? `, ${stateAbbr}` : ""} | Dental Directory"
   - Meta description with clear call-to-action
   - Include 3-5 FAQs about finding dental care in ${locationName}
   - Natural keyword usage - no keyword stuffing

5. UNIQUE CONTENT REQUIREMENT:
   - This content MUST be 100% different from other location pages
   - Include ${locationName}-specific details and context
   - Create genuine value for users searching for dental care in ${locationName}`;

      // Generate content using AI
      const seoContent = await generateSeoContent({
        slug,
        page_type: pageType,
        name: locationName,
        stateAbbr,
        customPrompt: locationPrompt,
      });

      if (!seoContent) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to generate content" 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build structured content
      let structuredContent = seoContent.intro_paragraph || "";
      if (seoContent.h2_sections) {
        for (const section of seoContent.h2_sections) {
          structuredContent += `\n\n## ${section.heading}\n\n${section.content}`;
          if (section.h3_subsections) {
            for (const subsection of section.h3_subsections) {
              structuredContent += `\n\n### ${subsection.heading}\n\n${subsection.content}`;
            }
          }
        }
      }
      if (seoContent.faq && seoContent.faq.length > 0) {
        structuredContent += "\n\n## Frequently Asked Questions\n\n";
        for (const faq of seoContent.faq) {
          structuredContent += `### ${faq.question}\n\n${faq.answer}\n\n`;
        }
      }

      const finalScore = Math.round(Number(seoContent.seo_score) || 85);

      // Check if seo_page exists, if not create it
      const { data: existingPage } = await supabaseAdmin
        .from("seo_pages")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingPage) {
        // Update existing page
        const finalWordCount = structuredContent.split(/\s+/).filter(Boolean).length;
        await supabaseAdmin
          .from("seo_pages")
          .update({
            meta_title: seoContent.meta_title,
            meta_description: seoContent.meta_description,
            h1: seoContent.h1,
            content: structuredContent,
            seo_score: finalScore,
            is_optimized: true,
            is_thin_content: false,
            optimized_at: now,
            updated_at: now,
            word_count: finalWordCount,
          })
          .eq("id", existingPage.id);
      } else {
        // Create new page
        const finalWordCount = structuredContent.split(/\s+/).filter(Boolean).length;
        await supabaseAdmin.from("seo_pages").insert({
          slug,
          page_type: pageType,
          title: `Dentists in ${locationName}${stateAbbr && !isState ? `, ${stateAbbr}` : ""}`,
          meta_title: seoContent.meta_title,
          meta_description: seoContent.meta_description,
          h1: seoContent.h1,
          content: structuredContent,
          seo_score: finalScore,
          is_optimized: true,
          is_thin_content: false,
          is_indexed: true,
          optimized_at: now,
          word_count: finalWordCount,
          created_at: now,
          updated_at: now,
        });
      }

      // Log to history
      await supabaseAdmin.from("seo_metadata_history").insert({
        slug,
        new_title: seoContent.meta_title,
        new_meta_description: seoContent.meta_description,
        new_h1: seoContent.h1,
        change_reason: `AI-generated ${pageType} content for ${locationName}`,
        changed_by: userId,
        batch_id: `location_${pageType}_${Date.now()}`,
      });

      return new Response(JSON.stringify({
        success: true,
        slug,
        locationName,
        pageType,
        wordCount: structuredContent.split(/\s+/).length,
        seo_score: finalScore,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: stats } = await supabaseAdmin.rpc("get_seo_stats").single();
    
    const { count: needsOptimization } = await supabaseAdmin
      .from("seo_pages")
      .select("id", { count: "exact", head: true })
      .or("content.is.null,seo_score.lt.50,is_optimized.is.null");

    const { count: totalPages } = await supabaseAdmin
      .from("seo_pages")
      .select("id", { count: "exact", head: true });

    const { count: optimizedPages } = await supabaseAdmin
      .from("seo_pages")
      .select("id", { count: "exact", head: true })
      .eq("is_optimized", true);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        total_pages: totalPages || 0,
        optimized_pages: optimizedPages || 0,
        needs_optimization: needsOptimization || 0,
        optimization_rate: totalPages ? Math.round((optimizedPages || 0) / totalPages * 100) : 0,
      },
      available_actions: ["optimize_page", "audit_page", "batch_optimize", "get_progress"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("seo-content-optimizer error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
