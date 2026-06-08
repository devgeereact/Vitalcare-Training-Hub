// Supabase Edge Function: one-to-one-email
// Sends the approval email for a 1:1 support session to the learner (and the
// trainer), with the meeting details. Emails are resolved server-side from the
// request id, so learner addresses never reach the browser. Verify JWT ON.
//
// Caller must be staff (admin / super_admin / manager / trainer).
// Deploy: supabase functions deploy one-to-one-email
// Secrets: RESEND_API_KEY, RESEND_FROM (defaults to info@vitalcare.uk)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "../_shared/secrets.ts"
import { sendViaSmtp } from "../_shared/smtp.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const STAFF = ["admin", "super_admin", "manager", "trainer"]

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// Branded email shell with the Vitalcare letterhead and legal footer.
function emailHtml(opts: {
  heading: string
  intro: string
  rows: { label: string; value: string }[]
  meetUrl: string | null
}): string {
  const detailRows = opts.rows
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;width:140px;vertical-align:top">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("")

  const cta = opts.meetUrl
    ? `<a href="${opts.meetUrl}" style="display:inline-block;margin-top:20px;background:#1b2e6b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">Join the meeting</a>`
    : ""

  return `
  <div style="background:#f8fafc;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="background:#1b2e6b;padding:20px 28px">
        <img src="https://vitalcare.uk/logos/logo-horizontal-white.svg" alt="Vitalcare Training Hub" height="34" style="height:34px">
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 10px;font-size:20px;color:#1b2e6b">${escapeHtml(opts.heading)}</h1>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#0f172a">${escapeHtml(opts.intro)}</p>
        <table style="width:100%;border-collapse:collapse">${detailRows}</table>
        ${cta}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #e2e8f0;background:#f8fafc">
        <p style="margin:0;font-size:11px;line-height:1.6;color:#64748b">
          Vitalcare Training Hub Ltd · Company No. 15718997 (England and Wales)<br>
          11 Halesworth Road, London SE13 7TJ · 020 8059 8757 · info@vitalcare.uk · vitalcare.uk<br>
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify
        </p>
      </div>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const admin = createClient(url, serviceKey)

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: "Unauthorised" }, 401)

  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()
  if (!caller || !STAFF.includes(caller.role)) return json({ error: "Forbidden" }, 403)

  let requestId = ""
  try {
    const body = (await req.json()) as { requestId?: string }
    requestId = String(body?.requestId ?? "")
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (!requestId) return json({ error: "Missing requestId" }, 400)

  // Resolve the request and the two parties.
  const { data: reqRow, error: reqErr } = await admin
    .from("one_to_one_requests")
    .select("learner_id, trainer_id, course_id, scheduled_at, meet_url, note")
    .eq("id", requestId)
    .single()
  if (reqErr || !reqRow) return json({ error: "Request not found" }, 404)

  const ids = [reqRow.learner_id, reqRow.trainer_id].filter(Boolean) as string[]
  const { data: people } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name, full_name")
    .in("id", ids)
  const byId = new Map((people ?? []).map((p) => [p.id, p]))
  const learner = byId.get(reqRow.learner_id)
  const trainer = reqRow.trainer_id ? byId.get(reqRow.trainer_id) : null
  if (!learner?.email) return json({ error: "Learner has no email" }, 400)

  let courseTitle = "1:1 support session"
  if (reqRow.course_id) {
    const { data: course } = await admin
      .from("courses")
      .select("title")
      .eq("id", reqRow.course_id)
      .single()
    if (course?.title) courseTitle = course.title
  }

  const nameOf = (p: typeof learner): string =>
    (p?.full_name ||
      [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
      "there") as string

  const when = reqRow.scheduled_at
    ? new Date(reqRow.scheduled_at).toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "To be confirmed"

  const rows = [
    { label: "Session", value: courseTitle },
    { label: "When", value: when },
    { label: "Trainer", value: trainer ? nameOf(trainer) : "To be assigned" },
  ]

  const subject = "Your 1:1 session is confirmed"
  const html = emailHtml({
    heading: "Your 1:1 session is confirmed",
    intro: `Hello ${nameOf(learner)}, your one to one support session has been approved. The details are below. Join from the button when it is time, or find it any time under One to one in your platform.`,
    rows,
    meetUrl: reqRow.meet_url ?? null,
  })

  const from =
    (await getSecret(admin, "RESEND_FROM")) ?? "Vitalcare Training Hub <info@vitalcare.uk>"
  const to = [learner.email, trainer?.email].filter(Boolean) as string[]

  // Prefer the organisation SMTP; fall back to Resend.
  const smtp = await sendViaSmtp(admin, { to, subject, html, from })
  if (smtp.configured) {
    return json({ ok: smtp.sent > 0, via: "smtp", error: smtp.error ?? null })
  }

  const apiKey = await getSecret(admin, "RESEND_API_KEY")
  if (!apiKey) return json({ error: "Email service not configured" }, 500)
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error("[one-to-one-email]", res.status, errText)
    return json({ error: "Send failed", detail: errText }, 502)
  }
  return json({ ok: true, via: "resend" })
})
