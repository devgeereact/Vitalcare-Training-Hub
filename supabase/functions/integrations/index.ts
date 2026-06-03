// Supabase Edge Function: integrations
// Super-admin self-serve API key management. Verify JWT ON.
// Reads/writes the locked integration_settings table via the service role.
// Never returns secret values — only whether each key is configured.
//
// Deploy: supabase functions deploy integrations
// Secrets: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getSecret } from "../_shared/secrets.ts"

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

// Catalogue of integrations and the secret names each one needs.
const CATALOGUE: { id: string; label: string; keys: string[] }[] = [
  { id: "resend", label: "Resend (email)", keys: ["RESEND_API_KEY", "RESEND_FROM"] },
  {
    id: "smtp",
    label: "SMTP (send via your own mail server)",
    keys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
  },
  {
    id: "imap",
    label: "IMAP (pull your inbox)",
    keys: ["IMAP_HOST", "IMAP_PORT"],
  },
  { id: "google_oauth", label: "Google sign-in", keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  {
    id: "google_meet",
    label: "Google Meet & Calendar",
    keys: ["GCAL_CALENDAR_ID", "GOOGLE_SA_JSON"],
  },
  { id: "zoom", label: "Zoom (backup video)", keys: ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"] },
  { id: "openweather", label: "OpenWeather", keys: ["OPENWEATHER_API_KEY"] },
  { id: "gemini", label: "Google AI / Gemini (primary)", keys: ["GOOGLE_AI_API_KEY", "GOOGLE_AI_MODEL"] },
  { id: "openrouter", label: "OpenRouter (AI fallback)", keys: ["OPENROUTER_API_KEY", "OR_MODEL"] },
  {
    id: "google_drive",
    label: "Google Drive (file storage)",
    keys: [
      "GDRIVE_API_KEY",
      "GDRIVE_CLIENT_ID",
      "GDRIVE_CLIENT_SECRET",
      "GDRIVE_REFRESH_TOKEN",
      "GDRIVE_FOLDER_ID",
    ],
  },
  { id: "webpush", label: "Web push notifications", keys: ["VAPID_JWK", "VAPID_SUBJECT"] },
  {
    id: "platform",
    label: "Platform & notifications",
    keys: ["APP_URL", "ADMIN_EMAIL", "ADMIN_EMAIL_SECONDARY", "CRON_SECRET"],
  },
]
const ALLOWED = new Set(CATALOGUE.flatMap((c) => c.keys))

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const url = Deno.env.get("SUPABASE_URL")!
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const admin = createClient(url, serviceKey)

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: "Unauthorised" }, 401)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || profile.role !== "super_admin") {
    return json({ error: "Forbidden" }, 403)
  }

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // list has no body
  }
  const action = String(body.action ?? "list")

  if (action === "list") {
    const { data: rows } = await admin.from("integration_settings").select("name")
    const inDb = new Set((rows ?? []).map((r: { name: string }) => r.name))
    const result = CATALOGUE.map((c) => ({
      ...c,
      keys: c.keys.map((k) => ({
        name: k,
        // configured if set in the DB table OR present as an env secret
        configured: inDb.has(k) || !!Deno.env.get(k),
      })),
    }))
    return json({ integrations: result })
  }

  if (action === "set") {
    const name = String(body.name ?? "")
    const value = String(body.value ?? "")
    if (!ALLOWED.has(name)) return json({ error: "Unknown key" }, 400)
    if (!value.trim()) return json({ error: "Empty value" }, 400)
    const { error } = await admin.from("integration_settings").upsert({
      name,
      value: value.trim(),
      updated_by: u.user.id,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.error("[integrations:set]", error)
      return json({ error: "Could not save" }, 500)
    }
    return json({ ok: true })
  }

  if (action === "drive_auth_url") {
    const clientId = await getSecret(admin, "GDRIVE_CLIENT_ID")
    if (!clientId) return json({ error: "Set GDRIVE_CLIENT_ID first" }, 400)
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri:
        "https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-drive-callback",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
    })
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
  }

  if (action === "remove") {
    const name = String(body.name ?? "")
    if (!ALLOWED.has(name)) return json({ error: "Unknown key" }, 400)
    const { error } = await admin.from("integration_settings").delete().eq("name", name)
    if (error) return json({ error: "Could not remove" }, 500)
    return json({ ok: true })
  }

  return json({ error: "Unknown action" }, 400)
})
