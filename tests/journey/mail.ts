/**
 * The local stack's mail catcher (Mailpit), so the rehearsal can follow a
 * confirmation or reset link the way a person would.
 *
 * Nothing here ever reaches a real inbox: `supabase start` runs its own SMTP
 * sink, and the accounts use the reserved `.test` domain.
 */
const MAIL_URL = process.env.JOURNEY_MAIL_URL ?? "http://127.0.0.1:54324"

interface MailSummary {
  ID: string
  To: Array<{ Address: string }>
  Subject: string
  Created: string
}

/** Delete every captured message, so a later search cannot match an old one. */
export async function clearMailbox(): Promise<void> {
  await fetch(`${MAIL_URL}/api/v1/messages`, { method: "DELETE" })
}

/** Wait for a message addressed to `to`, newest first. */
export async function waitForMessage(
  to: string,
  timeoutMs = 20_000,
): Promise<MailSummary> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`${MAIL_URL}/api/v1/messages?limit=50`)
    if (res.ok) {
      const body = (await res.json()) as { messages?: MailSummary[] }
      const match = (body.messages ?? []).find((m) =>
        m.To?.some((t) => t.Address.toLowerCase() === to.toLowerCase()),
      )
      if (match) return match
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`No message for ${to} within ${timeoutMs}ms`)
}

/** The first link in a message that points at the Auth verify endpoint. */
export async function confirmationLink(id: string): Promise<string> {
  const res = await fetch(`${MAIL_URL}/api/v1/message/${id}`)
  if (!res.ok) throw new Error(`Could not read message ${id}`)
  const body = (await res.json()) as { HTML?: string; Text?: string }
  const source = `${body.HTML ?? ""}\n${body.Text ?? ""}`
  const match = source.match(/https?:\/\/[^\s"'<>]*\/auth\/v1\/verify[^\s"'<>]*/)
  if (!match) {
    throw new Error(`No verification link in message ${id}`)
  }
  return match[0].replace(/&amp;/g, "&")
}
