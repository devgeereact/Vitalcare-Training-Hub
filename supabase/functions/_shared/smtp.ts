// Shared SMTP sender for Edge Functions, using denomailer. Reads SMTP_* from
// integration_settings (DB-first) via getSecret. Returns false when SMTP is not
// configured so callers can fall back to Resend.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "./secrets.ts"

export interface SmtpResult {
  configured: boolean
  sent: number
  error?: string
}

export async function sendViaSmtp(
  admin: SupabaseClient,
  msg: { to: string[]; subject: string; html: string; from?: string },
): Promise<SmtpResult> {
  const host = await getSecret(admin, "SMTP_HOST")
  const portRaw = await getSecret(admin, "SMTP_PORT")
  const user = await getSecret(admin, "SMTP_USER")
  const pass = await getSecret(admin, "SMTP_PASS")
  const from =
    msg.from ??
    (await getSecret(admin, "SMTP_FROM")) ??
    (await getSecret(admin, "RESEND_FROM")) ??
    user
  if (!host || !user || !pass || !from) return { configured: false, sent: 0 }

  const port = Number(portRaw || "465")
  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  })

  let sent = 0
  let error: string | undefined
  try {
    for (const to of msg.to) {
      await client.send({ from, to, subject: msg.subject, html: msg.html })
      sent++
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
    console.error("[sendViaSmtp]", error)
  } finally {
    try {
      await client.close()
    } catch {
      // ignore
    }
  }
  return { configured: true, sent, error }
}
