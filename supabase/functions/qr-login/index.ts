// Supabase Edge Function: qr-login
// Mints a single-use magic-link for the AUTHENTICATED caller so they can sign in
// on a second device (e.g. their phone) by scanning a QR code of the link.
//
// Deploy:  supabase functions deploy qr-login
// Env (auto-provided in Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Security:
//  - The caller must already be authenticated; we mint the link for THEIR OWN
//    email only (never an arbitrary address).
//  - Magic links are short-lived and single-use (Supabase default), so a leaked
//    QR cannot be reused. The service-role key never leaves the server.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500)

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  if (!token) return json({ error: "Missing authorization" }, 401)

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user?.email) {
    return json({ error: "Not authenticated" }, 401)
  }
  const email = userData.user.email

  // Only allow redirecting back to our own app. An unvalidated redirectTo would
  // let an attacker craft a QR whose magic link (a real auth token) lands on
  // their domain, leaking the session.
  const appUrl = (Deno.env.get("APP_URL") ?? "https://vitalcare.uk").replace(/\/$/, "")
  function safeRedirect(raw: string): string {
    if (!raw) return ""
    try {
      if (raw.startsWith("/")) return appUrl + raw
      if (new URL(raw).origin === new URL(appUrl).origin) return raw
    } catch {
      /* malformed */
    }
    return ""
  }

  let redirectTo = ""
  try {
    const body = (await req.json()) as { redirectTo?: string }
    redirectTo = safeRedirect(typeof body?.redirectTo === "string" ? body.redirectTo : "")
  } catch {
    redirectTo = ""
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  })
  if (error || !data?.properties?.action_link) {
    console.error("[qr-login] generateLink", error)
    return json({ error: "Could not create sign-in link" }, 500)
  }

  return json({ url: data.properties.action_link, email })
})
