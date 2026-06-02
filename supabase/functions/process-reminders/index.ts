// Supabase Edge Function: process-reminders
// Cron-triggered. Turns due reminders into notifications (which fire web-push).
// Guarded by the shared CRON_SECRET header.
//
// Deploy: supabase functions deploy process-reminders --no-verify-jwt
// Secrets: CRON_SECRET, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } })

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
  const nowIso = new Date().toISOString()

  const { data: due } = await admin
    .from("reminders")
    .select("*")
    .eq("sent", false)
    .lte("remind_at", nowIso)
    .order("remind_at", { ascending: true })
    .limit(200)

  if (!due || due.length === 0) return json({ ok: true, fired: 0 })

  let fired = 0
  for (const r of due) {
    const { error } = await admin.from("notifications").insert({
      user_id: r.user_id,
      type: "info",
      title: r.title,
      body: r.body ?? null,
      link: r.link ?? "/platform/notifications",
    })
    if (!error) {
      await admin.from("reminders").update({ sent: true }).eq("id", r.id)
      fired++
    } else {
      console.error("[process-reminders]", error)
    }
  }
  return json({ ok: true, fired })
})
