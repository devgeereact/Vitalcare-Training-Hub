// Supabase Edge Function: user-mail
// Per-employee mail. JWT-gated; each user manages and sends from their own
// SMTP account. Credentials stored in user_mail_accounts (service role only).
//
// Deploy: supabase functions deploy user-mail
// Actions: get | set | send

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: "Unauthorised" }, 401)
  const uid = u.user.id

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    /* get has no body */
  }
  const action = String(body.action ?? "get")

  if (action === "get") {
    const { data } = await admin
      .from("user_mail_accounts")
      .select("email, from_name, smtp_host, smtp_port, imap_host, imap_port, active")
      .eq("user_id", uid)
      .maybeSingle()
    return json({ account: data ?? null, configured: !!data })
  }

  if (action === "set") {
    const row = {
      user_id: uid,
      email: String(body.email ?? "").trim(),
      from_name: String(body.fromName ?? "").trim() || null,
      smtp_host: String(body.smtpHost ?? "").trim(),
      smtp_port: Number(body.smtpPort ?? 465),
      smtp_pass: String(body.smtpPass ?? ""),
      imap_host: String(body.imapHost ?? "").trim() || null,
      imap_port: Number(body.imapPort ?? 993),
      active: true,
      updated_at: new Date().toISOString(),
    }
    if (!row.email || !row.smtp_host || !row.smtp_pass) {
      return json({ error: "Email, SMTP host and password are required" }, 400)
    }
    const { error } = await admin.from("user_mail_accounts").upsert(row)
    if (error) {
      console.error("[user-mail set]", error)
      return json({ error: "Could not save" }, 500)
    }
    return json({ ok: true })
  }

  if (action === "send") {
    const to = String(body.to ?? "").trim()
    const subject = String(body.subject ?? "").trim()
    const message = String(body.message ?? "").trim()
    if (!to || !subject || !message) return json({ error: "Missing fields" }, 400)

    const { data: acc } = await admin
      .from("user_mail_accounts")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle()
    if (!acc) return json({ error: "Connect your mail account first", notConfigured: true }, 400)

    const client = new SMTPClient({
      connection: {
        hostname: acc.smtp_host,
        port: acc.smtp_port,
        tls: acc.smtp_port === 465,
        auth: { username: acc.email, password: acc.smtp_pass },
      },
    })
    const from = acc.from_name ? `${acc.from_name} <${acc.email}>` : acc.email
    const html = `<div style="font-family:sans-serif;font-size:14px;color:#0f172a">${message.replace(/\n/g, "<br>")}</div>`
    try {
      await client.send({ from, to, subject, html })
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      console.error("[user-mail send]", error)
      try {
        await client.close()
      } catch { /* ignore */ }
      return json({ ok: false, error }, 502)
    }
    try {
      await client.close()
    } catch { /* ignore */ }
    return json({ ok: true })
  }

  return json({ error: "Unknown action" }, 400)
})
