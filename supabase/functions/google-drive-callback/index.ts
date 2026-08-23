// Supabase Edge Function: google-drive-callback
// OAuth redirect target for Google Drive. Exchanges the auth code for a refresh
// token and stores it in integration_settings (service role). Public — Google
// calls this, no Supabase JWT.
//
// Deploy:  supabase functions deploy google-drive-callback --no-verify-jwt
// Settings used (integration_settings or env): GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET
// Register this URL as an Authorised redirect URI on the Drive OAuth client:
//   https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-drive-callback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "../_shared/secrets.ts"

const REDIRECT_URI =
  "https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-drive-callback"

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const appUrl = Deno.env.get("APP_URL") ?? "https://vitalcare.uk"
  const dest = `${appUrl}/platform/settings/integrations`

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  if (!code) return redirect(`${dest}?drive=error`)

  const clientId = await getSecret(admin, "GDRIVE_CLIENT_ID")
  const clientSecret = await getSecret(admin, "GDRIVE_CLIENT_SECRET")
  if (!clientId || !clientSecret) return redirect(`${dest}?drive=noclient`)

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
    console.error("[google-drive-callback] token", tokenRes.status, await tokenRes.text())
    return redirect(`${dest}?drive=error`)
  }
  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) return redirect(`${dest}?drive=norefresh`)

  await admin.from("integration_settings").upsert({
    name: "GDRIVE_REFRESH_TOKEN",
    value: tokens.refresh_token,
    updated_at: new Date().toISOString(),
  })

  return redirect(`${dest}?drive=connected`)
})
