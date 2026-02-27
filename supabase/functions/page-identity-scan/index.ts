import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  action:
    | "run_identity_scan"
    | "get_identity_report"
    | "repair_page"
    | "check_publish_gate"
    | "get_quality_report"
    | "analyze_ai_sounding"
    | "find_boilerplate_clusters"
    | "update_index_worthiness"
    | "run_quality_audit";
  page_type?: string;
  page_id?: string;
  content?: string;
  limit?: number;
  offset?: number;
}

// ── Similarity helpers ──────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 3);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared++;
  const union = setA.size + setB.size - shared;
  return union > 0 ? shared / union : 0;
}

function ngramSimilarity(a: string, b: string, n = 3): number {
  if (!a || !b) return 0;
  const ngrams = (t: string) => {
    const words = t.toLowerCase().split(/\s+/);
    const grams = new Set<string>();
    for (let i = 0; i <= words.length - n; i++) {
      grams.add(words.slice(i, i + n).join(" "));
    }
    return grams;
  };
  const ga = ngrams(a);
  const gb = ngrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let shared = 0;
  for (const g of ga) if (gb.has(g)) shared++;
  const union = ga.size + gb.size - shared;
  return union > 0 ? shared / union : 0;
}

function extractStructure(content: string): string {
  if (!content) return "";
  const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>|#{1,6}\s.+/gi) || [];
  return headings.map(h => h.replace(/<[^>]+>/g, "").trim().toLowerCase()).join("|");
}

