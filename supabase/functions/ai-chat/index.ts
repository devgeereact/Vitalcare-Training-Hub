// Supabase Edge Function: ai-chat
// Vitalcare AI assistant. Tries Gemini first, falls back to OpenRouter (Claude
// Haiku). API keys stay server-side (never exposed to the browser).
//
// Deploy:  supabase functions deploy ai-chat
// Secrets (Supabase → Edge Functions → Secrets):
//   GOOGLE_AI_API_KEY, GOOGLE_AI_MODEL (default gemini-1.5-flash),
//   OPENROUTER_API_KEY, OR_MODEL (default anthropic/claude-3.5-haiku)
// Verify JWT stays ON — only signed-in users can call this.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `You are the Vitalcare Training Hub assistant, helping NHS and care-sector learners and trainers.
Be authoritative, approachable, evidence-led and human. Use UK English. Never use em-dashes.
Keep answers concise and practical. If unsure, say so. Do not give personalised medical or legal advice.`

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function tryGemini(messages: ChatMessage[]): Promise<string | null> {
  const key = Deno.env.get("GOOGLE_AI_API_KEY")
  if (!key) return null
  const model = Deno.env.get("GOOGLE_AI_MODEL") ?? "gemini-1.5-flash"
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
      }),
    },
  )
  if (!res.ok) {
    console.error("[gemini]", res.status, await res.text())
    return null
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === "string" ? text : null
}

async function tryOpenRouter(messages: ChatMessage[]): Promise<string | null> {
  const key = Deno.env.get("OPENROUTER_API_KEY")
  if (!key) return null
  const model = Deno.env.get("OR_MODEL") ?? "anthropic/claude-3.5-haiku"
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1024,
    }),
  })
  if (!res.ok) {
    console.error("[openrouter]", res.status, await res.text())
    return null
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  return typeof text === "string" ? text : null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  let messages: ChatMessage[]
  try {
    const body = await req.json()
    messages = Array.isArray(body?.messages) ? body.messages.slice(-20) : []
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (messages.length === 0) return json({ error: "No messages" }, 400)

  let reply = await tryGemini(messages)
  let provider = "gemini"
  if (!reply) {
    reply = await tryOpenRouter(messages)
    provider = "openrouter"
  }
  if (!reply) {
    return json(
      { error: "AI is unavailable. Set GOOGLE_AI_API_KEY / OPENROUTER_API_KEY secrets." },
      503,
    )
  }
  return json({ reply, provider })
})
