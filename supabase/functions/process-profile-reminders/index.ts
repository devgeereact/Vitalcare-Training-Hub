// Supabase Edge Function: process-profile-reminders
// Cron-triggered (weekly). Notifies users whose profile is incomplete (missing
// name, phone or emergency contact), at most once every 7 days. The notification
// fires the usual in-app + web-push path.
//
// Deploy: supabase functions deploy process-profile-reminders --no-verify-jwt
// Secrets: CRON_SECRET, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } })

const blank = (v: string | null) => !v || v.trim() === ""

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

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, first_name, last_name, phone, emergency_contact_name, emergency_contact_phone")
    .is("deleted_at", null)
    .limit(5000)

  const incomplete = (profiles ?? []).filter(
    (p) =>
      blank(p.first_name) ||
      blank(p.last_name) ||
      blank(p.phone) ||
      blank(p.emergency_contact_name) ||
      blank(p.emergency_contact_phone),
  )
  if (incomplete.length === 0) return json({ ok: true, reminded: 0 })

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let reminded = 0
  for (const p of incomplete) {
    // Skip if we already nudged this user in the last 7 days.
    const { count } = await admin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", p.id)
      .eq("type", "system")
      .ilike("title", "Complete your profile%")
      .gte("created_at", weekAgo)
    if ((count ?? 0) > 0) continue

    const { error } = await admin.from("notifications").insert({
      user_id: p.id,
      type: "system",
      title: "Complete your profile",
      body: "Please add your phone number and an emergency contact in Settings.",
      link: "/platform/settings",
    })
    if (!error) reminded++
  }
  return json({ ok: true, reminded })
})
