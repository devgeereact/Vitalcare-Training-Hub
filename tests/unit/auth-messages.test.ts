import { describe, expect, it } from "vitest"

import { friendlyAuthErrorForTest } from "@/lib/supabase/auth"

/**
 * What a failed sign-up says matters more than usual here. A runbook entry from
 * August 2026 recorded the live project returning "Error sending confirmation
 * email" with no account created, because Auth had no SMTP provider. Whether
 * that is still true is a live-configuration question, not something these
 * tests can answer: what they pin down is that the message a person sees names
 * the real problem.
 *
 * The old catch-all replied "Something went wrong. Please try again", which
 * invites someone to retry forever against a service that will keep failing.
 */
describe("friendlyAuthError", () => {
  it("tells the truth when the mail service is the problem", () => {
    const msg = friendlyAuthErrorForTest("Error sending confirmation email")
    expect(msg).toContain("account was not created")
    expect(msg).toContain("info@vitalcare.uk")
    expect(msg).not.toContain("Please try again.")
  })

  it("covers the recovery email path too", () => {
    expect(friendlyAuthErrorForTest("Error sending recovery email")).toContain(
      "info@vitalcare.uk",
    )
  })

  it("still gives the ordinary messages", () => {
    expect(friendlyAuthErrorForTest("Invalid login credentials")).toContain(
      "do not match an account",
    )
    expect(friendlyAuthErrorForTest("Email not confirmed")).toContain("Check your inbox")
    expect(friendlyAuthErrorForTest("User already registered")).toContain(
      "already exists",
    )
  })

  it("names the reset link when the recovery session is missing", () => {
    const msg = friendlyAuthErrorForTest("Auth session missing!")
    expect(msg).toContain("reset link")
    expect(msg).toContain("Request a new one")
  })

  it("says a link has expired rather than blaming the password", () => {
    expect(friendlyAuthErrorForTest("Token has expired or is invalid")).toContain(
      "expired",
    )
  })

  it("distinguishes reusing the current password", () => {
    expect(
      friendlyAuthErrorForTest("New password should be different from the old password."),
    ).toContain("Choose a different one")
  })

  it("never echoes the raw error back to the person", () => {
    const msg = friendlyAuthErrorForTest("pq: duplicate key value violates unique constraint")
    expect(msg).toBe("Something went wrong. Please try again.")
  })
})
