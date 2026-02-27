import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==========================================
// FAQ STUDIO - STRICT FIELD SEPARATION
// ==========================================
const FAQ_STUDIO_ALLOWED_FIELDS = ['faqs', 'last_faq_edit_source', 'updated_at'];
const FAQ_STUDIO_BLOCKED_FIELDS = [
  'meta_title', 'meta_description', 'og_title', 'og_description',
  'h1', 'content', 'page_intro', 'h2_sections', 'internal_links_intro'
];

function validateFAQStudioWrite(fields: string[]): { valid: boolean; blockedFields: string[] } {
  const blockedFields = fields.filter(f => FAQ_STUDIO_BLOCKED_FIELDS.includes(f));
  return { valid: blockedFields.length === 0, blockedFields };
}

interface FAQRequest {
  action: "generate_faqs" | "preview_faqs" | "apply_faqs" | "audit_faqs";
  page_id?: string;
  page_ids?: string[];
  config?: {
    faq_count?: number;
    use_paa_style?: boolean;
    include_local_context?: boolean;
    make_unique?: boolean;
    tone?: 'friendly' | 'professional' | 'simple';
    avoid_duplicates_across_city?: boolean;
    regenerate_weak_only?: boolean;
  };
  faqs?: Array<{ question: string; answer: string }>;
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

    // Verify authentication using getUser
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

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
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

    const body: FAQRequest = await req.json();
    const { action, page_id, config, faqs } = body;
    const now = new Date().toISOString();

    // AI call helper with retries
    async function callAIWithRetry(requestBody: object, maxRetries = 4): Promise<Response> {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
          console.log(`faq-generation-studio: Retry attempt ${attempt + 1}/${maxRetries}`);
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
            const errText = await response.text();
            console.error(`AI API returned ${response.status}: ${errText}`);
            lastError = new Error(`AI gateway returned ${response.status}`);
            continue;
          }
          
