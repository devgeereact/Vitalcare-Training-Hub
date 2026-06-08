// Cloudflare Turnstile server-side verification for public edge functions.
// The secret is read via getSecret (integration_settings or env). When no
// secret is configured, verification is skipped so the form still works in
// development; set TURNSTILE_SECRET in production to enforce it.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "./secrets.ts"

export async function verifyTurnstile(
  admin: SupabaseClient,
  token: string | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = await getSecret(admin, "TURNSTILE_SECRET")
  if (!secret) return true // not configured -> do not block
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.append("remoteip", remoteIp)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    const data = await res.json()
    return data?.success === true
  } catch (err) {
    console.error("[verifyTurnstile]", err)
    return false
  }
}
