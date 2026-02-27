import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  clinicId?: string;
  sessionId?: string;
  visitorId?: string;
}

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_MESSAGES_PER_SESSION = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AIMLAPI_KEY = Deno.env.get("AIMLAPI_KEY");
    if (!AIMLAPI_KEY) {
      throw new Error("AIMLAPI_KEY is not configured");
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    const { messages, clinicId, sessionId, visitorId }: ChatRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const identifier = visitorId || sessionId || clientIp;
    const identifierType = visitorId ? "visitor" : (sessionId ? "session" : "ip");

    const { data: isAllowed, error: rateLimitError } = await supabase.rpc("check_ai_rate_limit", {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    } else if (isAllowed === false) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later.", retryAfter: RATE_LIMIT_WINDOW_MINUTES * 60 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(RATE_LIMIT_WINDOW_MINUTES * 60) } }
      );
    }

    if (sessionId && messages.length > MAX_MESSAGES_PER_SESSION) {
      return new Response(
        JSON.stringify({ error: "Session message limit reached. Please start a new conversation." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (lastUserMessage && lastUserMessage.content.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message too long. Please keep messages under 2000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── FETCH PLATFORM CONTEXT ───────────────────────────────────────
    // Fetch live data to make the bot knowledgeable about the platform

    let platformContext = "";

    // Fetch top emirates/states
    const { data: states } = await supabase
      .from("states")
      .select("name, abbreviation, slug")
      .eq("is_active", true)
      .order("name")
      .limit(10);

    // Fetch popular cities
    const { data: cities } = await supabase
      .from("cities")
      .select("name, slug, state:states(name, abbreviation)")
      .eq("is_active", true)
      .order("dentist_count", { ascending: false })
      .limit(20);

    // Fetch available treatments
    const { data: treatments } = await supabase
      .from("treatments")
      .select("name, slug")
      .eq("is_active", true)
      .order("name")
      .limit(30);

    // Fetch total clinic count
    const { count: clinicCount } = await supabase
      .from("clinics")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch total dentist count
    const { count: dentistCount } = await supabase
      .from("dentists")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch available insurances
    const { data: insurances } = await supabase
      .from("insurances")
      .select("name")
      .eq("is_active", true)
      .order("name")
      .limit(20);

    const statesList = states?.map(s => s.name).join(", ") || "Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain";
    const citiesList = cities?.map(c => {
      const st = Array.isArray(c.state) ? c.state[0] : c.state;
      return `${c.name} (${(st as any)?.abbreviation || ""})`;
    }).join(", ") || "";
    const treatmentsList = treatments?.map(t => t.name).join(", ") || "";
    const insurancesList = insurances?.map(i => i.name).join(", ") || "";

    platformContext = `
PLATFORM DATA (LIVE):
- Total clinics listed: ${clinicCount || "190+"}
- Total dentists listed: ${dentistCount || "many"}
- Emirates covered: ${statesList}
- Top cities: ${citiesList}
- Dental services available: ${treatmentsList}
- Insurance providers accepted: ${insurancesList}
`;

    // ─── CLINIC-SPECIFIC CONTEXT ──────────────────────────────────────
    let clinicContext = "";
    if (clinicId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(clinicId)) {
        return new Response(
          JSON.stringify({ error: "Invalid clinic ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: clinic } = await supabase
        .from("clinics")
        .select(`
          name, address, phone, email, description, rating, review_count,
          city:cities(name),
          clinic_hours(day_of_week, open_time, close_time, is_closed),
          clinic_treatments(treatment:treatments(name)),
          clinic_insurances(insurance:insurances(name))
        `)
        .eq("id", clinicId)
        .single();

      if (clinic) {
        const hours = clinic.clinic_hours?.map((h: any) => {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return h.is_closed ? `${days[h.day_of_week]}: Closed` : `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`;
        }).join(", ") || "Contact for hours";

        const clinicTreatments = clinic.clinic_treatments?.map((t: any) => t.treatment?.name).filter(Boolean).join(", ") || "General dentistry";
        const clinicInsurances = clinic.clinic_insurances?.map((i: any) => i.insurance?.name).filter(Boolean).join(", ") || "Contact for insurance info";
        const cityName = Array.isArray(clinic.city) ? clinic.city[0]?.name : (clinic.city as any)?.name;

        clinicContext = `
CURRENT CLINIC CONTEXT (user is viewing this clinic):
- Clinic: ${clinic.name}
- Location: ${clinic.address || "Contact for address"}, ${cityName || ""}
- Phone: ${clinic.phone || "Available on website"}
- Email: ${clinic.email || "Available on website"}
- Rating: ${clinic.rating || "N/A"}/5 (${clinic.review_count || 0} reviews)
- Hours: ${hours}
- Services: ${clinicTreatments}
- Insurance Accepted: ${clinicInsurances}
- About: ${clinic.description || "Quality dental care"}
`;
      }
    }

    // ─── DETECT USER INTENT FOR SMART RESPONSES ──────────────────────
    const lastMsg = lastUserMessage?.content?.toLowerCase() || "";
    let intentHint = "";
    
    // Search-like queries — help user navigate
    if (lastMsg.match(/find|search|looking for|need|want|where|recommend/i)) {
      // Try to find matching clinics based on the query
      let searchResults = "";
      
      // Check if user mentions a city
      const matchedCity = cities?.find(c => lastMsg.includes(c.name.toLowerCase()));
      // Check if user mentions a treatment
      const matchedTreatment = treatments?.find(t => lastMsg.includes(t.name.toLowerCase()));
      
      if (matchedCity || matchedTreatment) {
        let clinicQuery = supabase
          .from("clinics")
          .select("name, slug, rating, review_count, address, city:cities(name)")
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(5);
        
        if (matchedCity) {
          const cityData = cities?.find(c => c.name === matchedCity.name);
          // We can't easily filter by city name in this query, but we can try
        }
        
        const { data: matchedClinics } = await clinicQuery;
        if (matchedClinics && matchedClinics.length > 0) {
          searchResults = matchedClinics.map(c => {
            const city = Array.isArray(c.city) ? c.city[0]?.name : (c.city as any)?.name;
            return `• ${c.name} — ${city || ""}, Rating: ${c.rating}/5 (${c.review_count} reviews) → /clinic/${c.slug}`;
          }).join("\n");
          intentHint = `\nRELEVANT SEARCH RESULTS (share these with the user, with links):\n${searchResults}`;
        }
      }
    }

    // ─── BUILD SYSTEM PROMPT ─────────────────────────────────────────
    const systemPrompt = `You are Panda 🐼, AppointPanda's smart dental assistant for the UAE.

=== PERSONALITY ===
- Warm, concise, human-like. Like a friendly receptionist, not a robot.
- Use occasional emojis naturally (1-2 per reply max).
- NEVER repeat greetings. After the first message, jump straight to helping.

=== RESPONSE FORMAT (CRITICAL) ===
- Keep replies SHORT: 1-3 sentences MAX per response.
- NEVER write paragraphs or long explanations.
- When you have a link to share, put it on its own line in this format: [Button Label](/path)
- Multiple links = multiple lines, each as [Label](/path)
- Example good response:
  "Great choice! Here are top clinics for teeth cleaning in Dubai 🦷

  [Teeth Cleaning in Jumeirah](/dubai/jumeirah/teeth-cleaning)
  [Teeth Cleaning in Marina](/dubai/dubai-marina/teeth-cleaning)
  [Browse All Dubai Clinics](/dubai)"

=== SMART CONVERSATION FLOW ===
When a user has a vague request, ask ONE clarifying question at a time with options:

Step 1: What service? → Offer 3-4 common options
Step 2: Which location? → Suggest emirates/cities
Step 3: Insurance or cash? → Ask preference
Step 4: Urgency? → "Today, this week, or flexible?"

Example flow:
User: "I want to book an appointment"
Panda: "Sure! What type of dental service are you looking for?

• Teeth Cleaning
• Whitening
• Implants
• Braces/Orthodontics
• Something else?"

User: "Cleaning"
Panda: "Which area in the UAE? 🇦🇪

• Dubai
• Abu Dhabi
• Sharjah
• Other"

User: "Dubai"
Panda: "Here are clinics offering teeth cleaning in Dubai:

[Find Clinics in Dubai](/dubai)
[Teeth Cleaning in Dubai](/search?treatment=teeth-cleaning&emirate=dubai)"

=== WHAT YOU KNOW ===
${platformContext}
${clinicContext}
${intentHint}

=== NAVIGATION LINKS ===
- Emirates: /dubai, /abu-dhabi, /sharjah, /ajman, /ras-al-khaimah, /fujairah, /umm-al-quwain
- Cities: /{emirate}/{city-slug} (e.g., /dubai/jumeirah)
- Services: /{emirate}/{city}/{service-slug}
- Search: /search
- Treatments info: /treatments/{slug}
- Clinic pages: /clinic/{clinic-slug}
- List your practice: /list-your-practice

=== RULES ===
- Currency: AED only
- NEVER diagnose or guarantee outcomes
- NEVER invent clinics or prices
- If unsure, say so honestly and suggest /search
- For emergencies: immediately suggest calling nearest clinic + link to /search
- Don't repeat yourself across messages — remember the conversation context`;

    // ─── CONVERSATION LOGGING ─────────────────────────────────────────
    let conversationId: string | null = null;
    if (clinicId && sessionId) {
      const { data: existingConvo } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("session_id", sessionId)
        .eq("clinic_id", clinicId)
        .single();

      if (existingConvo) {
        conversationId = existingConvo.id;
      } else {
        const { data: newConvo } = await supabase
          .from("ai_conversations")
          .insert({ clinic_id: clinicId, session_id: sessionId, visitor_id: visitorId, channel: "chat", status: "active" })
          .select("id")
          .single();
        conversationId = newConvo?.id || null;
      }

      if (conversationId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "user") {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: lastMessage.content
          });
        }
      }
    }

    // ─── CALL AI ──────────────────────────────────────────────────────
    const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIMLAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
