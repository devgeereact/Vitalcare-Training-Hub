import { describe, expect, it } from "vitest"

import {
  friendlyErrorMessage,
  isNetworkError,
  isPermissionError,
} from "@/lib/queries/query-error"

/**
 * The whole "do not hide a failure behind an empty state" rule rests on being
 * able to tell a refusal from a fault from a genuinely empty result. If this
 * classification is wrong, a permission problem is reported as a broken page or
 * the other way round, and the wrong person goes looking for the cause.
 */
describe("isPermissionError", () => {
  it("recognises a PostgREST row-level security refusal", () => {
    expect(
      isPermissionError({
        code: "42501",
        message: 'new row violates row-level security policy for table "profiles"',
      }),
    ).toBe(true)
  })

  it("recognises an expired token", () => {
    expect(isPermissionError({ code: "PGRST301", message: "JWT expired" })).toBe(true)
  })

  it("recognises 401 and 403 by status", () => {
    expect(isPermissionError({ status: 401 })).toBe(true)
    expect(isPermissionError({ status: 403 })).toBe(true)
  })

  it("does not treat an ordinary query failure as a refusal", () => {
    expect(
      isPermissionError({ code: "42703", message: "column x does not exist" }),
    ).toBe(false)
    expect(isPermissionError({ status: 500 })).toBe(false)
    expect(isPermissionError(new Error("boom"))).toBe(false)
  })

  it("is safe on null and non-objects", () => {
    expect(isPermissionError(null)).toBe(false)
    expect(isPermissionError(undefined)).toBe(false)
    expect(isPermissionError("nope")).toBe(false)
  })

  it("does NOT fire for an empty result", () => {
    // A policy that filters rows out returns an empty set and no error at all.
    // Treating that as a refusal would put "you do not have permission" on
    // every genuinely empty screen.
    expect(isPermissionError(undefined)).toBe(false)
  })
})

describe("isNetworkError", () => {
  it("recognises a failed fetch", () => {
    const err = new TypeError("Failed to fetch")
    expect(isNetworkError(err)).toBe(true)
  })

  it("does not fire for a database error", () => {
    expect(isNetworkError({ code: "42501", message: "permission denied" })).toBe(false)
  })
})

describe("friendlyErrorMessage", () => {
  it("names the resource so the message is about something", () => {
    expect(friendlyErrorMessage({ status: 500 }, "your certificates")).toBe(
      "We could not load your certificates. Please try again.",
    )
  })

  it("says permission when permission is the problem", () => {
    expect(friendlyErrorMessage({ status: 403 }, "this assessment")).toBe(
      "You do not have permission to view this assessment.",
    )
  })

  it("never leaks the database message to the user", () => {
    const message = friendlyErrorMessage(
      { code: "42P01", message: 'relation "public.learner_certificates" does not exist' },
      "certificates",
    )
    expect(message).not.toContain("learner_certificates")
    expect(message).not.toContain("relation")
  })
})
