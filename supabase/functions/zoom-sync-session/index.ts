// Supabase Edge Function: zoom-sync-session
// Staff-gated. For a session with a Zoom meeting, pulls past-meeting participants
// (auto-marks attendance by matching emails) and the cloud recording URL.
//
// Deploy: supabase functions deploy zoom-sync-session
// Secrets: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, SUPABASE_* (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

const STAFF = ["admin", "super_admin", "manager", "trainer"]

async function zoomToken(): Promise<string | null> {
  const accountId = Deno.env.get("ZOOM_ACCOUNT_ID")
  const clientId = Deno.env.get("ZOOM_CLIENT_ID")
  const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET")
  if (!accountId || !clientId || !clientSecret) return null
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` } },
  )
  if (!res.ok) return null
  return (await res.json()).access_token ?? null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u } = await admin.auth.getUser(token)
  if (!u.user) return json({ error: "Unauthorised" }, 401)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || !STAFF.includes(profile.role)) return json({ error: "Forbidden" }, 403)

  let body: { sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (!body.sessionId) return json({ error: "Missing sessionId" }, 400)

  const { data: session } = await admin
    .from("training_sessions")
    .select("id, zoom_meeting_id")
    .eq("id", body.sessionId)
    .single()
  if (!session?.zoom_meeting_id) {
    return json({ error: "No Zoom meeting on this session" }, 400)
  }

  const zt = await zoomToken()
  if (!zt) return json({ error: "Zoom not configured" }, 500)
  const mid = session.zoom_meeting_id
  const auth = { Authorization: `Bearer ${zt}` }

  // 1) Participants -> mark attendance by email.
  let marked = 0
  let participantsError: string | null = null
  const pRes = await fetch(
    `https://api.zoom.us/v2/report/meetings/${mid}/participants?page_size=300`,
    { headers: auth },
  )
  if (pRes.ok) {
    const data = await pRes.json()
    const emails = [
      ...new Set(
        (data.participants ?? [])
          .map((p: { user_email?: string }) => (p.user_email || "").toLowerCase())
          .filter(Boolean),
      ),
    ] as string[]
    if (emails.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email")
        .in("email", emails)
      for (const p of profiles ?? []) {
        const { error } = await admin.from("attendance_records").upsert(
          {
            session_id: body.sessionId,
            learner_id: p.id,
            status: "present",
            marked_by: u.user.id,
            marked_at: new Date().toISOString(),
          },
          { onConflict: "session_id,learner_id" },
        )
        if (!error) marked++
      }
    }
  } else {
    participantsError = `${pRes.status} ${await pRes.text()}`.slice(0, 200)
  }

  // 2) Cloud recording URL.
  let recordingUrl: string | null = null
  const rRes = await fetch(`https://api.zoom.us/v2/meetings/${mid}/recordings`, { headers: auth })
  if (rRes.ok) {
    const data = await rRes.json()
    recordingUrl = data.share_url || data.recording_files?.[0]?.play_url || null
    if (recordingUrl) {
      await admin
        .from("training_sessions")
        .update({ recording_url: recordingUrl })
        .eq("id", body.sessionId)
    }
  }

  return json({
    ok: true,
    attendanceMarked: marked,
    recording: !!recordingUrl,
    participantsError,
  })
})
