import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  dentistName: string;
  phone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, dentistName, phone }: CreateUserRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // User already exists - update their password to the submitted one
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password,
        email_confirm: true,
      });

      // Assign dentist role
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: existingUser.id, role: "dentist" }, { onConflict: "user_id,role" });

      // Create pending clinic record
      await supabaseAdmin.from("pending_listing_users").upsert({
        user_id: existingUser.id,
        dentist_name: dentistName,
        phone: phone,
        email: email,
        status: "pending",
      }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User account updated",
          userId: existingUser.id,
          isNew: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new user with their password
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // User is confirmed but listing is pending approval
      user_metadata: {
        full_name: dentistName,
        phone,
      },
    });

    if (createUserError || !newUser.user) {
      console.error("Failed to create user:", createUserError);
      return new Response(
        JSON.stringify({ success: false, error: createUserError?.message || "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // Assign dentist role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "dentist" }, { onConflict: "user_id,role" });

    // Create pending clinic record
    await supabaseAdmin.from("pending_listing_users").upsert({
      user_id: userId,
      dentist_name: dentistName,
      phone: phone,
      email: email,
      status: "pending",
    }, { onConflict: "user_id" });

    console.log("User account created:", userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User account created",
        userId: userId,
        isNew: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
