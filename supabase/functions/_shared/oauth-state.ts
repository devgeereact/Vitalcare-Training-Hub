// Signed, expiring OAuth `state` for the Google Calendar and Drive callbacks.
//
// The callbacks run without a Supabase JWT (Google redirects the browser to
// them), so `state` is the only thing tying a consent to a platform user. A raw
// user id there let anyone who completed Google consent replace the stored
// tokens. Now an authenticated function issues
//   state = base64url(payload) + "." + base64url(HMAC-SHA256(payload, secret))
// and the callback refuses anything it did not sign, anything older than ten
// minutes, and anything issued for the other integration.
//
// Pure TypeScript on Web Crypto, no Deno or Node APIs, so the unit tests import
// this exact file. Callers read the secret (OAUTH_STATE_SECRET) and pass it in.

export type OAuthPurpose = "calendar" | "drive"

export interface OAuthStatePayload {
  /** Supabase user id the consent belongs to. */
  uid: string
  purpose: OAuthPurpose
  /** Random, so two states for the same user never collide. */
  nonce: string
  /** Expiry, seconds since the epoch. */
  exp: number
}

export type OAuthStateResult =
  | { ok: true; userId: string; purpose: OAuthPurpose }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "wrong_purpose" }

export const OAUTH_STATE_TTL_SECONDS = 10 * 60

/** Shortest secret accepted. 32 characters of random base64 is 192 bits. */
export const OAUTH_STATE_MIN_SECRET_LENGTH = 32

const PURPOSES: readonly OAuthPurpose[] = ["calendar", "drive"]

/**
 * Returns the secret, or throws when it is missing or too short. Callers must
 * treat the throw as "refuse the request": no secret means no way to tell a
 * genuine state from a forged one.
 */
export function requireOAuthStateSecret(value: string | undefined): string {
  if (!value || value.length < OAUTH_STATE_MIN_SECRET_LENGTH) {
    throw new Error(
      `OAUTH_STATE_SECRET is not set or is shorter than ${OAUTH_STATE_MIN_SECRET_LENGTH} characters`,
    )
  }
  return value
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  } catch {
    // atob rejects impossible lengths; the caller reports it as malformed.
    return null
  }
}

function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  )
}

function isPayload(value: unknown): value is OAuthStatePayload {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.uid === "string" &&
    v.uid.length > 0 &&
    typeof v.purpose === "string" &&
    (PURPOSES as readonly string[]).includes(v.purpose) &&
    typeof v.nonce === "string" &&
    v.nonce.length > 0 &&
    typeof v.exp === "number" &&
    Number.isFinite(v.exp)
  )
}

/** Issues a state for `userId` and `purpose`, valid for ten minutes from `nowMs`. */
export async function signOAuthState(
  secret: string,
  userId: string,
  purpose: OAuthPurpose,
  nowMs: number = Date.now(),
): Promise<string> {
  requireOAuthStateSecret(secret)
  if (!userId) throw new Error("signOAuthState needs a user id")
  const payload: OAuthStatePayload = {
    uid: userId,
    purpose,
    nonce: bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16))),
    exp: Math.floor(nowMs / 1000) + OAUTH_STATE_TTL_SECONDS,
  }
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await hmacKey(secret, "sign")
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  return `${body}.${bytesToBase64Url(new Uint8Array(sig))}`
}

/**
 * Checks signature first (crypto.subtle.verify compares in constant time),
 * then expiry, then purpose. Never trusts any payload field before the
 * signature has passed.
 */
export async function verifyOAuthState(
  secret: string,
  state: string,
  expectedPurpose: OAuthPurpose,
  nowMs: number = Date.now(),
): Promise<OAuthStateResult> {
  requireOAuthStateSecret(secret)
  const parts = state.split(".")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" }
  const [body, sigText] = parts
  const sig = base64UrlToBytes(sigText)
  if (!sig || !base64UrlToBytes(body)) return { ok: false, reason: "malformed" }

  const key = await hmacKey(secret, "verify")
  const valid = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(body))
  if (!valid) return { ok: false, reason: "bad_signature" }

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body) ?? new Uint8Array()))
  } catch {
    return { ok: false, reason: "malformed" }
  }
  if (!isPayload(payload)) return { ok: false, reason: "malformed" }
  if (Math.floor(nowMs / 1000) >= payload.exp) return { ok: false, reason: "expired" }
  if (payload.purpose !== expectedPurpose) return { ok: false, reason: "wrong_purpose" }
  return { ok: true, userId: payload.uid, purpose: payload.purpose }
}
