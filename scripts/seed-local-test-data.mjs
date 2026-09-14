/**
 * Seed the isolated local Supabase stack with synthetic accounts.
 *
 * The authorisation and learner-journey suites write fixtures. They must never
 * run against the live project, so this script refuses any target that is not
 * on the loopback address, and the accounts it creates use the reserved
 * `.test` domain, which cannot receive real mail.
 *
 * Usage, after `supabase start` and applying the migrations:
 *
 *   LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
 *   LOCAL_SERVICE_ROLE_KEY=<local secret key from `supabase status`> \
 *   LOCAL_TEST_PASSWORD=<any strong string> \
 *   node scripts/seed-local-test-data.mjs
 *
 * The local secret key is a fixed development value printed by the CLI. It is
 * not a production credential and grants nothing outside this machine.
 */
import { createClient } from "@supabase/supabase-js"

const URL = process.env.LOCAL_SUPABASE_URL
const SERVICE = process.env.LOCAL_SERVICE_ROLE_KEY
if (!URL || !SERVICE) throw new Error("LOCAL_SUPABASE_URL and LOCAL_SERVICE_ROLE_KEY are required")
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(URL)) {
  throw new Error(`Refusing to seed a non-local target: ${URL}`)
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

const ACCOUNTS = [
  ["qa.superadmin@vitalcare.test", "super_admin", "Sam", "Superadmin"],
  ["qa.admin@vitalcare.test", "admin", "Ada", "Adminson"],
  ["qa.trainer@vitalcare.test", "trainer", "Tim", "Trainer"],
  ["qa.learner@vitalcare.test", "learner", "Lee", "Learner"],
  ["qa.other@vitalcare.test", "learner", "Ola", "Otherlearner"],
  ["qa.manager@vitalcare.test", "manager", "Mo", "Manager"],
]
const PASSWORD = process.env.LOCAL_TEST_PASSWORD
if (!PASSWORD) throw new Error("LOCAL_TEST_PASSWORD is required")

/** Every existing user, paged, so a re-run updates rather than duplicates. */
async function existingUsers() {
  const found = new Map()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const users = data?.users ?? []
    for (const u of users) if (u.email) found.set(u.email.toLowerCase(), u)
    if (users.length < 100) break
  }
  return found
}

const byEmail = await existingUsers()

for (const [email, role, first, last] of ACCOUNTS) {
  let user = byEmail.get(email.toLowerCase())
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: first, last_name: last },
    })
    if (error) throw new Error(`${email}: ${error.message}`)
    user = data.user
  } else {
    await admin.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true })
  }
  const { error: pErr } = await admin
    .from("profiles")
    // full_name is a generated column; setting first/last is enough.
    .update({ role, first_name: first, last_name: last })
    .eq("id", user.id)
  if (pErr) throw new Error(`${email} profile: ${pErr.message}`)
  console.log(`${email} -> ${role} (${user.id})`)
}
console.log("seed complete")
