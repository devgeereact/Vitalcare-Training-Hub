#!/usr/bin/env node
/**
 * One-off, idempotent content repair: removes banned brand words from the
 * course, lesson, blog and announcement copy already sitting in the database.
 *
 * The word list in CLAUDE.md is enforced on new copy by review, but nothing was
 * enforcing it on records seeded or written before the rule existed. This is
 * not a blanket find-and-replace: each rewrite is written out in full so the
 * sentence still says what it meant, and terms of art are deliberately left
 * alone (the Care Act's "empowerment" is a statutory safeguarding principle,
 * not marketing filler).
 *
 * Safe to re-run: a replacement whose "from" text is no longer present is
 * skipped, so a partial run can simply be run again.
 *
 * Usage:
 *   node scripts/repair-banned-content.mjs            # report only
 *   node scripts/repair-banned-content.mjs --apply    # write the changes
 *
 * Needs SUPABASE_EMAIL and SUPABASE_PASSWORD for an account with staff rights,
 * plus VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env.local.
 */
import { readFileSync } from "node:fs"

const APPLY = process.argv.includes("--apply")

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
  console.error("Set SUPABASE_EMAIL and SUPABASE_PASSWORD for a staff account.")
  process.exit(1)
}

/** table -> id -> column -> [[from, to], ...] */
const REPLACEMENTS = {
  courses: {
    "cbfb39d5-4a70-4e45-a7b0-971fe7408f1b": {
      description: [["This comprehensive training course equips", "This training course equips"]],
    },
    "04fe5c3e-875f-49c0-8cd9-59083e44bd6d": {
      summary: [["A comprehensive 1-day practical training course teaching", "A one-day practical training course teaching"]],
    },
    "ad864248-c896-4996-b273-d41401ff5107": {
      summary: [["Comprehensive training for healthcare support workers delivering", "Training for healthcare support workers covering"]],
    },
    "b367a3d5-cda2-4f27-a5be-a3f6b263460d": {
      description: [["This comprehensive course provides", "This course provides"]],
    },
  },
  blog_posts: {
    "83db0744-fa2f-42e3-9fdb-70f6a5c3cee7": {
      excerpt: [["empowering new healthcare workers with crucial skills", "giving new healthcare workers the skills"]],
      body: [["Each standard requires comprehensive training and demonstration", "Each standard requires training and a demonstration"]],
    },
  },
  lessons: {
    "43377940-d229-4b84-a462-c7994e694ca4": {
      content: [["Comprehensive risk assessments must be recorded", "Risk assessments must be recorded in full"]],
    },
    "7c9aee6a-b26c-4b44-a898-a94655b343c5": {
      content: [["Comprehensive documentation of all emergency events", "Full documentation of all emergency events"]],
    },
    "97c89615-d1bc-4a37-9dde-8b9c02509387": {
      content: [["requires comprehensive understanding of protocols", "requires a working understanding of the protocols"]],
    },
    "c733b00f-19f8-46de-82a0-993451cf03da": {
      content: [["provides a comprehensive legal framework", "provides the legal framework"]],
    },
    "0768024d-8dfa-47a9-915f-4815aba09a89": {
      content: [["play a crucial role in empowering individuals to develop robust emotional resilience", "play a crucial role in helping individuals build emotional resilience"]],
    },
    // 4ea115a3 keeps "empowerment": it names a statutory safeguarding
    // principle from the Care Act 2014, not a marketing word.
  },
  announcements: {
    "4d761650-fbf7-4f31-940b-b6ef803f16e0": {
      body: [
        ["Your Comprehensive Learning Platform", "Your Learning Platform"],
        ["• Comprehensive course catalogue", "• Full course catalogue"],
        ["• Seamless compliance management", "• Compliance management in one place"],
      ],
    },
    "c556bc40-c33d-49dc-89c7-b6e27f9c0ced": {
      body: [["a comprehensive update to our mental health training", "a full update to our mental health training"]],
    },
  },
}

async function signIn() {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`Sign-in failed: ${res.status}`)
  const json = await res.json()
  return json.access_token
}

async function main() {
  const token = await signIn()
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }

  let changed = 0
  let skipped = 0
  for (const [table, rows] of Object.entries(REPLACEMENTS)) {
    for (const [id, columns] of Object.entries(rows)) {
      const res = await fetch(`${URL_BASE}/rest/v1/${table}?id=eq.${id}&select=*`, { headers })
      const [row] = await res.json()
      if (!row) {
        console.log(`- ${table}/${id}: not found, skipped`)
        skipped += 1
        continue
      }
      const patch = {}
      for (const [column, pairs] of Object.entries(columns)) {
        let value = row[column] ?? ""
        let touched = false
        for (const [from, to] of pairs) {
          if (value.includes(from)) {
            value = value.split(from).join(to)
            touched = true
            console.log(`  ${table}/${id}.${column}: "${from}" -> "${to}"`)
          }
        }
        if (touched) patch[column] = value
      }
      if (Object.keys(patch).length === 0) {
        skipped += 1
        continue
      }
      changed += 1
      if (!APPLY) continue
      const put = await fetch(`${URL_BASE}/rest/v1/${table}?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patch),
      })
      if (!put.ok) {
        console.error(`  ! write failed for ${table}/${id}: ${put.status} ${await put.text()}`)
        process.exitCode = 1
      }
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "Would change"} ${changed} record(s); ${skipped} already clean.`,
  )
  if (!APPLY) console.log("Re-run with --apply to write.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
