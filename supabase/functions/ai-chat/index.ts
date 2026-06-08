// Supabase Edge Function: ai-chat
// Vitalcare AI assistant. Tries Gemini first, falls back to OpenRouter (Claude
// Haiku). API keys stay server-side (never exposed to the browser).
//
// Deploy:  supabase functions deploy ai-chat
// Secrets (Supabase → Edge Functions → Secrets):
//   GOOGLE_AI_API_KEY, GOOGLE_AI_MODEL (default gemini-1.5-flash),
//   OPENROUTER_API_KEY, OR_MODEL (default anthropic/claude-3.5-haiku)
// Verify JWT stays ON — only signed-in users can call this.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "../_shared/secrets.ts"
import { requireStaff } from "../_shared/auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// Everything the model should know about Vitalcare. Prepended to every call so
// the assistant always speaks as Vitalcare and uses the brand facts, whatever
// the task (blog post, email reply, course copy, marketing line).
const VITALCARE_BRAND = `You are the in-house AI for Vitalcare Training Hub. You write and reply AS Vitalcare, never as a generic assistant.

ABOUT VITALCARE TRAINING HUB
- Legal name: Vitalcare Training Hub Ltd (Company No. 15718997, England and Wales). Founded May 2024.
- Website: vitalcare.uk. Email: info@vitalcare.uk. Phone: 020 8059 8757. Address: 11 Halesworth Road, London SE13 7TJ.
- Leadership: Gideon Akinlotan (Founder and CEO). Harni Muharami RN MSc (Co-Founder and Clinical Director); clinical content is overseen by her.
- What we do: CSTF-aligned, CPD-accredited training for UK health and social care. Content is mapped to the Core Skills Training Framework, meets NHS mandatory training requirements, aligns with NICE/CQC expectations, and is verifiable at inspection.
- Catalogue: 190+ courses across 15 categories, including Mandatory Care, Care Skills, Safeguarding, Clinical Care, Specialist Care, Mental Health, Health and Safety, First Aid, Fire Safety, Food Safety, Soft Skills, Business Compliance and Train-the-Trainer.
- Who we serve: NHS Trusts and hospitals, care homes, GP practices, individual professionals, and corporate/group buyers.
- Every certificate is verifiable at vitalcare.uk/verify. When citing credentials lead with "CSTF-aligned, CPD-accredited".

VOICE (always)
- Four words: Authoritative. Approachable. Evidence-led. Human.
- UK English only (organisation, programme, centre, colour). Never use em-dashes; use commas, colons or restructure.
- Banned words: delve, tapestry, testament, showcase, pivotal, synergy, seamless, leverage, holistic, world-class, transformative, streamline, game-changer.
- Banned clichés: "passionate about patient care", "committed to excellence", "going the extra mile", "making a difference", "dedicated team of professionals".
- No hollow openers ("Certainly!", "Of course!", "Great question!"). Get to the substance.

ADAPT TO THE TASK
The user's instruction tells you what you are producing. Match the format and tone to it:
- Blog article -> a clear headline, an engaging intro, scannable sections, a practical takeaway. SEO-aware, UK clinical accuracy.
- Email or enquiry reply -> warm, concise, helpful; answer the question, offer the next step, sign off as the Vitalcare team with the contact details when useful.
- Course / resource copy -> benefit-led, compliance-aware, CSTF/CPD framing.
- Marketing line -> short, confident, specific.
Infer the right structure from the request. Do not give personalised medical or legal advice; point to a professional where appropriate.`

const SYSTEM_PROMPT = VITALCARE_BRAND

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

interface GenOpts {
  json?: boolean
  maxTokens?: number
  system?: string
}

async function tryGemini(
  admin: SupabaseClient,
  messages: ChatMessage[],
  opts: GenOpts = {},
): Promise<string | null> {
  const key = await getSecret(admin, "GOOGLE_AI_API_KEY")
  if (!key) return null
  const model = (await getSecret(admin, "GOOGLE_AI_MODEL")) ?? "gemini-2.0-flash"
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const generationConfig: Record<string, unknown> = {
    temperature: 0.6,
    maxOutputTokens: Math.min(opts.maxTokens ?? 2048, 8192),
  }
  if (opts.json) generationConfig.responseMimeType = "application/json"
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            { text: opts.system ? `${VITALCARE_BRAND}\n\n${opts.system}` : SYSTEM_PROMPT },
          ],
        },
        contents,
        generationConfig,
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

async function tryOpenRouter(
  admin: SupabaseClient,
  messages: ChatMessage[],
  opts: GenOpts = {},
): Promise<string | null> {
  const key = await getSecret(admin, "OPENROUTER_API_KEY")
  if (!key) return null
  const model = (await getSecret(admin, "OR_MODEL")) ?? "anthropic/claude-3.5-haiku"
  const body: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content: opts.system ? `${VITALCARE_BRAND}\n\n${opts.system}` : SYSTEM_PROMPT,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: Math.min(opts.maxTokens ?? 2048, 8192),
  }
  if (opts.json) body.response_format = { type: "json_object" }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

  // Staff only: the function spends the shared, paid AI quota and accepts a
  // caller-supplied system prompt, so it must not be reachable with the public
  // anon key by learners or anonymous callers.
  if (!(await requireStaff(req))) return json({ error: "Forbidden" }, 403)

  let messages: ChatMessage[]
  let opts: GenOpts = {}
  try {
    const body = await req.json()
    messages = Array.isArray(body?.messages) ? body.messages.slice(-20) : []
    opts = {
      json: body?.json === true,
      maxTokens: typeof body?.maxTokens === "number" ? body.maxTokens : undefined,
      system: typeof body?.system === "string" ? body.system : undefined,
    }
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (messages.length === 0) return json({ error: "No messages" }, 400)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  let reply = await tryGemini(admin, messages, opts)
  let provider = "gemini"
  if (!reply) {
    reply = await tryOpenRouter(admin, messages, opts)
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
