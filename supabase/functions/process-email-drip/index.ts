// Supabase Edge Function: process-email-drip
// Cron-triggered. Sends any email_campaigns that are due. Not JWT-gated; guarded
// by a shared CRON_SECRET header so only the pg_cron job can run it.
//
// Deploy: supabase functions deploy process-email-drip --no-verify-jwt
// Secrets: CRON_SECRET, RESEND_API_KEY, RESEND_FROM, SUPABASE_URL,
//          SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendViaSmtp } from "../_shared/smtp.ts"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const STAFF_ROLES = ["admin", "super_admin", "manager"]

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const secret = Deno.env.get("CRON_SECRET")
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return json({ error: "Forbidden" }, 403)
  }

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const apiKey = Deno.env.get("RESEND_API_KEY")
  const from = Deno.env.get("RESEND_FROM") ?? "Vitalcare Training Hub <info@vitalcare.uk>"
  if (!apiKey) return json({ error: "Email service not configured" }, 500)

  const admin = createClient(url, serviceKey)
  const nowIso = new Date().toISOString()

  const { data: due } = await admin
    .from("email_campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(10)

  if (!due || due.length === 0) return json({ ok: true, processed: 0 })

  let processed = 0
  for (const c of due) {
    await admin.from("email_campaigns").update({ status: "sending" }).eq("id", c.id)

    const role =
      c.audience === "all_staff"
        ? STAFF_ROLES
        : c.audience === "all_trainers"
        ? ["trainer"]
        : ["learner"]
    const { data: people } = await admin
      .from("profiles")
      .select("email")
      .in("role", role)
      .is("deleted_at", null)
    const emails = (people ?? []).map((p: { email: string }) => p.email).filter(Boolean)

    const html = `
      <div style="font-family:sans-serif;font-size:14px;color:#0f172a">
        ${String(c.message).replace(/\n/g, "<br>")}
        <hr style="margin-top:24px;border:none;border-top:1px solid #e2e8f0">
        <p style="font-size:12px;color:#64748b">Vitalcare Training Hub · CSTF-aligned, CPD-accredited</p>
      </div>`

    let sent = 0
    const smtp = await sendViaSmtp(admin, { to: emails, subject: c.subject, html })
    if (smtp.configured) {
      sent = smtp.sent
    } else if (apiKey) {
      for (let i = 0; i < emails.length; i += 50) {
        const chunk = emails.slice(i, i + 50)
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: chunk, subject: c.subject, html }),
        })
        if (res.ok) sent += chunk.length
        else console.error("[process-email-drip]", res.status, await res.text())
      }
    }

    await admin
      .from("email_campaigns")
      .update({
        status: sent > 0 || emails.length === 0 ? "sent" : "failed",
        sent_count: sent,
        total_count: emails.length,
        sent_at: new Date().toISOString(),
      })
      .eq("id", c.id)
    processed++
  }

  return json({ ok: true, processed })
})
