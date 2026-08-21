#!/usr/bin/env node
/**
 * Blocks credentials from being committed.
 *
 * Runs over tracked files only, so it never trips on .env.local or node_modules.
 * Exits non-zero on a hit, which is what makes it usable as a pre-commit hook
 * and a CI step.
 *
 *   npm run check:secrets
 *
 * Why this exists: a Google API key sat hardcoded in
 * src/lib/integrations/google-calendar.ts from the Phase 7 commit until it had
 * to be rotated. Nothing caught it, because the value was a plausible-looking
 * fallback next to an import.meta.env read. Reviewers skim those.
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

/** Patterns that are never acceptable in a tracked file. */
const RULES = [
  { name: "Google API key", re: /\bAIza[A-Za-z0-9_-]{30,}/ },
  { name: "Google OAuth client secret", re: /\bGOCSPX-[A-Za-z0-9_-]{10,}/ },
  { name: "Supabase service-role / secret key", re: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "JWT (possible service_role token)", re: /\beyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: "OpenAI / OpenRouter key", re: /\bsk-[A-Za-z0-9-]{20,}/ },
  { name: "Resend API key", re: /\bre_[A-Za-z0-9]{20,}/ },
  { name: "Stripe live key", re: /\bsk_live_[A-Za-z0-9]{10,}/ },
  { name: "Slack bot token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
]

/**
 * Known-safe values. The Supabase publishable key is designed to ship in the
 * browser bundle and is protected by RLS, so it is not a finding. Everything
 * else must be justified here in writing before it is added.
 */
const ALLOW = [
  /\bsb_publishable_[A-Za-z0-9_-]+/g,
  // Regex literals that merely *match* a private key, rather than contain one.
  /replace\(\s*\/-----BEGIN/g,
]

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|svg|woff2?|ttf|eot|pdf|zip|lock)$/i
const SKIP_PATHS = /^(dist|node_modules|docs\/)/

const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !BINARY.test(f) && !SKIP_PATHS.test(f))

const findings = []
for (const file of files) {
  let text
  try {
    text = readFileSync(file, "utf8")
  } catch {
    continue // unreadable or vanished mid-run; nothing to scan
  }
  for (const a of ALLOW) text = text.replace(a, "<allowed>")
  text.split("\n").forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        findings.push({ file, line: i + 1, rule: rule.name })
      }
    }
  })
}

if (findings.length === 0) {
  console.log(`check:secrets — clean (${files.length} tracked files scanned)`)
  process.exit(0)
}

console.error(`\ncheck:secrets — ${findings.length} credential(s) found in tracked files:\n`)
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}  ${f.rule}`)
}
console.error(`
Credentials do not belong in the repo. Depending on which one it is:
  - browser-side value  -> a VITE_* var in .env.local (never committed)
  - server-side value   -> /platform/settings/integrations, or a Supabase
                           Edge Function secret
Rotate anything that was already committed. Removing the line is not enough;
the value stays in git history and in every clone.
`)
process.exit(1)
