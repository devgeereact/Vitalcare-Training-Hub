import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { certStatus } from "@/lib/queries/certificates.queries"

/**
 * Certificate expiry drives the compliance dashboard, the expiry reminders and
 * the badge a learner sees on their own certificate. An off-by-one here either
 * warns people who are in date or stays silent on someone who is not.
 */
describe("certStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("reports no expiry when there is none", () => {
    expect(certStatus(null)).toEqual({ status: "no_expiry", daysToExpiry: null })
  })

  it("is active well before expiry", () => {
    expect(certStatus("2027-06-01T12:00:00Z").status).toBe("active")
  })

  it("is expiring inside the 30-day window", () => {
    expect(certStatus("2026-06-20T12:00:00Z").status).toBe("expiring")
  })

  it("treats the 30-day boundary as expiring, not active", () => {
    expect(certStatus("2026-07-01T12:00:00Z")).toEqual({
      status: "expiring",
      daysToExpiry: 30,
    })
  })

  it("treats day 31 as still active", () => {
    expect(certStatus("2026-07-02T12:00:00Z").status).toBe("active")
  })

  it("is expiring, not expired, on the day it lapses", () => {
    expect(certStatus("2026-06-01T18:00:00Z").status).toBe("expiring")
  })

  it("is expired once the date has passed", () => {
    const past = certStatus("2026-05-31T12:00:00Z")
    expect(past.status).toBe("expired")
    expect(past.daysToExpiry).toBeLessThan(0)
  })
})
