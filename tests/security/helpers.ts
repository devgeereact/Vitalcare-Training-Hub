import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Real clients, signed in as real accounts, against a real Supabase project.
 *
 * Authorisation cannot be proved with mocks. The thing under test is the
 * database's own row-level security, so a mocked client would only ever test
 * the mock. These sign in properly and read what the policies allow.
 *
 * Credentials come from the environment. Nothing is hard-coded, and the suite
 * skips rather than fails when they are absent, so a contributor without access
 * to the project can still run the unit tests.
 */

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ""
export const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ""

/**
 * These suites create courses, orders, attempts and certificates. Run against
 * the live project they leave fixtures in the register real people read, and a
 * mistyped environment file is all it takes.
 *
 * A loopback target needs no ceremony. Any other target has to be confirmed on
 * purpose, by setting SECURITY_SUITE_TARGET_CONFIRMED=1 for that run.
 */
function isLoopback(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1"
  } catch {
    return false
  }
}

export const TARGET_IS_LOCAL = isLoopback(SUPABASE_URL)

export const TARGET_CONFIRMED =
  TARGET_IS_LOCAL || process.env.SECURITY_SUITE_TARGET_CONFIRMED === "1"

export const UNCONFIRMED_TARGET_REASON =
  `${SUPABASE_URL || "no VITE_SUPABASE_URL"} is not a local database. These ` +
  "suites write fixtures. Point them at an isolated stack, or set " +
  "SECURITY_SUITE_TARGET_CONFIRMED=1 to run them against this target on purpose."

/**
 * "otherUser" is a second, non-staff account used to prove that one signed-in
 * person cannot read another's records. It does not have to be a learner: the
 * manager and content_editor roles are not staff for row-level security either,
 * so any of them exercises the same boundary.
 */
export type Role =
  | "superAdmin"
  | "admin"
  | "trainer"
  | "learner"
  | "otherUser"

const ACCOUNTS: Record<Role, { emailVar: string; passwordVar: string }> = {
  superAdmin: { emailVar: "TEST_SUPER_ADMIN_EMAIL", passwordVar: "TEST_SUPER_ADMIN_PASSWORD" },
  admin: { emailVar: "TEST_ADMIN_EMAIL", passwordVar: "TEST_ADMIN_PASSWORD" },
  trainer: { emailVar: "TEST_TRAINER_EMAIL", passwordVar: "TEST_TRAINER_PASSWORD" },
  learner: { emailVar: "TEST_LEARNER_EMAIL", passwordVar: "TEST_LEARNER_PASSWORD" },
  otherUser: {
    emailVar: "TEST_OTHER_USER_EMAIL",
    passwordVar: "TEST_OTHER_USER_PASSWORD",
  },
}

export function credentialsFor(role: Role): { email: string; password: string } | null {
  const { emailVar, passwordVar } = ACCOUNTS[role]
  const email = process.env[emailVar]
  const password = process.env[passwordVar]
  if (!email || !password) return null
  return { email, password }
}

/**
 * True when the project URL, key and every listed account are configured, and
 * the target has been confirmed as somewhere it is safe to write fixtures.
 */
export function canRun(...roles: Role[]): boolean {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false
  if (!TARGET_CONFIRMED) {
    console.warn(`[security suite] ${UNCONFIRMED_TARGET_REASON}`)
    return false
  }
  return roles.every((r) => credentialsFor(r) !== null)
}

export interface Session {
  client: SupabaseClient
  userId: string
  email: string
}

export async function signInAs(role: Role): Promise<Session> {
  const creds = credentialsFor(role)
  if (!creds) throw new Error(`No credentials configured for ${role}`)
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword(creds)
  if (error || !data.user) {
    throw new Error(`Sign-in failed for ${role}: ${error?.message ?? "no user"}`)
  }
  return { client, userId: data.user.id, email: creds.email }
}

/** A client with no session at all, i.e. an anonymous visitor. */
export function anonymousClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Message explaining a skip, so a skipped suite is never mistaken for a pass. */
export const SKIP_REASON =
  "Set VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and the TEST_* account " +
  "credentials, pointed at an isolated database, to run the authorisation " +
  "suite. Skipped is not passed."
