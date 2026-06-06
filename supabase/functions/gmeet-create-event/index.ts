// Supabase Edge Function: gmeet-create-event
// Creates a Google Calendar event WITH a Google Meet link, using the stored
// OAuth refresh token. Verify JWT ON — staff only.
//
// Deploy:  supabase functions deploy gmeet-create-event
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GCAL_CALENDAR_ID (optional;
//          defaults to the OAuth user's primary calendar)
//          (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY auto-provided)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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

async function accessTokenFromRefresh(refresh: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")
  if (!clientId || !clientSecret) return null
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    console.error("[gmeet refresh]", res.status, await res.text())
    return null
  }
  return (await res.json()).access_token ?? null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!(await requireStaff(req))) return json({ error: "Forbidden" }, 403)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json({ error: "Not configured" }, 500)

  let body: {
    title?: string
    description?: string
    start?: string
    end?: string
    location?: string
    withMeet?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (!body.start || !body.end) return json({ error: "start/end required" }, 400)
  const withMeet = body.withMeet !== false

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: tok } = await admin
    .from("google_oauth_tokens")
    .select("refresh_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!tok?.refresh_token) return json({ error: "Google not connected", notConnected: true }, 409)

  const accessToken = await accessTokenFromRefresh(tok.refresh_token)
  if (!accessToken) return json({ error: "Google auth failed" }, 502)

  const calendarId = Deno.env.get("GCAL_CALENDAR_ID") ?? "primary"
  const event: Record<string, unknown> = {
    summary: body.title ?? "Vitalcare training session",
    description: body.description ?? "",
    location: body.location || undefined,
    start: { dateTime: body.start, timeZone: "Europe/London" },
    end: { dateTime: body.end, timeZone: "Europe/London" },
  }
  if (withMeet) {
    event.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    },
  )
  if (!res.ok) {
    const detail = await res.text()
    console.error("[gmeet-create-event]", res.status, detail)
    return json({ error: "Could not create event", detail }, 502)
  }
  const created = await res.json()
  const meetUrl =
    created.hangoutLink ??
    created.conferenceData?.entryPoints?.find((e: { entryPointType: string; uri: string }) => e.entryPointType === "video")?.uri ??
    null

  return json({ eventId: created.id, htmlLink: created.htmlLink, meetUrl })
})
