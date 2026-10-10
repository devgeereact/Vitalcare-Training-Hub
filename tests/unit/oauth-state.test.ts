// @vitest-environment node
// Node, not jsdom: the module under test runs on Web Crypto, and Node's global
// crypto.subtle is the same API Deno gives the Edge Functions.
import { describe, expect, it } from "vitest"

import {
  OAUTH_STATE_TTL_SECONDS,
  requireOAuthStateSecret,
  signOAuthState,
  verifyOAuthState,
} from "../../supabase/functions/_shared/oauth-state.ts"

// Test-only value, not a real secret.
const SECRET = "test-only-oauth-state-secret-0123456789abcdef"
const OTHER_SECRET = "a-different-test-only-secret-0123456789abcdef"
const USER = "6f1c2a7e-0000-4000-8000-000000000001"
const NOW = Date.UTC(2026, 9, 8, 12, 0, 0)

function flipChar(text: string, index: number): string {
  const c = text[index]
  return text.slice(0, index) + (c === "A" ? "B" : "A") + text.slice(index + 1)
}

describe("OAuth state signing", () => {
  it("round-trips the user id and purpose", async () => {
    const state = await signOAuthState(SECRET, USER, "calendar", NOW)
    await expect(verifyOAuthState(SECRET, state, "calendar", NOW + 1000)).resolves.toEqual({
      ok: true,
      userId: USER,
      purpose: "calendar",
    })
  })

  it("is URL-safe and never repeats", async () => {
    const a = await signOAuthState(SECRET, USER, "drive", NOW)
    const b = await signOAuthState(SECRET, USER, "drive", NOW)
    expect(a).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(a).not.toBe(b)
  })

  it("rejects the old raw user id state", async () => {
    await expect(verifyOAuthState(SECRET, USER, "calendar", NOW)).resolves.toEqual({
      ok: false,
      reason: "malformed",
    })
  })

  it("rejects an empty or garbage state", async () => {
    for (const bad of ["", ".", "abc.", ".abc", "a.b.c", "!!!.???"]) {
      const result = await verifyOAuthState(SECRET, bad, "calendar", NOW)
      expect(result.ok, bad).toBe(false)
    }
  })

  it("rejects a state signed with another secret", async () => {
    const state = await signOAuthState(OTHER_SECRET, USER, "calendar", NOW)
    await expect(verifyOAuthState(SECRET, state, "calendar", NOW)).resolves.toEqual({
      ok: false,
      reason: "bad_signature",
    })
  })

  it("rejects a tampered payload or signature", async () => {
    const state = await signOAuthState(SECRET, USER, "calendar", NOW)
    const [body, sig] = state.split(".")
    const forgedBody = Buffer.from(
      JSON.stringify({ uid: "attacker", purpose: "calendar", nonce: "x", exp: 9_999_999_999 }),
    ).toString("base64url")
    for (const bad of [`${forgedBody}.${sig}`, `${flipChar(body, 3)}.${sig}`, `${body}.${flipChar(sig, 3)}`]) {
      const result = await verifyOAuthState(SECRET, bad, "calendar", NOW)
      expect(result.ok).toBe(false)
    }
  })

  it("expires after ten minutes", async () => {
    const state = await signOAuthState(SECRET, USER, "drive", NOW)
    const justBefore = NOW + (OAUTH_STATE_TTL_SECONDS - 1) * 1000
    const atExpiry = NOW + OAUTH_STATE_TTL_SECONDS * 1000
    expect((await verifyOAuthState(SECRET, state, "drive", justBefore)).ok).toBe(true)
    await expect(verifyOAuthState(SECRET, state, "drive", atExpiry)).resolves.toEqual({
      ok: false,
      reason: "expired",
    })
  })

  it("will not let a Drive state connect Calendar, or the reverse", async () => {
    const drive = await signOAuthState(SECRET, USER, "drive", NOW)
    const calendar = await signOAuthState(SECRET, USER, "calendar", NOW)
    await expect(verifyOAuthState(SECRET, drive, "calendar", NOW)).resolves.toEqual({
      ok: false,
      reason: "wrong_purpose",
    })
    await expect(verifyOAuthState(SECRET, calendar, "drive", NOW)).resolves.toEqual({
      ok: false,
      reason: "wrong_purpose",
    })
  })

  it("fails closed without a usable secret", async () => {
    expect(() => requireOAuthStateSecret(undefined)).toThrow(/OAUTH_STATE_SECRET/)
    expect(() => requireOAuthStateSecret("short")).toThrow(/OAUTH_STATE_SECRET/)
    await expect(signOAuthState("", USER, "calendar", NOW)).rejects.toThrow(/OAUTH_STATE_SECRET/)
    const state = await signOAuthState(SECRET, USER, "calendar", NOW)
    await expect(verifyOAuthState("", state, "calendar", NOW)).rejects.toThrow(/OAUTH_STATE_SECRET/)
  })
})
