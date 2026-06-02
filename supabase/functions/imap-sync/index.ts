// Supabase Edge Function: imap-sync
// Cron-triggered. Pulls recent INBOX messages over IMAP into mail_messages.
// Reuses SMTP_USER/SMTP_PASS for auth; IMAP_HOST defaults to SMTP_HOST, port 993.
//
// Deploy: supabase functions deploy imap-sync --no-verify-jwt
// Secrets: CRON_SECRET, IMAP_HOST/IMAP_PORT (or SMTP_*), SUPABASE_* (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { ImapFlow } from "npm:imapflow@1.0.171"
import { getSecret } from "../_shared/secrets.ts"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } })

function snippet(text: string, n = 200) {
  return text.replace(/\s+/g, " ").trim().slice(0, n)
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Allow the cron job (shared secret) OR a staff user (Sync now button).
  const secret = Deno.env.get("CRON_SECRET")
  const viaCron = !!secret && req.headers.get("x-cron-secret") === secret
  if (!viaCron) {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
    const { data: u } = await admin.auth.getUser(token)
    const role = u.user
      ? (await admin.from("profiles").select("role").eq("id", u.user.id).single()).data?.role
      : null
    if (!role || !["admin", "super_admin", "manager"].includes(role)) {
      return json({ error: "Forbidden" }, 403)
    }
  }

  const host = (await getSecret(admin, "IMAP_HOST")) ?? (await getSecret(admin, "SMTP_HOST"))
  const port = Number((await getSecret(admin, "IMAP_PORT")) ?? "993")
  const user = await getSecret(admin, "SMTP_USER")
  const pass = await getSecret(admin, "SMTP_PASS")
  if (!host || !user || !pass) return json({ error: "IMAP not configured" }, 400)

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  })

  let stored = 0
  try {
    await client.connect()
    const lock = await client.getMailboxLock("INBOX")
    try {
      const mbox = client.mailbox
      const total = typeof mbox === "object" && mbox ? mbox.exists : 0
      if (total > 0) {
        const start = Math.max(1, total - 29) // last 30 messages
        for await (const msg of client.fetch(`${start}:*`, {
          uid: true,
          envelope: true,
          bodyStructure: false,
          source: true,
        })) {
          const env = msg.envelope
          const messageId = env?.messageId ?? `uid-${msg.uid}`
          const fromObj = env?.from?.[0]
          const raw = msg.source ? new TextDecoder().decode(msg.source) : ""
          // crude text body: strip headers + tags for a snippet
          const bodyStart = raw.indexOf("\r\n\r\n")
          const bodyRaw = bodyStart >= 0 ? raw.slice(bodyStart + 4) : raw
          const text = bodyRaw.replace(/<[^>]+>/g, " ")
          const { error } = await admin.from("mail_messages").upsert(
            {
              message_id: messageId,
              uid: msg.uid,
              from_name: fromObj?.name ?? null,
              from_addr: fromObj ? `${fromObj.address}` : null,
              subject: env?.subject ?? "(no subject)",
              snippet: snippet(text),
              body_html: bodyRaw.slice(0, 50000),
              received_at: env?.date ? new Date(env.date).toISOString() : null,
            },
            { onConflict: "message_id" },
          )
          if (!error) stored++
        }
      }
    } finally {
      lock.release()
    }
    await client.logout()
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error("[imap-sync]", error)
    try {
      await client.close()
    } catch { /* ignore */ }
    return json({ ok: false, error }, 502)
  }

  return json({ ok: true, stored })
})
