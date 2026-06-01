// Supabase Edge Function: contact-form
// Public (Verify JWT OFF). Sends the marketing contact form to the admin inbox
// via Resend. RESEND_API_KEY stays server-side.
//
// Deploy:  supabase functions deploy contact-form --no-verify-jwt
// Secrets: RESEND_API_KEY, RESEND_FROM, ADMIN_EMAIL, ADMIN_EMAIL_SECONDARY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c))
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const apiKey = Deno.env.get("RESEND_API_KEY")
  const from = Deno.env.get("RESEND_FROM") ?? "Vitalcare Training Hub <onboarding@resend.dev>"
  const admin = Deno.env.get("ADMIN_EMAIL") ?? "gakinz101@gmail.com"
  const adminSecondary = Deno.env.get("ADMIN_EMAIL_SECONDARY")
  if (!apiKey) return json({ error: "Email service not configured" }, 500)

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  const name = (body.name ?? "").trim()
  const email = (body.email ?? "").trim()
  const message = (body.message ?? "").trim()
  if (!name || !email || !message) return json({ error: "Missing fields" }, 400)

  const to = [admin, ...(adminSecondary ? [adminSecondary] : [])]
  const html = `
    <h2 style="font-family:sans-serif;color:#1b2e6b">New contact enquiry</h2>
    <table style="font-family:sans-serif;font-size:14px">
      <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
      <tr><td><b>Email</b></td><td>${esc(email)}</td></tr>
      <tr><td><b>Organisation</b></td><td>${esc(body.organisation ?? "—")}</td></tr>
      <tr><td><b>Phone</b></td><td>${esc(body.phone ?? "—")}</td></tr>
    </table>
    <p style="font-family:sans-serif;white-space:pre-wrap">${esc(message)}</p>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Contact enquiry from ${name}`,
      html,
    }),
  })

  if (!res.ok) {
    console.error("[contact-form]", res.status, await res.text())
    return json({ error: "Could not send message" }, 502)
  }
  return json({ ok: true })
})
