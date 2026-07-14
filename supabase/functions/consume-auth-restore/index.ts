import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentAccessToken = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(currentAccessToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const restoreToken = body?.restoreToken;

    if (typeof restoreToken !== "string" || !restoreToken) {
      return new Response(JSON.stringify({ success: false, error: "restoreToken is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: restoreState, error: restoreError } = await adminClient
      .from("auth_restore_requests")
      .select("token, initiated_by, access_token, refresh_token, flow, expires_at")
      .eq("token", restoreToken)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (restoreError) {
      console.error("Failed to load auth restore state:", restoreError);
      throw new Error(restoreError.message);
    }

    if (!restoreState) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or expired restore token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const consumedBy = claimsData.claims.sub as string;
    const { error: updateError } = await adminClient
      .from("auth_restore_requests")
      .update({
        consumed_at: new Date().toISOString(),
        consumed_by: consumedBy,
      })
      .eq("token", restoreToken)
      .is("consumed_at", null);

    if (updateError) {
      console.error("Failed to consume auth restore state:", updateError);
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: restoreState.access_token,
        refreshToken: restoreState.refresh_token,
        userId: restoreState.initiated_by,
        flow: restoreState.flow,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("consume-auth-restore error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
