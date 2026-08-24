#!/usr/bin/env node
/**
 * Give an expiry date to certificates that were issued before the course had a
 * renewal period.
 *
 * Certificates issued through `issue_course_certificate` never carried an
 * expiry until migration 093, and a course only has a renewal period once
 * somebody sets one. This fills the gap for the certificates already in the
 * register, measured from their original issue date, so the daily expiry-alert
 * job has something to find.
 *
 * Idempotent: it only touches certificates whose expiry is null, so a second
 * run does nothing.
 *
 * It reports, and refuses to write without --apply, any certificate that would
 * be expired the moment it is given a date. That is not a hypothetical: a
 * certificate issued four years ago for a course with a three-year renewal
 * period becomes expired immediately, and its owner is emailed the next
 * morning. Use --include-expired to go ahead knowingly.
 *
 * Usage:
 *   node scripts/backfill-certificate-expiry.mjs                     # report only
 *   node scripts/backfill-certificate-expiry.mjs --apply             # write
 *   node scripts/backfill-certificate-expiry.mjs --apply --include-expired
 *
 * Needs SUPABASE_EMAIL and SUPABASE_PASSWORD for an admin account, plus
 * VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env.local.
 */
import { readFileSync } from "node:fs"

const APPLY = process.argv.includes("--apply")
const INCLUDE_EXPIRED = process.argv.includes("--include-expired")

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // No .env.local is fine when the values come from the environment.
  }
}
loadEnv(".env.local")

const URL_BASE = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const EMAIL = process.env.SUPABASE_EMAIL
const PASSWORD = process.env.SUPABASE_PASSWORD

if (!URL_BASE || !ANON) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.")
  process.exit(1)
}
if (!EMAIL || !PASSWORD) {
  console.error("Set SUPABASE_EMAIL and SUPABASE_PASSWORD for an admin account.")
  process.exit(1)
}

/** Add whole months to a date, clamping to the end of a shorter month. */
function addMonths(iso, months) {
  const d = new Date(iso)
  const day = d.getUTCDate()
  const target = new Date(d)
  target.setUTCMonth(target.getUTCMonth() + months)
  // 31 January plus one month is 28 or 29 February, not 3 March.
  if (target.getUTCDate() < day) target.setUTCDate(0)
  return target
}

async function signIn() {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`)
  return (await res.json()).access_token
}

async function main() {
  const token = await signIn()
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }

  const res = await fetch(
    `${URL_BASE}/rest/v1/learner_certificates` +
      `?select=id,certificate_number,issued_at,expires_at,courses(title,renewal_months)` +
      `&expires_at=is.null&deleted_at=is.null`,
    { headers },
  )
  if (!res.ok) throw new Error(`Read failed: ${res.status} ${await res.text()}`)
  const rows = await res.json()

  const candidates = []
  const untouched = []
  for (const row of rows) {
    const months = row.courses?.renewal_months
    if (!months) {
      untouched.push(row)
      continue
    }
    const expiresAt = addMonths(row.issued_at, months)
    candidates.push({
      id: row.id,
      number: row.certificate_number,
      course: row.courses.title,
      months,
      expiresAt,
      alreadyPast: expiresAt < new Date(),
    })
  }

  console.log(`Certificates with no expiry: ${rows.length}`)
  console.log(`  eligible (course has a renewal period): ${candidates.length}`)
  console.log(`  left alone (course has none): ${untouched.length}`)
  for (const row of untouched) {
    console.log(`    - ${row.certificate_number}  ${row.courses?.title ?? "standalone"}`)
  }

  if (candidates.length === 0) {
    console.log("\nNothing to do.")
    return
  }

  const expired = candidates.filter((c) => c.alreadyPast)
  console.log("")
  for (const c of candidates) {
    console.log(
      `  ${c.number}  ${c.course}  +${c.months}m  ->  ` +
        `${c.expiresAt.toISOString().slice(0, 10)}` +
        (c.alreadyPast ? "   ALREADY PAST" : ""),
    )
  }

  if (expired.length > 0 && !INCLUDE_EXPIRED) {
    console.error(
      `\n${expired.length} certificate(s) would be expired the moment this runs, ` +
        `and their owners would be emailed by the daily reminder job.\n` +
        `Re-run with --include-expired once you are content with that.`,
    )
    process.exitCode = 1
    return
  }

  if (!APPLY) {
    console.log(`\nWould update ${candidates.length}. Re-run with --apply to write.`)
    return
  }

  let written = 0
  for (const c of candidates) {
    const put = await fetch(`${URL_BASE}/rest/v1/learner_certificates?id=eq.${c.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ expires_at: c.expiresAt.toISOString() }),
    })
    if (put.ok) written += 1
    else {
      console.error(`  ! ${c.number}: ${put.status} ${await put.text()}`)
      process.exitCode = 1
    }
  }
  console.log(`\nUpdated ${written} of ${candidates.length}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
