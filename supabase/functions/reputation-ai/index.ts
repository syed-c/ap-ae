import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ActionType =
  | "analyze_sentiment"
  | "bulk_sentiment"
  | "risk_analysis"
  | "trend_analysis"
  | "overview_insights"
  | "test_connection";

interface RequestBody {
  action: ActionType;
  review_id?: string;
  review_type?: "google" | "internal";
  content?: string;
  clinic_id?: string;
  reviews_data?: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AIMLAPI_KEY = Deno.env.get("AIMLAPI_KEY");
    if (!AIMLAPI_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AIMLAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    const { action } = body;

    // ─── TEST CONNECTION ───
    if (action === "test_connection") {
      const resp = await fetch("https://api.aimlapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [{ role: "user", content: "Respond with exactly: OK" }],
          max_tokens: 5,
        }),
      });

      if (resp.ok) {
        return jsonResponse({ success: true, status: "connected", message: "Gemini AI (via AIMLAPI) is operational" });
      } else if (resp.status === 429) {
        return jsonResponse({ success: false, error: "Rate limited. Try again later." }, 429);
      } else if (resp.status === 402) {
        return jsonResponse({ success: false, error: "Credits exhausted. Please top up." }, 402);
      } else {
        const errText = await resp.text();
        return jsonResponse({ success: false, error: `AI gateway error: ${resp.status} - ${errText}` }, 500);
      }
    }

    // ─── ANALYZE SINGLE REVIEW SENTIMENT ───
    if (action === "analyze_sentiment") {
      const { review_id, review_type, content } = body;
      if (!review_id || !review_type || !content) {
        return jsonResponse({ success: false, error: "review_id, review_type, and content required" }, 400);
      }

      const analysis = await callGemini(AIMLAPI_KEY, {
        tools: [{
          type: "function",
          function: {
            name: "analyze_review",
            description: "Analyze dental review sentiment, HIPAA compliance, and provide recommendations",
            parameters: {
              type: "object",
              properties: {
                sentiment_score: { type: "number", description: "Score from -1 (very negative) to 1 (very positive)" },
                sentiment_label: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                hipaa_flagged: { type: "boolean", description: "True if review contains Protected Health Information" },
                hipaa_flag_reason: { type: "string", description: "Reason for HIPAA flag, null if not flagged" },
                key_themes: { type: "array", items: { type: "string" }, description: "Main topics/themes in the review" },
                urgency: { type: "string", enum: ["low", "medium", "high", "critical"], description: "How urgently this review needs attention" },
                recommended_action: { type: "string", description: "What the clinic should do about this review" },
              },
              required: ["sentiment_score", "sentiment_label", "hipaa_flagged", "key_themes", "urgency", "recommended_action"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_review" } },
        messages: [
          {
            role: "system",
            content: `You are a dental practice review analyst. Analyze reviews for sentiment, HIPAA concerns, themes, urgency, and provide actionable recommendations. Be precise and practical.`,
          },
          {
            role: "user",
            content: `Analyze this dental practice review:\n\n"${content}"`,
          },
        ],
      });

      // Update review in DB
      const table = review_type === "internal" ? "internal_reviews" : "google_reviews";
      await supabase.from(table).update({
        sentiment_score: analysis.sentiment_score,
        sentiment_label: analysis.sentiment_label,
        hipaa_flagged: analysis.hipaa_flagged,
        hipaa_flag_reason: analysis.hipaa_flag_reason || null,
      }).eq("id", review_id);

      // Log HIPAA flags
      if (analysis.hipaa_flagged) {
        const { data: review } = await supabase.from(table).select("clinic_id").eq("id", review_id).single();
        if (review?.clinic_id) {
          await supabase.from("hipaa_audit_log").insert({
            clinic_id: review.clinic_id,
            action: "review_hipaa_flagged",
            resource_type: "review",
            resource_id: review_id,
            details: { review_type, flag_reason: analysis.hipaa_flag_reason },
            risk_level: "medium",
          });
        }
      }

      // Log AI event
      await supabase.from("ai_events").insert({
        event_type: "sentiment_analysis",
        module: "reputation",
        status: "completed",
        confidence_score: Math.abs(analysis.sentiment_score),
        triggered_by: "user",
        clinic_id: body.clinic_id || null,
      });

      return jsonResponse({ success: true, analysis });
    }

    // ─── BULK SENTIMENT ANALYSIS ───
    if (action === "bulk_sentiment") {
      const { clinic_id } = body;

      // Fetch unanalyzed reviews
      let googleQuery = supabase
        .from("google_reviews")
        .select("id, text_content, rating")
        .is("sentiment_label", null)
        .not("text_content", "is", null)
        .limit(20);
      if (clinic_id) googleQuery = googleQuery.eq("clinic_id", clinic_id);

      let internalQuery = supabase
        .from("internal_reviews")
        .select("id, comment, rating")
        .is("sentiment_label", null)
        .not("comment", "is", null)
        .limit(20);
      if (clinic_id) internalQuery = internalQuery.eq("clinic_id", clinic_id);

      const [{ data: gReviews }, { data: iReviews }] = await Promise.all([googleQuery, internalQuery]);
      const allUnanalyzed = [
        ...(gReviews || []).map((r: any) => ({ ...r, type: "google", content: r.text_content })),
        ...(iReviews || []).map((r: any) => ({ ...r, type: "internal", content: r.comment })),
      ];

      if (allUnanalyzed.length === 0) {
        return jsonResponse({ success: true, analyzed: 0, message: "All reviews already analyzed" });
      }

      // Batch analyze (up to 10 at a time to avoid rate limits)
      const batch = allUnanalyzed.slice(0, 10);
      let analyzed = 0;

      for (const review of batch) {
        try {
          const result = await callGemini(AIMLAPI_KEY, {
            tools: [{
              type: "function",
              function: {
                name: "analyze_review",
                description: "Analyze review sentiment",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment_score: { type: "number" },
                    sentiment_label: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                    hipaa_flagged: { type: "boolean" },
                    hipaa_flag_reason: { type: "string" },
                  },
                  required: ["sentiment_score", "sentiment_label", "hipaa_flagged"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "analyze_review" } },
            messages: [
              { role: "system", content: "Analyze this dental review for sentiment and HIPAA concerns. Be concise." },
              { role: "user", content: `Review: "${review.content}"` },
            ],
          });

          const table = review.type === "internal" ? "internal_reviews" : "google_reviews";
          await supabase.from(table).update({
            sentiment_score: result.sentiment_score,
            sentiment_label: result.sentiment_label,
            hipaa_flagged: result.hipaa_flagged,
            hipaa_flag_reason: result.hipaa_flag_reason || null,
          }).eq("id", review.id);

          analyzed++;
        } catch (e) {
          console.error(`Failed to analyze review ${review.id}:`, e);
        }
      }

      // Log bulk event
      await supabase.from("ai_events").insert({
        event_type: "bulk_sentiment_analysis",
        module: "reputation",
        status: "completed",
        triggered_by: "user",
        clinic_id: clinic_id || null,
      });

      return jsonResponse({
        success: true,
        analyzed,
        remaining: allUnanalyzed.length - analyzed,
        message: `Analyzed ${analyzed} reviews. ${allUnanalyzed.length - analyzed} remaining.`,
      });
    }

    // ─── AI RISK ANALYSIS ───
    if (action === "risk_analysis") {
      const { reviews_data } = body;
      if (!reviews_data || reviews_data.length === 0) {
        return jsonResponse({ success: false, error: "reviews_data required" }, 400);
      }

      const summary = JSON.stringify(reviews_data).slice(0, 3000);

      const analysis = await callGemini(AIMLAPI_KEY, {
        tools: [{
          type: "function",
          function: {
            name: "assess_risk",
            description: "Assess reputation risk for a dental practice based on review data",
            parameters: {
              type: "object",
              properties: {
                overall_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
                risk_score: { type: "number", description: "0-100 risk score" },
                risk_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string" },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      description: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["factor", "severity", "description", "recommendation"],
                  },
                },
                immediate_actions: { type: "array", items: { type: "string" } },
                positive_signals: { type: "array", items: { type: "string" } },
              },
              required: ["overall_risk", "risk_score", "risk_factors", "immediate_actions", "positive_signals"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "assess_risk" } },
        messages: [
          {
            role: "system",
            content: `You are a dental practice reputation risk analyst. Analyze review data to identify risks, threats, and provide actionable recommendations. Consider rating trends, reply rates, sentiment patterns, review velocity, and potential HIPAA concerns.`,
          },
          {
            role: "user",
            content: `Analyze this reputation data for risk assessment:\n${summary}`,
          },
        ],
      });

      await supabase.from("ai_events").insert({
        event_type: "risk_analysis",
        module: "reputation",
        status: "completed",
        triggered_by: "user",
        clinic_id: body.clinic_id || null,
      });

      return jsonResponse({ success: true, analysis });
    }

    // ─── TREND ANALYSIS ───
    if (action === "trend_analysis") {
      const { reviews_data } = body;
      if (!reviews_data || reviews_data.length === 0) {
        return jsonResponse({ success: false, error: "reviews_data required" }, 400);
      }

      const summary = JSON.stringify(reviews_data).slice(0, 3000);

      const analysis = await callGemini(AIMLAPI_KEY, {
        tools: [{
          type: "function",
          function: {
            name: "analyze_trends",
            description: "Analyze review trends for a dental practice",
            parameters: {
              type: "object",
              properties: {
                overall_trajectory: { type: "string", enum: ["improving", "stable", "declining"] },
                rating_trend: { type: "string", description: "Description of rating trend" },
                volume_trend: { type: "string", description: "Description of review volume trend" },
                sentiment_trend: { type: "string", description: "Description of sentiment changes" },
                emerging_themes: { type: "array", items: { type: "string" }, description: "New themes appearing in recent reviews" },
                declining_themes: { type: "array", items: { type: "string" }, description: "Themes becoming less common" },
                predictions: { type: "array", items: { type: "string" }, description: "Predictions for next 30 days" },
                strategic_recommendations: { type: "array", items: { type: "string" }, description: "Strategic actions to improve reputation" },
              },
              required: ["overall_trajectory", "rating_trend", "volume_trend", "sentiment_trend", "emerging_themes", "predictions", "strategic_recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_trends" } },
        messages: [
          {
            role: "system",
            content: `You are a dental practice reputation trends analyst. Analyze historical review data to identify patterns, predict future trends, and recommend strategic actions.`,
          },
          {
            role: "user",
            content: `Analyze trends in this review data:\n${summary}`,
          },
        ],
      });

      await supabase.from("ai_events").insert({
        event_type: "trend_analysis",
        module: "reputation",
        status: "completed",
        triggered_by: "user",
        clinic_id: body.clinic_id || null,
      });

      return jsonResponse({ success: true, analysis });
    }

    // ─── OVERVIEW INSIGHTS ───
    if (action === "overview_insights") {
      const { reviews_data } = body;
      if (!reviews_data) {
        return jsonResponse({ success: false, error: "reviews_data required" }, 400);
      }

      const summary = JSON.stringify(reviews_data).slice(0, 3000);

      const analysis = await callGemini(AIMLAPI_KEY, {
        tools: [{
          type: "function",
          function: {
            name: "generate_insights",
            description: "Generate executive insights for dental practice reputation",
            parameters: {
              type: "object",
              properties: {
                executive_summary: { type: "string", description: "2-3 sentence executive summary" },
                health_grade: { type: "string", enum: ["A+", "A", "B+", "B", "C+", "C", "D", "F"] },
                top_strengths: { type: "array", items: { type: "string" }, description: "Top 3 reputation strengths" },
                top_concerns: { type: "array", items: { type: "string" }, description: "Top 3 concerns to address" },
                quick_wins: { type: "array", items: { type: "string" }, description: "3 easy actions to improve reputation" },
                competitor_positioning: { type: "string", description: "How this practice likely compares to competitors" },
              },
              required: ["executive_summary", "health_grade", "top_strengths", "top_concerns", "quick_wins"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
        messages: [
          {
            role: "system",
            content: `You are a dental practice reputation consultant. Generate executive-level insights from review and reputation data. Be concise, actionable, and strategic.`,
          },
          {
            role: "user",
            content: `Generate reputation insights from this data:\n${summary}`,
          },
        ],
      });

      return jsonResponse({ success: true, insights: analysis });
    }

    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);

  } catch (error) {
    console.error("reputation-ai error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helpers ───

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(apiKey: string, payload: any): Promise<any> {
  const resp = await fetch("https://api.aimlapi.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      temperature: 0.3,
      max_tokens: 1000,
      ...payload,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    if (resp.status === 429) throw new Error("Rate limits exceeded. Please try again later.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits.");
    throw new Error(`AI gateway error: ${resp.status} - ${errText}`);
  }

  const json = await resp.json();

  // Extract tool call result
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  // Fallback: try to parse content as JSON
  const content = json.choices?.[0]?.message?.content?.trim();
  if (content) {
    try {
      const match = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
      return JSON.parse(match[1] || content);
    } catch {
      return { raw_response: content };
    }
  }

  throw new Error("No response from AI");
}
