// Off-edge IMAP worker — pulls the org inbox into Supabase with clean bodies
// and attachments. Runs on GitHub Actions (reliable Node networking), not on
// Supabase Edge (where imapflow's TLS aborts the isolate).
//
// Env: IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS,
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/imap-pull.mjs

import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"
import WebSocket from "ws"
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

// supabase-js eagerly inits realtime which needs a global WebSocket.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket

const {
  IMAP_HOST,
  IMAP_PORT = "993",
  IMAP_USER,
  IMAP_PASS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

const missing = Object.entries({
  IMAP_HOST,
  IMAP_USER,
  IMAP_PASS,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
})
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (missing.length) {
  console.error("Missing secrets:", missing.join(", "))
  process.exit(1)
}
console.log(
  `Config: host=${IMAP_HOST} port=${IMAP_PORT} user=${IMAP_USER} supabase=${(SUPABASE_URL || "").slice(0, 30)}`,
)

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const BUCKET = "course-media"

function safeName(name) {
  return (name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .slice(0, 60)
}

async function run() {
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: Number(IMAP_PORT),
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  })
  await client.connect()
  const lock = await client.getMailboxLock("INBOX")
  let stored = 0
  try {
    const total = client.mailbox?.exists ?? 0
    if (total > 0) {
      const start = Math.max(1, total - 29)
      for await (const msg of client.fetch(`${start}:*`, { uid: true, source: true })) {
        const parsed = await simpleParser(msg.source)
        const messageId = parsed.messageId || `uid-org-${msg.uid}`

        // Upload attachments.
        const attachments = []
        for (const att of parsed.attachments || []) {
          if (!att.content || att.related) continue
          const path = `mail/${randomUUID()}-${safeName(att.filename)}`
          const { error: upErr } = await admin.storage
            .from(BUCKET)
            .upload(path, att.content, {
              contentType: att.contentType || "application/octet-stream",
              upsert: false,
            })
          if (!upErr) {
            const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
            attachments.push({
              name: att.filename || "attachment",
              url: data.publicUrl,
              size: att.size || att.content.length,
              type: att.contentType || "",
            })
          }
        }

        const text = (parsed.text || "").trim()
        const html = parsed.html || ""
        const { error } = await admin.from("mail_messages").upsert(
          {
            message_id: messageId,
            uid: msg.uid,
            owner_id: null,
            from_name: parsed.from?.value?.[0]?.name || null,
            from_addr: parsed.from?.value?.[0]?.address || null,
            subject: parsed.subject || "(no subject)",
            snippet: text.replace(/\s+/g, " ").slice(0, 200),
            body_text: text.slice(0, 100000),
            body_html: (html || "").slice(0, 200000),
            has_attachments: attachments.length > 0,
            attachments,
            received_at: parsed.date ? parsed.date.toISOString() : null,
          },
          { onConflict: "message_id" },
        )
        if (!error) stored++
        else console.error("upsert", error.message)
      }
    }
  } finally {
    lock.release()
  }
  await client.logout()
  console.log(`Synced ${stored} message(s)`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
