// Supabase Edge Function: drive-list
// Staff-gated. Lists the contents of the connected Google Drive folder
// (scope drive.file — only files this app created/uploaded are visible) and
// returns lightweight metadata. The client groups these into type folders.
//
// Deploy: supabase functions deploy drive-list
// Settings: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN,
//           GDRIVE_FOLDER_ID (optional)

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

const STAFF = ["admin", "super_admin", "manager", "trainer"]

async function accessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    console.error("[drive-list] token", res.status, await res.text())
    return null
  }
  return (await res.json()).access_token ?? null
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Auth: staff only.
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: "Unauthorised" }, 401)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || !STAFF.includes(profile.role)) return json({ error: "Forbidden" }, 403)

  const clientId = await getSecret(admin, "GDRIVE_CLIENT_ID")
  const clientSecret = await getSecret(admin, "GDRIVE_CLIENT_SECRET")
  const refreshToken = await getSecret(admin, "GDRIVE_REFRESH_TOKEN")
  const folderId = await getSecret(admin, "GDRIVE_FOLDER_ID")
  if (!clientId || !clientSecret || !refreshToken) {
    return json({ error: "Drive not connected", notConfigured: true }, 400)
  }

  const at = await accessToken(clientId, clientSecret, refreshToken)
  if (!at) return json({ error: "Could not refresh Drive token" }, 502)

  // Page through the folder (or the whole drive.file scope when no folder set).
  const files: DriveFile[] = []
  let pageToken: string | undefined
  const q = folderId
    ? `'${folderId}' in parents and trashed = false`
    : "trashed = false"
  do {
    const params = new URLSearchParams({
      q,
      pageSize: "200",
      fields:
        "nextPageToken, files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink)",
      orderBy: "modifiedTime desc",
    })
    if (pageToken) params.set("pageToken", pageToken)
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers: { Authorization: `Bearer ${at}` } },
    )
    if (!res.ok) {
      console.error("[drive-list] list", res.status, await res.text())
      return json({ error: "Drive listing failed" }, 502)
    }
    const body = await res.json()
    for (const f of (body.files ?? []) as DriveFile[]) {
      // Skip Drive's own folder objects.
      if (f.mimeType === "application/vnd.google-apps.folder") continue
      files.push(f)
    }
    pageToken = body.nextPageToken
  } while (pageToken)

  return json({ ok: true, files })
})
