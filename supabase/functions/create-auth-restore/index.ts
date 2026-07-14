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

    const accessTokenFromHeader = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(accessTokenFromHeader);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const accessToken = body?.accessToken;
    const refreshToken = body?.refreshToken;
    const flow = body?.flow === "relink" ? "relink" : "gmb";

    if (typeof accessToken !== "string" || typeof refreshToken !== "string" || !refreshToken) {
      return new Response(JSON.stringify({ success: false, error: "Missing session tokens" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (accessToken !== accessTokenFromHeader) {
      return new Response(JSON.stringify({ success: false, error: "Access token mismatch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initiatedBy = claimsData.claims.sub as string;
    const restoreToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await adminClient
      .from("auth_restore_requests")
      .delete()
      .eq("initiated_by", initiatedBy)
      .is("consumed_at", null);

    const { error: insertError } = await adminClient
      .from("auth_restore_requests")
      .insert({
        token: restoreToken,
        initiated_by: initiatedBy,
        access_token: accessToken,
        refresh_token: refreshToken,
        flow,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to create auth restore state:", insertError);
      throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ success: true, restoreToken, expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-auth-restore error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
