import { describe, expect, it } from "vitest"

import { friendlyAuthErrorForTest } from "@/lib/supabase/auth"

/**
 * What a failed sign-up says matters more than usual here, because the live
 * project currently cannot send its confirmation email: registration returns
 * "Error sending confirmation email" and no account is created.
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

  it("never echoes the raw error back to the person", () => {
    const msg = friendlyAuthErrorForTest("pq: duplicate key value violates unique constraint")
    expect(msg).toBe("Something went wrong. Please try again.")
  })
})
