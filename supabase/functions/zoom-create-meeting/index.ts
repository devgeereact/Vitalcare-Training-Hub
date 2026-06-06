// Supabase Edge Function: zoom-create-meeting
// Creates a Zoom meeting via Server-to-Server OAuth. Secrets stay server-side.
// Verify JWT ON — only signed-in staff schedule sessions.
//
// Deploy:  supabase functions deploy zoom-create-meeting
// Secrets: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET

import { requireStaff } from "../_shared/auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

async function getToken(): Promise<string | null> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID")
  const clientId = Deno.env.get("ZOOM_CLIENT_ID")
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET")
  if (!accountId || !clientId || !clientSecret) return null
  const basic = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  )
  if (!res.ok) {
    console.error("[zoom token]", res.status, await res.text())
    return null
  }
  const data = await res.json()
  return data.access_token ?? null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!(await requireStaff(req))) return json({ error: "Forbidden" }, 403)

  let body: { topic?: string; start_time?: string; duration?: number }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  const token = await getToken()
  if (!token) return json({ error: "Zoom not configured" }, 500)

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: body.topic ?? "Vitalcare training session",
      type: 2, // scheduled
      start_time: body.start_time,
      duration: body.duration ?? 60,
      settings: { join_before_host: true, waiting_room: true },
    }),
  })
  if (!res.ok) {
    console.error("[zoom meeting]", res.status, await res.text())
    return json({ error: "Could not create Zoom meeting" }, 502)
  }
  const m = await res.json()
  return json({
    id: String(m.id),
    join_url: m.join_url,
    start_url: m.start_url,
    password: m.password ?? null,
  })
})
