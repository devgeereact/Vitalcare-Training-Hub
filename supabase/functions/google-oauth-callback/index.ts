// Supabase Edge Function: google-oauth-callback
// OAuth redirect target. Exchanges the auth code for a refresh token and stores
// it (service role). Public — Google calls this, no Supabase JWT.
//
// Deploy:  supabase functions deploy google-oauth-callback --no-verify-jwt
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, OAUTH_STATE_SECRET
//          (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-provided)
// Add this function URL as an Authorised redirect URI on the OAuth client:
//   https://<project>.supabase.co/functions/v1/google-oauth-callback
//
// `state` is signed by the integrations function (action calendar_oauth_state,
// super-admin only). Unsigned, expired or Drive-purpose states are refused
// before the code is exchanged, and the signer must still be staff.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { isStaffUserId } from "../_shared/auth.ts"
import { requireOAuthStateSecret, verifyOAuthState } from "../_shared/oauth-state.ts"

const REDIRECT_URI =
  "https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-oauth-callback"

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state") ?? "" // signed, see _shared/oauth-state.ts
  const appUrl = Deno.env.get("APP_URL") ?? "https://vitalcare.uk"

  if (!code) return redirect(`${appUrl}/platform/settings?google=error`)

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) {
    return redirect(`${appUrl}/platform/settings?google=error`)
  }

  // Fail closed: without the secret no state can be trusted.
  let stateSecret: string
  try {
    stateSecret = requireOAuthStateSecret(Deno.env.get("OAUTH_STATE_SECRET"))
  } catch (err) {
    console.error("[google-oauth-callback]", err instanceof Error ? err.message : err)
    return redirect(`${appUrl}/platform/settings?google=error`)
  }
  const verified = await verifyOAuthState(stateSecret, state, "calendar")
  if (!verified.ok) {
    console.error("[google-oauth-callback] state rejected:", verified.reason)
    return redirect(`${appUrl}/platform/settings?google=error`)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  if (!(await isStaffUserId(admin, verified.userId))) {
    console.error("[google-oauth-callback] state signer is not staff")
    return redirect(`${appUrl}/platform/settings?google=error`)
  }

  // Exchange code -> tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  })
  if (!tokenRes.ok) {
    console.error("[google-oauth-callback] token", tokenRes.status, await tokenRes.text())
    return redirect(`${appUrl}/platform/settings?google=error`)
  }
  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    // No refresh token (user already consented before without prompt=consent)
    return redirect(`${appUrl}/platform/settings?google=norefresh`)
  }

  // Optional: connected email
  let email: string | null = null
  try {
    const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (me.ok) email = (await me.json()).email ?? null
  } catch {
    // ignore
  }

  await admin.from("google_oauth_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await admin.from("google_oauth_tokens").insert({
    refresh_token: tokens.refresh_token,
    scope: tokens.scope ?? null,
    connected_email: email,
    connected_by: verified.userId,
  })

  return redirect(`${appUrl}/platform/settings?google=connected`)
})
