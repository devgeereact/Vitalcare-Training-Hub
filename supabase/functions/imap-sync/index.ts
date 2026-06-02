// Supabase Edge Function: imap-sync
// Pulls recent INBOX messages over IMAP into mail_messages.
//  - cron (x-cron-secret): org mailbox (owner null) or {scope:"users"} for all
//    connected employee mailboxes.
//  - user JWT: the caller's personal mailbox (owner_id = caller).
//
// NOTE: IMAP over npm:imapflow is best-effort on Supabase Edge — some hosts'
// TLS handshakes abort the isolate. SMTP send (denomailer) is reliable; for
// guaranteed inbox sync, run this against a dedicated IMAP worker instead.
//
// Deploy: supabase functions deploy imap-sync --no-verify-jwt

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { ImapFlow } from "npm:imapflow@1.0.171"
import { getSecret } from "../_shared/secrets.ts"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } })

const snippet = (t: string, n = 200) => t.replace(/\s+/g, " ").trim().slice(0, n)

// Notify the relevant owner(s) about newly-stored mail. Owner-scoped mail
// notifies the owner; the shared org inbox (ownerId null) notifies staff/admins.
async function notifyNewMail(
  admin: SupabaseClient,
  input: { ownerId: string | null; from: string | null; subject: string | null },
): Promise<void> {
  let recipients: string[] = []
  if (input.ownerId) {
    recipients = [input.ownerId]
  } else {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .is("deleted_at", null)
      .in("role", ["super_admin", "admin", "manager"])
    recipients = (data ?? []).map((p: { id: string }) => p.id)
  }
  if (!recipients.length) return
  const body = `${input.from ?? "Someone"}: ${(input.subject ?? "(no subject)").slice(0, 120)}`
  const rows = recipients.map((uid) => ({
    user_id: uid,
    type: "message",
    title: "New email",
    body,
    link: "/platform/email",
  }))
  const { error } = await admin.from("notifications").insert(rows)
  if (error) console.error("[imap-sync notify]", error.message)
}

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
    greetingTimeout: 10000,
    connectionTimeout: 15000,
    socketTimeout: 25000,
    disableAutoIdle: true,
  })

  const work = async (): Promise<number> => {
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

          // Only brand-new mail raises a notification; re-pulled rows stay quiet.
          const { data: existing } = await admin
            .from("mail_messages")
            .select("id")
            .eq("message_id", messageId)
            .maybeSingle()
          const isNew = !existing

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
          if (!error) {
            stored++
            if (isNew) {
              await notifyNewMail(admin, {
                ownerId: mb.ownerId,
                from: fromObj?.name ?? fromObj?.address ?? null,
                subject: env?.subject ?? null,
              })
            }
          }
        }
      }
    } finally {
      lock.release()
    }
    await client.logout()
    return stored
  }

  const timeout = new Promise<number>((_, reject) =>
    setTimeout(() => {
      try {
        client.close()
      } catch { /* ignore */ }
      reject(new Error("IMAP timed out"))
    }, 30000),
  )
  return await Promise.race([work(), timeout])
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch { /* empty */ }

  const secret = Deno.env.get("CRON_SECRET")
  const viaCron = !!secret && req.headers.get("x-cron-secret") === secret

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
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502)
    }
  }

  if (body.scope === "users") {
    try {
      const { data: accounts } = await admin
        .from("user_mail_accounts")
        .select("user_id, email, smtp_host, smtp_pass, imap_host, imap_port")
        .eq("active", true)
        .limit(50)
      let total = 0
      let synced = 0
      for (const a of accounts ?? []) {
        try {
          total += await syncMailbox(admin, {
            host: a.imap_host || a.smtp_host,
            port: a.imap_port ?? 993,
            user: a.email,
            pass: a.smtp_pass,
            ownerId: a.user_id,
          })
          synced++
        } catch (e) {
          console.error("[imap-sync users]", a.email, e instanceof Error ? e.message : e)
        }
      }
      return json({ ok: true, accounts: synced, stored: total })
    } catch (e) {
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502)
    }
  }

  const host = (await getSecret(admin, "IMAP_HOST")) ?? (await getSecret(admin, "SMTP_HOST"))
  const port = Number((await getSecret(admin, "IMAP_PORT")) ?? "993")
  const user = await getSecret(admin, "SMTP_USER")
  const pass = await getSecret(admin, "SMTP_PASS")
  if (!host || !user || !pass) return json({ error: "IMAP not configured" }, 400)
  try {
    const stored = await syncMailbox(admin, { host, port, user, pass, ownerId: null })
    return json({ ok: true, stored })
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502)
  }
})