function simpleHash(text: string): string {
  let hash = 0;
  const n = text.toLowerCase().replace(/\s+/g, " ").trim();
  for (let i = 0; i < n.length; i++) {
    hash = ((hash << 5) - hash) + n.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(16);
}

function metaFingerprint(title: string | null, desc: string | null, h1: string | null): string {
  return simpleHash(`${(title || "").toLowerCase()}|${(desc || "").toLowerCase()}|${(h1 || "").toLowerCase()}`);
}

// Detect AI-sounding patterns (0-100)
function detectAISounding(content: string): { score: number; flags: string[] } {
  if (!content) return { score: 0, flags: [] };
  const flags: string[] = [];
  let score = 0;
  const lower = content.toLowerCase();

  const roboticPhrases = [
    "in conclusion", "furthermore", "moreover", "it is important to note",
    "it is worth mentioning", "it should be noted", "in summary",
    "last but not least", "without further ado", "at the end of the day",
    "in this regard", "having said that", "needless to say",
    "as a matter of fact", "it goes without saying", "all things considered",
  ];
  const roboticCount = roboticPhrases.filter(p => lower.includes(p)).length;
  if (roboticCount >= 3) { score += 25; flags.push(`${roboticCount} robotic transition phrases`); }
  else if (roboticCount >= 1) { score += 10; flags.push(`${roboticCount} robotic transition phrase(s)`); }

  const fillerPhrases = [
    "plays a crucial role", "is essential for", "when it comes to",
    "in today's world", "whether you are", "look no further",
    "stands out as", "offers a wide range", "is designed to",
    "take the first step", "embark on your journey", "comprehensive guide",
  ];
  const fillerCount = fillerPhrases.filter(p => lower.includes(p)).length;
  if (fillerCount >= 3) { score += 25; flags.push(`${fillerCount} generic filler phrases`); }
  else if (fillerCount >= 1) { score += 10; flags.push(`${fillerCount} filler phrase(s)`); }

  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const starters = sentences.map(s => s.split(/\s+/).slice(0, 3).join(" ").toLowerCase());
  const starterCounts = new Map<string, number>();
  starters.forEach(s => starterCounts.set(s, (starterCounts.get(s) || 0) + 1));
  const maxRepeat = Math.max(0, ...starterCounts.values());
  if (maxRepeat >= 4) { score += 20; flags.push("Highly repetitive sentence starters"); }
  else if (maxRepeat >= 3) { score += 10; flags.push("Some repetitive sentence starters"); }

  const words = tokenize(content);
  const wordFreq = new Map<string, number>();
  words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
  const topFreq = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgFreq = topFreq.reduce((s, [, c]) => s + c, 0) / Math.max(topFreq.length, 1);
  if (avgFreq > words.length * 0.05) { score += 15; flags.push("Potential keyword stacking"); }

  const hasNumbers = /\d{2,}/.test(content);
  const hasNames = /Dr\.|clinic|center|hospital/i.test(content);
  if (!hasNumbers && !hasNames && words.length > 200) { score += 10; flags.push("No specific data or names"); }

  return { score: Math.min(score, 100), flags };
}

function calculatePageValue(
  content: string | null,
  wordCount: number,
  _pageType: string,
  _metaTitle: string | null,
  _slug: string
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  if (!content) return { score: 0, breakdown: { content: 0 } };
  const lower = content.toLowerCase();

  let usefulness = 0;
  if (wordCount >= 800) usefulness += 10;
  else if (wordCount >= 400) usefulness += 5;
  if (/<h2|## /gi.test(content)) usefulness += 5;
  if (/\bfaq|question|how\b/i.test(content)) usefulness += 5;
  if (/\bcost|price|aed|dirham\b/i.test(content)) usefulness += 5;
  breakdown.usefulness = usefulness;

  let specificity = 0;
  if (/\d{2,}/.test(content)) specificity += 8;
  if (/dha|mohap|license/i.test(content)) specificity += 7;
  if (/dr\.|dentist|specialist/i.test(content)) specificity += 5;
  const uniqueWords = new Set(tokenize(content));
  if (uniqueWords.size > 150) specificity += 5;
  breakdown.specificity = specificity;

  let localRelevance = 0;
  const uaeTerms = ["dubai", "abu dhabi", "sharjah", "ajman", "fujairah", "ras al", "umm al", "uae", "emirates", "emirate"];
  const localHits = uaeTerms.filter(t => lower.includes(t)).length;
  localRelevance += Math.min(localHits * 3, 12);
  if (/neighborhood|community|area|district|residents/i.test(lower)) localRelevance += 8;
  if (/nearby|walking distance|accessible|metro/i.test(lower)) localRelevance += 5;
  breakdown.localRelevance = localRelevance;

  let decisionSupport = 0;
  if (/choose|compare|consider|look for|what to expect/i.test(lower)) decisionSupport += 8;
  if (/before|after|procedure|treatment plan/i.test(lower)) decisionSupport += 7;
  if (/insurance|coverage|payment/i.test(lower)) decisionSupport += 5;
  if (/review|rating|experience/i.test(lower)) decisionSupport += 5;
  breakdown.decisionSupport = decisionSupport;

  const total = usefulness + specificity + localRelevance + decisionSupport;
  return { score: Math.min(total, 100), breakdown };
}

function calculateLocalAuthenticity(content: string | null): { score: number; details: string[] } {
  if (!content) return { score: 0, details: ["No content"] };
  const lower = content.toLowerCase();
  const details: string[] = [];
  let score = 0;

  const neighborhoods = [
    "jumeirah", "deira", "bur dubai", "marina", "jlt", "downtown",
    "silicon oasis", "sports city", "motor city", "khalifa city",
    "al reem", "al ain", "mirdif", "al barsha", "karama",
    "discovery gardens", "jvc", "business bay", "yas island",
  ];
  const found = neighborhoods.filter(n => lower.includes(n));
  if (found.length >= 3) { score += 25; details.push(`${found.length} neighborhoods mentioned`); }
  else if (found.length >= 1) { score += 12; details.push(`${found.length} neighborhood(s) mentioned`); }

  if (/dha|mohap|health authority/i.test(lower)) { score += 20; details.push("Regulatory context present"); }
  if (/license|certified|registered/i.test(lower)) { score += 10; details.push("Licensing references"); }
  if (/parking|metro|bus|taxi|location|directions/i.test(lower)) { score += 15; details.push("Practical visiting guidance"); }
  if (/weekend|evening|emergency|walk-in/i.test(lower)) { score += 10; details.push("Availability guidance"); }
  if (/aed|dirham|fils/i.test(lower)) { score += 10; details.push("Local currency references"); }
  if (/expat|resident|tourist|visitor/i.test(lower)) { score += 10; details.push("Demographic awareness"); }

  return { score: Math.min(score, 100), details };
}

function classifyIntent(pageType: string, _slug: string): string {
  switch (pageType) {
    case "state": case "city": return "discovery_navigation";
    case "service": case "treatment": return "education_decision";
    case "service_location": return "local_decision_support";
    case "clinic": case "dentist": return "trust_comparison";
    case "insurance": return "coverage_guidance";
    case "blog": return "informational_education";
    default: return "general";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const body: ScanRequest = await req.json();

    switch (body.action) {
      // ── FULL IDENTITY SCAN (reduced batch to avoid CPU timeout) ──
      case "run_identity_scan": {
        // Use smaller batches to avoid CPU timeout
        const limit = Math.min(body.limit || 50, 50);
        const offset = body.offset || 0;

        let query = supabase
          .from("seo_pages")
          .select("id, slug, page_type, content, word_count, meta_title, meta_description, h1, title, is_indexed, is_published")
          .order("slug");

        if (body.page_type && body.page_type !== "all") {
          query = query.eq("page_type", body.page_type);
        }

        const { data: pages, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;

        // Also fetch a broader set for comparison (only slugs + content hashes)
        const { data: allPagesForComparison } = await supabase
          .from("seo_pages")
          .select("id, slug, page_type, content, meta_title, meta_description, h1, title, word_count")
          .order("slug")
          .limit(200);

        const allPages = allPagesForComparison || [];
        const scanPages = pages || [];
        console.log(`Scanning ${scanPages.length} pages (comparing against ${allPages.length})...`);

        // Pre-tokenize
        const tokenCache = new Map<string, string[]>();
        const structCache = new Map<string, string>();
        const metaCache = new Map<string, string>();

        for (const p of allPages) {
          tokenCache.set(p.id, tokenize(p.content || ""));
          structCache.set(p.id, extractStructure(p.content || ""));
          metaCache.set(p.id, metaFingerprint(p.meta_title || p.title, p.meta_description, p.h1));
        }

        const results: any[] = [];
        const updates: any[] = [];

        for (const page of scanPages) {
          const tokens = tokenCache.get(page.id) || tokenize(page.content || "");
          const struct = structCache.get(page.id) || extractStructure(page.content || "");
          const metaFp = metaCache.get(page.id) || metaFingerprint(page.meta_title || page.title, page.meta_description, page.h1);
          const wordCount = page.word_count || 0;
          const pageType = page.page_type || "unknown";

          const similarPages: { slug: string; textSim: number; structSim: number; metaSim: boolean; intentOverlap: boolean }[] = [];

          for (const other of allPages) {
            if (other.id === page.id) continue;
            const otherTokens = tokenCache.get(other.id)!;
            const textSim = jaccardSimilarity(tokens, otherTokens);
            if (textSim < 0.4) continue;

            const otherStruct = structCache.get(other.id)!;
            const structSim = struct && otherStruct ? ngramSimilarity(struct, otherStruct, 2) : 0;
            const otherMetaFp = metaCache.get(other.id)!;
            const metaSim = metaFp === otherMetaFp && metaFp !== "0";
            const intentOverlap = classifyIntent(pageType, page.slug) === classifyIntent(other.page_type || "unknown", other.slug)
              && pageType === (other.page_type || "unknown");

            if (textSim >= 0.55 || structSim >= 0.6 || metaSim) {
              similarPages.push({ slug: other.slug, textSim, structSim, metaSim, intentOverlap });
            }
          }

          similarPages.sort((a, b) => b.textSim - a.textSim);

          const maxTextSim = similarPages.length > 0 ? similarPages[0].textSim : 0;
          const { score: aiScore, flags: aiFlags } = detectAISounding(page.content || "");
          const { score: valueScore, breakdown } = calculatePageValue(page.content, wordCount, pageType, page.meta_title, page.slug);
          const { score: localScore, details: localDetails } = calculateLocalAuthenticity(page.content);
          const identityScore = Math.round((1 - maxTextSim) * 100);

          const issues: string[] = [];
          if (maxTextSim >= 0.65) issues.push("Duplicate Content");
          if (similarPages.some(s => s.structSim >= 0.7)) issues.push("Duplicate Structure");
          if (similarPages.some(s => s.metaSim)) issues.push("Duplicate Metadata");
          if (similarPages.some(s => s.intentOverlap && s.textSim >= 0.55)) issues.push("Intent Conflict");
          if (valueScore < 40) issues.push("Thin Value Page");
          if (aiScore >= 60) issues.push("AI-Sounding Content");
          if (localScore < 30 && (pageType === "city" || pageType === "service_location")) issues.push("Low Local Authenticity");

          const isIndexWorthy = valueScore >= 40 && maxTextSim < 0.8 && wordCount >= 200;
          const indexBlockReason = !isIndexWorthy
            ? (valueScore < 40 ? "Low value score" : maxTextSim >= 0.8 ? "Duplicate content" : "Insufficient content")
            : null;

          let rewritePriority = "none";
          if (issues.length >= 3 || valueScore < 30) rewritePriority = "critical";
          else if (issues.length >= 2 || valueScore < 50) rewritePriority = "high";
          else if (issues.length >= 1 || valueScore < 60) rewritePriority = "medium";

          const pageIntent = classifyIntent(pageType, page.slug);

          results.push({
            id: page.id, slug: page.slug, page_type: pageType, word_count: wordCount,
            identity_score: identityScore, page_value_score: valueScore, value_breakdown: breakdown,
            ai_sounding_score: aiScore, ai_flags: aiFlags,
            local_authenticity_score: localScore, local_details: localDetails,
            similar_pages: similarPages.slice(0, 5),
            max_text_similarity: Math.round(maxTextSim * 100),
            issues, is_index_worthy: isIndexWorthy, index_block_reason: indexBlockReason,
            rewrite_priority: rewritePriority, page_intent: pageIntent,
          });

          updates.push({
            id: page.id, identity_score: identityScore, page_value_score: valueScore,
            ai_sounding_score: aiScore, local_authenticity_score: localScore,
            is_index_worthy: isIndexWorthy, index_block_reason: indexBlockReason,
            rewrite_priority: rewritePriority, page_intent_type: pageIntent,
            content_fingerprint: simpleHash(page.content || ""),
            meta_fingerprint: metaFp, structure_fingerprint: simpleHash(struct),
            last_identity_scan_at: new Date().toISOString(),
          });
        }

        // Batch update DB
        for (const upd of updates) {
          const { id, ...fields } = upd;
          await supabase.from("seo_pages").update(fields).eq("id", id);
        }

        // Get total count for pagination
        let countQuery = supabase.from("seo_pages").select("*", { count: "exact", head: true });
        if (body.page_type && body.page_type !== "all") {
          countQuery = countQuery.eq("page_type", body.page_type);
        }
        const { count: totalPages } = await countQuery;

        const summary = {
          total_scanned: results.length,
          total_pages: totalPages || 0,
          offset,
          has_more: offset + limit < (totalPages || 0),
          duplicate_content: results.filter(r => r.issues.includes("Duplicate Content")).length,
          duplicate_structure: results.filter(r => r.issues.includes("Duplicate Structure")).length,
          duplicate_metadata: results.filter(r => r.issues.includes("Duplicate Metadata")).length,
          intent_conflicts: results.filter(r => r.issues.includes("Intent Conflict")).length,
          thin_value: results.filter(r => r.issues.includes("Thin Value Page")).length,
          ai_sounding: results.filter(r => r.issues.includes("AI-Sounding Content")).length,
          not_index_worthy: results.filter(r => !r.is_index_worthy).length,
          avg_identity_score: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.identity_score, 0) / results.length) : 0,
          avg_value_score: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.page_value_score, 0) / results.length) : 0,
          critical_rewrites: results.filter(r => r.rewrite_priority === "critical").length,
          high_rewrites: results.filter(r => r.rewrite_priority === "high").length,
        };

        results.sort((a, b) => {
          const pri = { critical: 0, high: 1, medium: 2, none: 3 };
          return (pri[a.rewrite_priority as keyof typeof pri] ?? 3) - (pri[b.rewrite_priority as keyof typeof pri] ?? 3);
        });

        return new Response(JSON.stringify({ success: true, summary, results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── GET STORED REPORT ──────────────────────────────────────
      case "get_identity_report": {
        const limit = body.limit || 100;
        const offset = body.offset || 0;

        let query = supabase
          .from("seo_pages")
          .select("id, slug, page_type, word_count, identity_score, page_value_score, ai_sounding_score, local_authenticity_score, is_index_worthy, index_block_reason, rewrite_priority, page_intent_type, similarity_score, similar_to_slug, editorial_status, last_identity_scan_at")
          .not("last_identity_scan_at", "is", null)
          .order("identity_score", { ascending: true });

        if (body.page_type && body.page_type !== "all") {
          query = query.eq("page_type", body.page_type);
        }

        const { data, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;

        const { count: totalScanned } = await supabase
          .from("seo_pages").select("*", { count: "exact", head: true }).not("last_identity_scan_at", "is", null);
        const { count: notWorthy } = await supabase
          .from("seo_pages").select("*", { count: "exact", head: true }).eq("is_index_worthy", false);
        const { count: criticalRewrites } = await supabase
          .from("seo_pages").select("*", { count: "exact", head: true }).eq("rewrite_priority", "critical");

        return new Response(JSON.stringify({
          success: true, pages: data || [],
          summary: { total_scanned: totalScanned || 0, not_index_worthy: notWorthy || 0, critical_rewrites: criticalRewrites || 0 },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── PUBLISH GATE ──────────────────────────────────────────
      case "check_publish_gate": {
        if (!body.content) {
          return new Response(JSON.stringify({ error: "content required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const newTokens = tokenize(body.content);
        const threshold = 0.55;

        let query = supabase.from("seo_pages").select("id, slug, content").not("content", "is", null);
        if (body.page_type) query = query.eq("page_type", body.page_type);
        if (body.page_id) query = query.neq("id", body.page_id);

        const { data: candidates } = await query.limit(200);
        const conflicts: { slug: string; similarity: number }[] = [];

        for (const c of candidates || []) {
          const sim = jaccardSimilarity(newTokens, tokenize(c.content || ""));
          if (sim >= threshold) {
            conflicts.push({ slug: c.slug, similarity: Math.round(sim * 100) });
          }
        }

        conflicts.sort((a, b) => b.similarity - a.similarity);
        const canPublish = conflicts.length === 0;

        return new Response(JSON.stringify({
          success: true, can_publish: canPublish, conflicts: conflicts.slice(0, 10),
          message: canPublish ? "Content passes uniqueness check" : `Content too similar to ${conflicts.length} existing page(s)`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── BOILERPLATE CLUSTERS ──────────────────────────────────
      case "find_boilerplate_clusters": {
        const { data: clusterPages } = await supabase
          .from("seo_pages").select("id, slug, page_type, content")
          .not("content", "is", null).order("page_type").limit(body.limit || 200);

        if (!clusterPages || clusterPages.length === 0) {
          return new Response(JSON.stringify({ success: true, clusters: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const paragraphMap = new Map<string, string[]>();
        for (const p of clusterPages) {
          const paragraphs = (p.content || "")
            .split(/\n\n|<\/p>|<br\s*\/?>/i)
            .map((para: string) => para.replace(/<[^>]+>/g, "").trim())
            .filter((para: string) => para.length > 100);

          for (const para of paragraphs) {
            const key = simpleHash(para.substring(0, 200));
            if (!paragraphMap.has(key)) paragraphMap.set(key, []);
            paragraphMap.get(key)!.push(p.slug);
          }
        }

        const clusters: { fingerprint: string; page_count: number; pages: string[] }[] = [];
        for (const [key, slugs] of paragraphMap) {
          const unique = [...new Set(slugs)];
          if (unique.length >= 3) {
            clusters.push({ fingerprint: key, page_count: unique.length, pages: unique.slice(0, 10) });
          }
        }

        clusters.sort((a, b) => b.page_count - a.page_count);

        return new Response(JSON.stringify({
          success: true, total_clusters: clusters.length, clusters: clusters.slice(0, 50),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── QUALITY REPORT (stored data) ──────────────────────────
      case "get_quality_report": {
        const { data } = await supabase
          .from("seo_pages")
          .select("id, slug, page_type, word_count, page_value_score, ai_sounding_score, local_authenticity_score, rewrite_priority, editorial_status, is_index_worthy, identity_score, last_identity_scan_at")
          .not("last_identity_scan_at", "is", null)
          .order("page_value_score", { ascending: true })
          .range(0, (body.limit || 100) - 1);

        return new Response(JSON.stringify({ success: true, pages: data || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── RUN QUALITY AUDIT (scan pages for AI content issues) ──
      case "run_quality_audit": {
        const limit = Math.min(body.limit || 50, 50);
        const offset = body.offset || 0;

        let query = supabase
          .from("seo_pages")
          .select("id, slug, page_type, content, word_count, meta_title, meta_description, h1, title")
          .not("content", "is", null)
          .order("slug");

        if (body.page_type && body.page_type !== "all") {
          query = query.eq("page_type", body.page_type);
        }

        const { data: pages, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;

        const auditResults: any[] = [];

        for (const page of pages || []) {
          const wordCount = page.word_count || 0;
          const pageType = page.page_type || "unknown";
          const { score: aiScore, flags: aiFlags } = detectAISounding(page.content || "");
          const { score: valueScore } = calculatePageValue(page.content, wordCount, pageType, page.meta_title, page.slug);
          const { score: localScore } = calculateLocalAuthenticity(page.content);

          const issues: string[] = [];
          if (aiScore >= 60) issues.push("AI-Sounding Content");
          if (aiScore >= 40 && aiScore < 60) issues.push("Moderate AI Patterns");
          if (valueScore < 40) issues.push("Low Value Content");
          if (wordCount < 300) issues.push("Thin Content");
          if (wordCount < 100) issues.push("Very Thin Content");
          if (localScore < 20 && (pageType === "city" || pageType === "service_location")) issues.push("Missing Local Context");
          if (!page.meta_title && !page.h1) issues.push("Missing Meta Title");
          if (!page.meta_description) issues.push("Missing Meta Description");

          // Update DB with scores
          await supabase.from("seo_pages").update({
            ai_sounding_score: aiScore,
            page_value_score: valueScore,
            local_authenticity_score: localScore,
            last_identity_scan_at: new Date().toISOString(),
            rewrite_priority: issues.length >= 3 ? "critical" : issues.length >= 2 ? "high" : issues.length >= 1 ? "medium" : "none",
          }).eq("id", page.id);

          if (issues.length > 0) {
            auditResults.push({
              id: page.id, slug: page.slug, page_type: pageType, word_count: wordCount,
              ai_sounding_score: aiScore, ai_flags: aiFlags,
              page_value_score: valueScore, local_authenticity_score: localScore,
              issues,
              rewrite_priority: issues.length >= 3 ? "critical" : issues.length >= 2 ? "high" : issues.length >= 1 ? "medium" : "none",
            });
          }
        }

        // Get total for pagination
        let countQuery = supabase.from("seo_pages").select("*", { count: "exact", head: true }).not("content", "is", null);
        if (body.page_type && body.page_type !== "all") {
          countQuery = countQuery.eq("page_type", body.page_type);
        }
        const { count: totalPages } = await countQuery;

        auditResults.sort((a, b) => b.ai_sounding_score - a.ai_sounding_score);

        return new Response(JSON.stringify({
          success: true,
          total_scanned: (pages || []).length,
          total_pages: totalPages || 0,
          has_more: offset + limit < (totalPages || 0),
          issues_found: auditResults.length,
          results: auditResults,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("page-identity-scan error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
