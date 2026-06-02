// Supabase Edge Function: send-email
// Admin-gated bulk/individual email via Resend. Verify JWT ON.
// The caller must be admin / super_admin / manager. Recipients are resolved
// server-side from the profiles table so learner emails never reach the client.
//
// Deploy: supabase functions deploy send-email
// Secrets: RESEND_API_KEY, RESEND_FROM (defaults to info@vitalcare.uk)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "../_shared/secrets.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

const STAFF = ["admin", "super_admin", "manager"]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const admin = createClient(url, serviceKey)

  const apiKey = await getSecret(admin, "RESEND_API_KEY")
  const from =
    (await getSecret(admin, "RESEND_FROM")) ?? "Vitalcare Training Hub <info@vitalcare.uk>"
  if (!apiKey) return json({ error: "Email service not configured" }, 500)

  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.replace("Bearer ", "")

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: "Unauthorised" }, 401)

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()
  if (!profile || !STAFF.includes(profile.role)) {
    return json({ error: "Forbidden" }, 403)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  const subject = String(body.subject ?? "").trim()
  const message = String(body.message ?? "").trim()
  const audience = String(body.audience ?? "all_learners")
  if (!subject || !message) return json({ error: "Missing subject or message" }, 400)

  // Resolve recipients.
  let emails: string[] = []
  if (Array.isArray(body.emails) && body.emails.length) {
    emails = (body.emails as unknown[]).map(String)
  } else {
    const role =
      audience === "all_staff" ? STAFF : audience === "all_trainers" ? ["trainer"] : ["learner"]
    const { data: people } = await admin
      .from("profiles")
      .select("email")
      .in("role", role)
      .is("deleted_at", null)
    emails = (people ?? []).map((p: { email: string }) => p.email).filter(Boolean)
  }
  if (emails.length === 0) return json({ error: "No recipients" }, 400)

  const html = `
    <div style="font-family:sans-serif;font-size:14px;color:#0f172a">
      ${message.replace(/\n/g, "<br>")}
      <hr style="margin-top:24px;border:none;border-top:1px solid #e2e8f0">
      <p style="font-size:12px;color:#64748b">Vitalcare Training Hub · CSTF-aligned, CPD-accredited</p>
    </div>`

  // Resend caps `to` at 50 per call; chunk for larger audiences.
  const chunks: string[][] = []
  for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50))

  let sent = 0
  let lastError: string | null = null
  for (const chunk of chunks) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: chunk, subject, html }),
    })
    if (res.ok) {
      sent += chunk.length
    } else {
      lastError = await res.text()
      console.error("[send-email]", res.status, lastError)
    }
  }

  return json({ ok: sent > 0, sent, total: emails.length, error: lastError })
})
