// Supabase Edge Function: drive-delete
// Staff-gated. Deletes a file from the connected Google Drive (scope
// drive.file — only files this app created can be removed).
//
// Deploy: supabase functions deploy drive-delete
// Settings: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN

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
    console.error("[drive-delete] token", res.status, await res.text())
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

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: "Unauthorised" }, 401)
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || !STAFF.includes(profile.role)) return json({ error: "Forbidden" }, 403)

  let id: string | undefined
  try {
    id = (await req.json())?.id
  } catch (err) {
    console.error("[drive-delete] body", err)
  }
  if (!id) return json({ error: "Missing file id" }, 400)

  const clientId = await getSecret(admin, "GDRIVE_CLIENT_ID")
  const clientSecret = await getSecret(admin, "GDRIVE_CLIENT_SECRET")
  const refreshToken = await getSecret(admin, "GDRIVE_REFRESH_TOKEN")
  if (!clientId || !clientSecret || !refreshToken) {
    return json({ error: "Drive not connected", notConfigured: true }, 400)
  }

  const at = await accessToken(clientId, clientSecret, refreshToken)
  if (!at) return json({ error: "Could not refresh Drive token" }, 502)

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${at}` },
  })
  if (!res.ok && res.status !== 404) {
    console.error("[drive-delete] delete", res.status, await res.text())
    return json({ error: "Drive delete failed" }, 502)
  }

  return json({ ok: true })
})
