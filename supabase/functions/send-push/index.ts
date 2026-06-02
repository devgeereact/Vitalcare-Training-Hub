// Supabase Edge Function: send-push
// Admin-gated web-push fan-out. Verify JWT ON. Caller must be staff.
// Sends a push to every stored subscription for the target users.
//
// Deploy: supabase functions deploy send-push
// Secrets: VAPID_JWK (JSON keypair), VAPID_SUBJECT (mailto:…),
//          SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as webpush from "https://esm.sh/jsr/@negrel/webpush@0.3.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const STAFF = ["admin", "super_admin", "manager"]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const vapidJwk = Deno.env.get("VAPID_JWK")
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:info@vitalcare.uk"
  if (!vapidJwk) return json({ error: "Push not configured" }, 500)

  const admin = createClient(url, serviceKey)
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: "Unauthorised" }, 401)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || !STAFF.includes(profile.role)) return json({ error: "Forbidden" }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  const title = String(body.title ?? "Vitalcare Training Hub")
  const message = String(body.body ?? "")
  const link = String(body.url ?? "/platform/notifications")
  const userIds = Array.isArray(body.userIds) ? body.userIds.map(String) : null

  let q = admin.from("push_subscriptions").select("endpoint, p256dh, auth, user_id")
  if (userIds && userIds.length) q = q.in("user_id", userIds)
  const { data: subs } = await q
  if (!subs || subs.length === 0) return json({ ok: true, sent: 0, total: 0 })

  const keys = await webpush.importVapidKeys(JSON.parse(vapidJwk), { extractable: false })
  const server = await webpush.ApplicationServer.new({
    contactInformation: subject,
    vapidKeys: keys,
  })
  const payload = JSON.stringify({ title, body: message, url: link })

  let sent = 0
  for (const s of subs) {
    try {
      const subscriber = server.subscribe({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      })
      await subscriber.pushTextMessage(payload, {})
      sent++
    } catch (err) {
      console.error("[send-push] drop", err)
      // Stale subscription — remove it so we stop trying.
      await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint)
    }
  }
  return json({ ok: true, sent, total: subs.length })
})
