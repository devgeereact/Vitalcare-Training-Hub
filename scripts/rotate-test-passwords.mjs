#!/usr/bin/env node
/**
 * Rotate the passwords on the shared test accounts.
 *
 * These credentials were published: CLAUDE.md printed the super_admin
 * password, in a public repository, and it remains in the git history where
 * anyone can still read it. Removing the line does not unpublish it. Rotation
 * is the only thing that actually closes the exposure.
 *
 * Each account signs in with its current password and changes it through the
 * Auth API, so no service-role key is needed. The new passwords are printed
 * once, to this terminal, and are written nowhere: copy them into the password
 * manager and into .env.test.local before you close the window.
 *
 * Usage:
 *   node scripts/rotate-test-passwords.mjs             # show what would change
 *   node scripts/rotate-test-passwords.mjs --apply     # rotate
 *
 * Reads the current passwords from .env.test.local (the TEST_*_PASSWORD
 * variables), so run it from the project root.
 */
import { randomBytes } from "node:crypto"
import { readFileSync } from "node:fs"

const APPLY = process.argv.includes("--apply")

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // Missing file is fine if the values are already in the environment.
  }
}
loadEnv(".env.local")
loadEnv(".env.test.local")

const URL_BASE = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!URL_BASE || !ANON) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.")
  process.exit(1)
}

/** Which accounts to rotate, and where each one's current password comes from. */
const ACCOUNTS = [
  ["TEST_SUPER_ADMIN_EMAIL", "TEST_SUPER_ADMIN_PASSWORD"],
  ["TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD"],
  ["TEST_TRAINER_EMAIL", "TEST_TRAINER_PASSWORD"],
  ["TEST_LEARNER_EMAIL", "TEST_LEARNER_PASSWORD"],
  ["TEST_OTHER_USER_EMAIL", "TEST_OTHER_USER_PASSWORD"],
]

/** A password long enough that the published one being guessable stops mattering. */
function generate() {
  return randomBytes(24).toString("base64url")
}

async function signIn(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`sign-in failed (${res.status})`)
  return (await res.json()).access_token
}

async function changePassword(token, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error(`change failed (${res.status}): ${await res.text()}`)
}

async function main() {
  const rows = []
  for (const [emailVar, passwordVar] of ACCOUNTS) {
    const email = process.env[emailVar]
    const current = process.env[passwordVar]
    if (!email || !current) {
      console.error(`! ${emailVar} or ${passwordVar} is not set; skipping.`)
      continue
    }
    rows.push({ emailVar, passwordVar, email, current, next: generate() })
  }

  if (rows.length === 0) {
    console.error("Nothing to rotate. Populate .env.test.local first.")
    process.exit(1)
  }

  if (!APPLY) {
    console.log("Would rotate:")
    for (const r of rows) console.log(`  ${r.email}`)
    console.log("\nRe-run with --apply. The new passwords print once and are saved nowhere.")
    return
  }

  const done = []
  for (const r of rows) {
    try {
      const token = await signIn(r.email, r.current)
      await changePassword(token, r.next)
      done.push(r)
      console.log(`rotated  ${r.email}`)
    } catch (err) {
      console.error(`FAILED   ${r.email}: ${err.message}`)
      process.exitCode = 1
    }
  }

  if (done.length === 0) return

  console.log(
    "\n" +
      "-".repeat(72) +
      "\nNew passwords. Printed once. Copy them into the password manager and\n" +
      "into .env.test.local now, then set the matching repository secrets.\n" +
      "-".repeat(72),
  )
  for (const r of done) {
    console.log(`${r.passwordVar}=${r.next}`)
  }
  console.log(
    "\nSet the CI secrets with:\n" +
      done
        .map((r) => `  gh secret set ${r.passwordVar} --body '${"<paste>"}'`)
        .join("\n"),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
