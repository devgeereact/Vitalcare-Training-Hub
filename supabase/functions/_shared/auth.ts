// Shared caller-authorisation for Edge Functions.
//
// Gateway verify_jwt only proves the JWT is signed by the project; the public
// anon key satisfies it. So privileged functions MUST verify the caller is a
// real staff user with the service-role client. Use requireStaff() at the top
// of any function that performs a privileged or paid action.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

const STAFF_ROLES = ["super_admin", "admin", "manager", "trainer", "content_editor"]

/**
 * Returns the caller's user id if they are an authenticated staff member,
 * otherwise null. Reads the bearer token and the profile role server-side.
 */
export async function requireStaff(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "")
  if (!token) return null
  const url = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !serviceKey) return null
  const admin = createClient(url, serviceKey)
  const { data: u, error } = await admin.auth.getUser(token)
  if (error || !u.user) return null
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single()
  if (!profile || !STAFF_ROLES.includes(profile.role as string)) return null
  return u.user.id
}

/**
 * The requireStaff role check for a known user id, for callers with no bearer
 * token (the Google OAuth callbacks, where the id comes from a verified signed
 * state). `admin` must be a service-role client.
 */
export async function isStaffUserId(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (!userId) return false
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  if (error || !profile) return false
  return STAFF_ROLES.includes((profile as { role: string }).role)
}
