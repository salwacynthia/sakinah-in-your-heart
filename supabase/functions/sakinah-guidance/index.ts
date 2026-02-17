import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
- Respond ONLY with valid JSON. No extra text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response from the model
    let parsed;
    try {
      // Strip markdown fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sakinah-guidance error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