          // For other errors, log and return
          const errText = await response.text();
          console.error(`AI API error ${response.status}: ${errText}`);
          return response;
        } catch (networkError) {
          lastError = networkError instanceof Error ? networkError : new Error(String(networkError));
          console.error(`Network error on attempt ${attempt + 1}:`, lastError.message);
        }
      }
      throw lastError || new Error("AI gateway failed after retries");
    }

    // FAQ System Prompt
    const FAQ_SYSTEM_PROMPT = `You are an expert FAQ generator for dental pages in the UAE. Generate FAQs that:

=== STYLE: GOOGLE "PEOPLE ALSO ASK" ===
- Questions should mirror actual search queries people type into Google
- Focus on practical, actionable questions patients actually ask
- Include question variations: "How much does...", "What is...", "Where can I...", "Is it safe to...", "How long does..."
- Prioritize high search-volume question patterns

=== UNIQUENESS REQUIREMENTS (CRITICAL) ===
- Each FAQ set MUST be completely unique - no duplicate questions across pages
- Questions must include location/service-specific context (Dubai, Abu Dhabi, Sharjah, etc.)
- Never use generic questions that could apply to any page
- Customize every answer with specific details about the location or service
- Reference AED pricing, DHA/DOH/MOHAP licensing when relevant

=== CONTENT QUALITY ===
- Answers should be 40-80 words - comprehensive but scannable
- Use natural language, avoid jargon
- Include helpful details: AED cost ranges, time estimates, what to expect
- Be accurate and trustworthy (UAE dental context)
- No promotional language or exaggeration

=== LOCAL SEO OPTIMIZATION (UAE) ===
- Include city/emirate names in questions naturally
- Reference local context (neighborhoods, emirates, healthcare authorities)
- Mention UAE insurance considerations (Daman, AXA, Cigna, MetLife)
- Add regional context when appropriate

=== QUESTION CATEGORIES TO INCLUDE ===
1. Cost/pricing questions (in AED)
2. Process/procedure questions  
3. Timing/duration questions
4. Qualification/eligibility questions
5. Comparison questions (vs alternatives)
6. Safety/risk questions
7. Recovery/aftercare questions
8. Insurance/payment questions

IMPORTANT: Return your response as a valid JSON array of objects with "question" and "answer" keys. Example:
[{"question": "How much does teeth whitening cost in Dubai?", "answer": "Teeth whitening in Dubai typically costs between AED 500 and AED 2,000..."}]

Return ONLY the JSON array, no other text.`;

    // Generate uniqueness seed
    function generateFAQUniqueSeed(slug: string): string {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      
      const questionStyles = [
        "Focus on 'How' and 'What' questions primarily",
        "Lead with cost and pricing questions in AED",
        "Start with patient experience questions",
        "Emphasize safety and recovery questions",
        "Begin with eligibility and qualification questions",
        "Focus on comparison and alternatives questions",
        "Lead with timeline and process questions",
        "Start with insurance and payment questions"
      ];
      
      const answerStyles = [
        "Use conversational, friendly tone throughout",
        "Include specific AED numbers and ranges where possible",
        "Start answers with direct statements, then elaborate",
        "Use 'you' and 'your' to address the reader directly",
        "Include practical tips in each answer",
        "Reference UAE local context in most answers",
        "Use reassuring language about safety and DHA licensing",
        "Mention cost-saving options where relevant"
      ];
      
      const selectedQuestion = questionStyles[timestamp % questionStyles.length];
      const selectedAnswer = answerStyles[(timestamp + 3) % answerStyles.length];
      
      return `
UNIQUENESS DIRECTIVE (ID: ${randomId}):
- QUESTION STYLE: ${selectedQuestion}
- ANSWER STYLE: ${selectedAnswer}
- Each question MUST include the specific city/emirate/service name`;
    }

    // Parse page context from slug and data
    function getPageContext(pageData: any): string {
      const { page_type, slug, title, content } = pageData;
      const parts = slug.split("/").filter(Boolean);
      
      let context = "";
      
      switch (page_type) {
        case "state":
          const stateName = title || parts[0]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "this emirate";
          context = `EMIRATE DIRECTORY PAGE: ${stateName}
Focus FAQs on:
- Finding dentists across ${stateName}
- DHA/DOH/MOHAP licensing in ${stateName}
- Dental costs in AED specific to ${stateName}
- Insurance acceptance in ${stateName}
- General dental care access in ${stateName}`;
          break;
          
        case "city":
          const cityName = title || parts[1]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "this city";
          const emirateName = parts[0]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
          context = `CITY/AREA DIRECTORY PAGE: ${cityName}, ${emirateName}
Focus FAQs on:
- Finding local dentists in ${cityName}
- Dental costs in AED specific to ${cityName}
- Emergency dental care availability in ${cityName}
- Insurance acceptance in the area
- What to expect at ${cityName} dental offices
- Pediatric and family dentistry options in ${cityName}`;
          break;
          
        case "service_location":
        case "city_treatment":
          const treatmentName = parts[parts.length - 1]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "dental treatment";
          const locationCity = parts[1]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "this city";
          const locationEmirate = parts[0]?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
          context = `SERVICE + LOCATION PAGE: ${treatmentName} in ${locationCity}, ${locationEmirate}
Focus FAQs on:
- ${treatmentName} costs in AED in ${locationCity}
- How ${treatmentName} works and what to expect
- Finding ${treatmentName} specialists in ${locationCity}
- Recovery and aftercare for ${treatmentName}
- Insurance coverage for ${treatmentName}
- ${treatmentName} alternatives available in ${locationCity}
- Duration and number of visits for ${treatmentName}`;
          break;
          
        case "treatment":
        case "service":
          const serviceName = title || slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          context = `SERVICE PAGE: ${serviceName} in UAE
Focus FAQs on:
- What ${serviceName} involves in UAE clinics
- Who needs ${serviceName}
- ${serviceName} costs in AED and financing
- ${serviceName} process and timeline
- ${serviceName} recovery and results
- Alternatives to ${serviceName}
- Insurance and payment for ${serviceName} in UAE`;
          break;
          
        default:
          context = `PAGE: ${title || slug}
Generate relevant dental FAQs for this page with UAE context.`;
      }
      
      return context;
    }

    // Generate FAQs for a page - uses standard JSON response (no tool_choice)
    async function generateFAQs(pageData: any, faqCount: number = 10): Promise<Array<{ question: string; answer: string }>> {
      const pageContext = getPageContext(pageData);
      const uniqueSeed = generateFAQUniqueSeed(pageData.slug);
      
      const userPrompt = `Generate exactly ${faqCount} unique FAQs for this dental page:

${pageContext}

PAGE URL: /${pageData.slug}
PAGE TYPE: ${pageData.page_type}

${pageData.content ? `EXISTING CONTENT (for context):
${pageData.content.slice(0, 800)}...` : ""}

${uniqueSeed}

Generate ${faqCount} FAQs as a JSON array. Each FAQ must:
1. Be unique to this specific page (include the specific location/service name)
2. Be written in "People Also Ask" style (real Google search queries)
3. Have comprehensive but scannable answers (40-80 words)
4. Be locally relevant with UAE-specific details and AED pricing

Return ONLY a valid JSON array like: [{"question":"...","answer":"..."},...]`;

      const requestBody = {
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: FAQ_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      };

      const response = await callAIWithRetry(requestBody);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`AI response error: ${response.status} - ${errText}`);
        if (response.status === 429) throw new Error("Rate limit exceeded - please try again in a moment");
        if (response.status === 402) throw new Error("AI credits exhausted");
        throw new Error(`AI service error (${response.status}): ${errText.slice(0, 200)}`);
      }

      const aiJson = await response.json();
      
      // Extract content from standard chat completion response
      const content = aiJson.choices?.[0]?.message?.content;
      if (!content) {
        console.error("No content in AI response:", JSON.stringify(aiJson).slice(0, 500));
        throw new Error("AI returned empty response");
      }

      // Parse JSON from the response text
      try {
        // Clean markdown fences if present
        let cleaned = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();

        // Find JSON array boundaries
        const arrStart = cleaned.indexOf('[');
        const arrEnd = cleaned.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          cleaned = cleaned.slice(arrStart, arrEnd + 1);
        }

        // Fix common JSON issues
        cleaned = cleaned
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/[\x00-\x1F\x7F]/g, '');

        const parsed = JSON.parse(cleaned);
        
        if (!Array.isArray(parsed)) {
          throw new Error("Response is not an array");
        }

        // Validate structure
        const validFaqs = parsed
          .filter((item: any) => item && typeof item.question === 'string' && typeof item.answer === 'string')
          .map((item: any) => ({ question: item.question.trim(), answer: item.answer.trim() }));

        if (validFaqs.length === 0) {
          throw new Error("No valid FAQs in response");
        }

        console.log(`Generated ${validFaqs.length} FAQs for ${pageData.slug}`);
        return validFaqs;
      } catch (parseErr) {
        console.error("Failed to parse FAQ response:", content.slice(0, 500));
        throw new Error(`Failed to parse AI response: ${parseErr instanceof Error ? parseErr.message : 'Invalid JSON'}`);
      }
    }

    // Check FAQ uniqueness against other pages
    async function checkFAQUniqueness(
      faqs: Array<{ question: string; answer: string }>,
      pageId: string,
      pageType: string
    ): Promise<{
      isUnique: boolean;
      duplicateCount: number;
      duplicateQuestions: string[];
    }> {
      const { data: candidates } = await supabaseAdmin
        .from('seo_pages')
        .select('id, slug, faqs')
        .eq('page_type', pageType)
        .neq('id', pageId)
        .not('faqs', 'is', null)
        .limit(50);
      
      const existingQuestions = new Set<string>();
      
      for (const candidate of candidates || []) {
        if (!candidate.faqs || !Array.isArray(candidate.faqs)) continue;
        for (const faqItem of candidate.faqs) {
          if (faqItem?.question) {
            const normalized = faqItem.question.toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .split(/\s+/)
              .filter((w: string) => w.length > 3)
              .join(' ');
            existingQuestions.add(normalized);
          }
        }
      }
      
      const duplicateQuestions: string[] = [];
      
      for (const faq of faqs) {
        const normalizedNew = faq.question.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3)
          .join(' ');
        
        for (const existing of existingQuestions) {
          const words1 = new Set(normalizedNew.split(' '));
          const words2 = new Set(existing.split(' '));
          const intersection = [...words1].filter(w => words2.has(w)).length;
          const union = new Set([...words1, ...words2]).size;
          const similarity = intersection / union;
          
          if (similarity > 0.7) {
            duplicateQuestions.push(faq.question);
            break;
          }
        }
      }
      
      return {
        isUnique: duplicateQuestions.length === 0,
        duplicateCount: duplicateQuestions.length,
        duplicateQuestions
      };
    }

    // Audit FAQs across pages
    async function auditFAQs(pageType?: string): Promise<{
      totalPages: number;
      pagesWithFAQs: number;
      pagesWithoutFAQs: number;
      avgFAQCount: number;
      duplicateIssues: number;
    }> {
      let query = supabaseAdmin.from('seo_pages').select('id, slug, page_type, faqs');
      if (pageType) query = query.eq('page_type', pageType);
      const { data: pages } = await query.limit(1000);
      
      const pagesWithFAQs = (pages || []).filter(p => p.faqs && Array.isArray(p.faqs) && p.faqs.length > 0);
      const pagesWithoutFAQs = (pages || []).filter(p => !p.faqs || !Array.isArray(p.faqs) || p.faqs.length === 0);
      
      let totalFAQCount = 0;
      const allQuestions: Map<string, string[]> = new Map();
      
      for (const page of pagesWithFAQs) {
        if (page.faqs && Array.isArray(page.faqs)) {
          totalFAQCount += page.faqs.length;
          for (const faqItem of page.faqs) {
            if (faqItem?.question) {
              const normalized = faqItem.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
              if (!allQuestions.has(normalized)) allQuestions.set(normalized, []);
              allQuestions.get(normalized)!.push(page.slug);
            }
          }
        }
      }
      
      const duplicateIssues = [...allQuestions.values()].filter(slugs => slugs.length > 1).length;
      
      return {
        totalPages: (pages || []).length,
        pagesWithFAQs: pagesWithFAQs.length,
        pagesWithoutFAQs: pagesWithoutFAQs.length,
        avgFAQCount: pagesWithFAQs.length > 0 ? Math.round(totalFAQCount / pagesWithFAQs.length) : 0,
        duplicateIssues
      };
    }

    // Handle actions
    switch (action) {
      case "generate_faqs": {
        if (!page_id) {
          return new Response(JSON.stringify({ success: false, error: "page_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: pageData, error: pageError } = await supabaseAdmin
          .from('seo_pages').select('*').eq('id', page_id).single();

        if (pageError || !pageData) {
          return new Response(JSON.stringify({ success: false, error: "Page not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const faqCount = config?.faq_count || 10;
        const generatedFAQs = await generateFAQs(pageData, faqCount);
        const uniquenessCheck = await checkFAQUniqueness(generatedFAQs, page_id, pageData.page_type);
        
        // Save FAQs - STRICT SEPARATION
        const updateData: Record<string, any> = {
          faqs: generatedFAQs,
          last_faq_edit_source: 'faq_studio',
          updated_at: now
        };
        
        const validation = validateFAQStudioWrite(Object.keys(updateData));
        if (!validation.valid) {
          for (const blocked of validation.blockedFields) delete updateData[blocked];
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('seo_pages').update(updateData).eq('id', page_id);

        if (updateError) throw updateError;

        // Save version history
        try {
          const { data: currentVersion } = await supabaseAdmin
            .from('seo_content_versions')
            .select('version_number')
            .eq('seo_page_id', page_id)
            .order('version_number', { ascending: false })
            .limit(1)
            .single();

          await supabaseAdmin.from('seo_content_versions').insert({
            seo_page_id: page_id,
            version_number: (currentVersion?.version_number || 0) + 1,
            content: JSON.stringify({ faqs: generatedFAQs }),
            change_source: 'faq_studio',
            change_reason: `Generated ${generatedFAQs.length} FAQs`,
            is_current: true,
            created_at: now
          });
        } catch (versionErr) {
          console.log("Version history save skipped:", versionErr);
        }

        return new Response(JSON.stringify({
          success: true,
          faq_count: generatedFAQs.length,
          faqs: generatedFAQs,
          uniqueness: uniquenessCheck,
          page_slug: pageData.slug
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "preview_faqs": {
        if (!page_id) {
          return new Response(JSON.stringify({ success: false, error: "page_id required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: pageData, error: pageError } = await supabaseAdmin
          .from('seo_pages').select('*').eq('id', page_id).single();

        if (pageError || !pageData) {
          return new Response(JSON.stringify({ success: false, error: "Page not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const faqCount = config?.faq_count || 10;
        const generatedFAQs = await generateFAQs(pageData, faqCount);
        const uniquenessCheck = await checkFAQUniqueness(generatedFAQs, page_id, pageData.page_type);

        return new Response(JSON.stringify({
          success: true,
          preview: true,
          faq_count: generatedFAQs.length,
          faqs: generatedFAQs,
          uniqueness: uniquenessCheck,
          page: {
            id: pageData.id,
            slug: pageData.slug,
            title: pageData.title,
            page_type: pageData.page_type,
            existing_faqs: pageData.faqs
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "apply_faqs": {
        if (!page_id || !faqs) {
          return new Response(JSON.stringify({ success: false, error: "page_id and faqs required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: updateError } = await supabaseAdmin
          .from('seo_pages')
          .update({ faqs, updated_at: now })
          .eq('id', page_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          success: true,
          message: `Applied ${faqs.length} FAQs to page`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "audit_faqs": {
        const pageType = config?.faq_count ? undefined : body.page_id;
        const auditResults = await auditFAQs(pageType as string | undefined);

        return new Response(JSON.stringify({
          success: true,
          audit: auditResults
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("faq-generation-studio error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
