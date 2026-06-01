// Supabase Edge Function: admin-create-learners
// Creates learner auth users (service role) so admins can add/import learners.
// profiles rows are created by the on_auth_user_created trigger; this function
// then patches phone / organisation_id when supplied.
//
// Deploy:  supabase functions deploy admin-create-learners
// Env (auto-provided in Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Security: verifies the CALLER is an admin/super_admin before creating anyone.
// The service-role key never leaves the server.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface LearnerInput {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  organisation_id?: string
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function randomPassword() {
  // Temporary password; learners reset via the forgot-password flow.
  return crypto.randomUUID() + "Aa1!"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server not configured" }, 500)
  }

  // Verify caller is an admin using their bearer token.
  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.replace("Bearer ", "")
  if (!token) return json({ error: "Missing authorization" }, 401)

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401)

  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single()

  if (!caller || !["admin", "super_admin"].includes(caller.role)) {
    return json({ error: "Forbidden: admin role required" }, 403)
  }

  let learners: LearnerInput[]
  try {
    const body = await req.json()
    learners = Array.isArray(body?.learners) ? body.learners : []
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  if (learners.length === 0) return json({ error: "No learners provided" }, 400)
  if (learners.length > 500) return json({ error: "Max 500 per request" }, 400)

  const created: string[] = []
  const errors: { email: string; error: string }[] = []

  for (const l of learners) {
    const email = (l.email ?? "").trim().toLowerCase()
    if (!email) {
      errors.push({ email: "(blank)", error: "Missing email" })
      continue
    }
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: {
        first_name: l.first_name ?? "",
        last_name: l.last_name ?? "",
      },
    })

    if (createErr || !newUser.user) {
      errors.push({ email, error: createErr?.message ?? "Create failed" })
      continue
    }

    // Patch profile extras (trigger already created the row with role 'learner').
    const patch: Record<string, unknown> = {}
    if (l.phone) patch.phone = l.phone
    if (l.organisation_id) patch.organisation_id = l.organisation_id
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", newUser.user.id)
    }
    created.push(email)
  }

  return json({ created: created.length, errors })
})
