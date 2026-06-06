// Supabase Edge Function: gcal-sync-event
// Writes/updates an app training session as a Google Calendar event using a
// service account (free, no per-user OAuth). Service-account keys stay
// server-side. Verify JWT ON — only signed-in staff schedule sessions.
//
// Deploy:  supabase functions deploy gcal-sync-event
// Secrets:
//   GOOGLE_SA_JSON     full service-account JSON (from Google Cloud console)
//   GCAL_CALENDAR_ID   target calendar id; share it with the SA email (edit)
//
// Setup (in Google Cloud project vitalcare-396011):
//   1. Enable "Google Calendar API".
//   2. Create a service account + a JSON key.
//   3. Share the Google Calendar with the service-account email
//      ("Make changes to events"). Put the JSON in GOOGLE_SA_JSON.

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

function b64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data)
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "")
  const bin = atob(body)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  )
  const signingInput = `${header}.${claim}`
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  )
  const jwt = `${signingInput}.${b64url(sig)}`

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  if (!res.ok) {
    console.error("[gcal token]", res.status, await res.text())
    return null
  }
  return (await res.json()).access_token ?? null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!(await requireStaff(req))) return json({ error: "Forbidden" }, 403)

  const saRaw = Deno.env.get("GOOGLE_SA_JSON")
  const calendarId = Deno.env.get("GCAL_CALENDAR_ID")
  if (!saRaw || !calendarId) return json({ error: "Calendar sync not configured" }, 500)

  let sa: { client_email: string; private_key: string }
  try {
    sa = JSON.parse(saRaw)
  } catch {
    return json({ error: "Invalid service-account JSON" }, 500)
  }

  let body: {
    title?: string
    description?: string
    start?: string
    end?: string
    location?: string
    joinUrl?: string
    eventId?: string
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  if (!body.start || !body.end) return json({ error: "start/end required" }, 400)

  const token = await getAccessToken(sa)
  if (!token) return json({ error: "Calendar auth failed" }, 502)

  const description = [body.description, body.joinUrl ? `Join: ${body.joinUrl}` : ""]
    .filter(Boolean)
    .join("\n\n")
  const event = {
    summary: body.title ?? "Vitalcare training session",
    description,
    location: body.location || undefined,
    start: { dateTime: body.start, timeZone: "Europe/London" },
    end: { dateTime: body.end, timeZone: "Europe/London" },
  }

  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  const url = body.eventId ? `${base}/${body.eventId}` : base
  const method = body.eventId ? "PUT" : "POST"

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(event),
  })
  if (!res.ok) {
    const detail = await res.text()
    console.error("[gcal-sync-event]", res.status, detail)
    return json({ error: "Could not sync calendar", detail }, 502)
  }
  const created = await res.json()
  return json({ eventId: created.id, htmlLink: created.htmlLink })
})
