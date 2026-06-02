// Supabase Edge Function: process-certificate-expiry
// Alerts certificate owners when a certificate is within 30 days of expiry,
// and again on expiry. Delegates to the notify_expiring_certificates() SQL
// function, which inserts notification rows (the notifications insert trigger
// fires the web-push) and dedupes via certificate_expiry_alerts.
//
// A pg_cron schedule (migration 033) already runs the same SQL function daily,
// so this function exists for manual or external triggering only.
//
// Deploy: supabase functions deploy process-certificate-expiry --no-verify-jwt
// Secrets: CRON_SECRET, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const secret = Deno.env.get("CRON_SECRET")
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return json({ error: "Forbidden" }, 403)
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data, error } = await admin.rpc("notify_expiring_certificates")
  if (error) {
    console.error("[process-certificate-expiry]", error)
    return json({ error: "Failed to process expiry alerts" }, 500)
  }

  return json({ ok: true, created: data ?? 0 })
})
