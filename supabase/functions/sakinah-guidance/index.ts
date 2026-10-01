import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Sakinah AI, a warm and compassionate Islamic spiritual guide. The user will share what's on their heart. You must respond with EXACTLY this JSON structure (no markdown, no code fences):

{
  "asmaulHusnaArabic": "The Arabic name of Allah most relevant to the user's emotional state (e.g. الرَّحْمَٰنُ)",
  "asmaulHusnaBengali": "Bengali meaning of the name (e.g. পরম করুণাময়)",
  "asmaulHusnaExplanation": "One sentence in Bengali explaining why calling Allah by this name will bring healing in their current situation. Write warmly and personally.",
  "ayat": "The Arabic text of a relevant Quranic verse",
  "ayatReference": "Surah name and verse number in Bengali (e.g. সূরা আর-রা'দ ১৩:২৮)",
  "bengaliTranslation": "Bengali translation of the Ayat",
  "reflection": "A warm, personal reflection (2-4 sentences). Write like a kind friend — use 'you', be gentle, conversational, and comforting. No formal or textbook tone.",
  "hadith": "The Arabic or Bengali text of a relevant authentic Hadith",
  "hadithBengali": "Bengali translation of the Hadith",
  "hadithNarrator": "The narrator name in Bengali (e.g. আবু হুরায়রা রা.)",
  "hadithSource": "The source book (e.g. সহীহ বুখারী, হাদীস নং ৬০১১)"
}

Rules:
- Only use authentic (Sahih) Hadith from Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasai, or Ibn Majah.
- The Ayat and Hadith must be emotionally relevant to what the user shared.
- The Asmaul Husna must be one of the 99 authentic Names of Allah, chosen to directly address the user's emotional need.
- The reflection should sound like a kind friend, not a scholar or textbook.
- LANGUAGE RULE: Detect the language of the user's message. If they write in English, write all non-Arabic fields (asmaulHusnaBengali, asmaulHusnaExplanation, ayatReference, bengaliTranslation, reflection, hadithBengali, hadithNarrator, hadithSource) in English. If they write in Bengali/Bangla, use Bengali. The "ayat" and "hadith" fields should always remain in Arabic. The "asmaulHusnaArabic" field should always be in Arabic.
- Respond ONLY with valid JSON. No extra text.`;

const FREE_TIER_LIMIT = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Check the user's tier and usage
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("tier, reflection_count")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("Could not load profile");

    if (
      profile.tier === "free" &&
      profile.reflection_count >= FREE_TIER_LIMIT
    ) {
      return new Response(
        JSON.stringify({ limitReached: true, tier: profile.tier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { message } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY)
      throw new Error("ANTHROPIC_API_KEY is not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("Anthropic API error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (status === 402 || status === 400) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted or request issue. Please check billing.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    let parsed;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Increment usage count after a successful reflection
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabaseAdmin
      .from("profiles")
      .update({ reflection_count: profile.reflection_count + 1 })
      .eq("id", user.id);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sakinah-guidance error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
