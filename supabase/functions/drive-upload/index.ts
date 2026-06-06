// Supabase Edge Function: drive-upload
// Staff-gated. Uploads a file to the connected Google Drive folder (scope
// drive.file), makes it readable by anyone with the link, and returns a public
// URL. Falls back is handled client-side (Supabase Storage) when Drive is not
// configured.
//
// Deploy: supabase functions deploy drive-upload
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
    console.error("[drive-upload] token", res.status, await res.text())
    return null
  }
  return (await res.json()).access_token ?? null
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
  const reviewFolderId = await getSecret(admin, "GDRIVE_REVIEW_FOLDER_ID")
  if (!clientId || !clientSecret || !refreshToken) {
    return json({ error: "Drive not connected", notConfigured: true }, 400)
  }

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return json({ error: "No file" }, 400)
  if (file.size > 50 * 1024 * 1024) return json({ error: "File too large (50MB max)" }, 400)

  // target=review routes course/assessment review docs to the dedicated review
  // folder when one is configured; everything else uses the default folder.
  const target = form.get("target")
  const destFolderId =
    target === "review" && reviewFolderId ? reviewFolderId : folderId

  const at = await accessToken(clientId, clientSecret, refreshToken)
  if (!at) return json({ error: "Could not refresh Drive token" }, 502)

  // Multipart upload (metadata + bytes).
  const meta: Record<string, unknown> = { name: file.name }
  if (destFolderId) meta.parents = [destFolderId]
  const boundary = `vc${crypto.randomUUID()}`
  const enc = new TextEncoder()
  const pre = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
  )
  const post = enc.encode(`\r\n--${boundary}--`)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const body = new Uint8Array(pre.length + bytes.length + post.length)
  body.set(pre, 0)
  body.set(bytes, pre.length)
  body.set(post, pre.length + bytes.length)

  const up = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${at}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  if (!up.ok) {
    console.error("[drive-upload] upload", up.status, await up.text())
    return json({ error: "Drive upload failed" }, 502)
  }
  const { id } = await up.json()

  // Make readable by anyone with the link.
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  })

  return json({
    ok: true,
    id,
    url: `https://drive.google.com/uc?export=view&id=${id}`,
  })
})
