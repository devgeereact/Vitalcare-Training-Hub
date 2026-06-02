// Supabase Edge Function: imap-sync
// Pulls recent INBOX messages over IMAP into mail_messages.
//  - cron (x-cron-secret): syncs the org mailbox (SMTP_*/IMAP_*), owner_id null.
//  - user JWT with {scope:"me"}: syncs the caller's personal mail account
//    (user_mail_accounts), owner_id = caller.
//
// Deploy: supabase functions deploy imap-sync --no-verify-jwt
// Secrets: CRON_SECRET, IMAP_HOST/IMAP_PORT or SMTP_*, SUPABASE_* (auto)

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { ImapFlow } from "npm:imapflow@1.0.171"
import { getSecret } from "../_shared/secrets.ts"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } })

const snippet = (t: string, n = 200) => t.replace(/\s+/g, " ").trim().slice(0, n)

interface Mailbox {
  host: string
  port: number
  user: string
  pass: string
  ownerId: string | null
}

async function syncMailbox(admin: SupabaseClient, mb: Mailbox): Promise<number> {
  const client = new ImapFlow({
    host: mb.host,
    port: mb.port,
    secure: true,
    auth: { user: mb.user, pass: mb.pass },
    logger: false,
  })
  let stored = 0
  await client.connect()
  const lock = await client.getMailboxLock("INBOX")
  try {
    const mboxInfo = client.mailbox
    const total = typeof mboxInfo === "object" && mboxInfo ? mboxInfo.exists : 0
    if (total > 0) {
      const start = Math.max(1, total - 29)
      for await (const msg of client.fetch(`${start}:*`, {
        uid: true,
        envelope: true,
        source: true,
      })) {
        const env = msg.envelope
        const messageId = env?.messageId ?? `uid-${mb.ownerId ?? "org"}-${msg.uid}`
        const fromObj = env?.from?.[0]
        const raw = msg.source ? new TextDecoder().decode(msg.source) : ""
        const bodyStart = raw.indexOf("\r\n\r\n")
        const bodyRaw = bodyStart >= 0 ? raw.slice(bodyStart + 4) : raw
        const text = bodyRaw.replace(/<[^>]+>/g, " ")
        const { error } = await admin.from("mail_messages").upsert(
          {
            message_id: messageId,
            uid: msg.uid,
            owner_id: mb.ownerId,
            from_name: fromObj?.name ?? null,
            from_addr: fromObj?.address ?? null,
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
  return stored
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const secret = Deno.env.get("CRON_SECRET")
  const viaCron = !!secret && req.headers.get("x-cron-secret") === secret

  // Personal mailbox sync (signed-in user, their own account).
  if (!viaCron) {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
    const { data: u } = await admin.auth.getUser(token)
    if (!u.user) return json({ error: "Unauthorised" }, 401)
    const { data: acc } = await admin
      .from("user_mail_accounts")
      .select("*")
      .eq("user_id", u.user.id)
      .eq("active", true)
      .maybeSingle()
    if (!acc || !(acc.imap_host || acc.smtp_host)) {
      return json({ error: "No personal mail account", notConfigured: true }, 400)
    }
    try {
      const stored = await syncMailbox(admin, {
        host: acc.imap_host || acc.smtp_host,
        port: acc.imap_port ?? 993,
        user: acc.email,
        pass: acc.smtp_pass,
        ownerId: u.user.id,
      })
      return json({ ok: true, stored })
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      console.error("[imap-sync user]", error)
      return json({ ok: false, error }, 502)
    }
  }

  // Cron: org mailbox.
  const host = (await getSecret(admin, "IMAP_HOST")) ?? (await getSecret(admin, "SMTP_HOST"))
  const port = Number((await getSecret(admin, "IMAP_PORT")) ?? "993")
  const user = await getSecret(admin, "SMTP_USER")
  const pass = await getSecret(admin, "SMTP_PASS")
  if (!host || !user || !pass) return json({ error: "IMAP not configured" }, 400)
  try {
    const stored = await syncMailbox(admin, { host, port, user, pass, ownerId: null })
    return json({ ok: true, stored })
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error("[imap-sync org]", error)
    return json({ ok: false, error }, 502)
  }
})
