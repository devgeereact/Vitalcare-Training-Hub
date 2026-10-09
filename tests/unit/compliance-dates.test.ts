import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { addCalendarMonths, addCalendarMonthsIso, toIsoDate } from "@/lib/dates"
import { complianceStatus } from "@/lib/queries/compliance.queries"

/**
 * Renewal dates decide who is told to refresh statutory training and when a
 * certificate lapses. The database calculates them with
 * `completed + (n || ' months')::interval`, which clamps to the end of a
 * shorter month. The browser used `setMonth`, which overflows, so 31 January
 * plus one month came back as 3 March and a leap-day completion plus twelve
 * months came back as 1 March. The two answers have to agree.
 */
describe("addCalendarMonths", () => {
  const cases: Array<[string, number, string]> = [
    // The two defects reported by the launch review.
    ["2026-01-31", 1, "2026-02-28"],
    ["2024-02-29", 12, "2025-02-28"],
    // Month ends generally.
    ["2026-01-31", 3, "2026-04-30"],
    ["2026-03-31", 1, "2026-04-30"],
    ["2026-05-31", 1, "2026-06-30"],
    ["2026-08-31", 6, "2027-02-28"],
    ["2026-10-31", 4, "2027-02-28"],
    // Into a leap February, which has the extra day to give.
    ["2027-01-31", 1, "2027-02-28"],
    ["2023-12-31", 2, "2024-02-29"],
    // Ordinary dates are untouched.
    ["2026-06-15", 12, "2027-06-15"],
    ["2026-02-28", 12, "2027-02-28"],
    ["2026-06-15", 0, "2026-06-15"],
    // Year boundaries.
    ["2026-12-31", 1, "2027-01-31"],
    ["2026-11-30", 15, "2028-02-29"],
  ]

  it.each(cases)("%s plus %i months is %s", (from, months, expected) => {
    expect(addCalendarMonthsIso(from, months)).toBe(expected)
  })

  it("works on a full timestamp, returning a plain date", () => {
    expect(addCalendarMonthsIso("2026-01-31T23:30:00.000Z", 1)).toBe("2026-02-28")
  })

  it("returns null rather than an invalid date", () => {
    expect(addCalendarMonthsIso("not a date", 12)).toBeNull()
  })

  it("does not mutate the date it is given", () => {
    const start = new Date("2026-01-31T00:00:00.000Z")
    addCalendarMonths(start, 1)
    expect(toIsoDate(start)).toBe("2026-01-31")
  })
})

/**
 * The same arithmetic, through the function the compliance matrix actually
 * calls. The clock is pinned so "due soon" and "overdue" are decidable.
 */
describe("complianceStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("clamps 31 January plus one month to 28 February", () => {
    expect(complianceStatus("2026-01-31", 1).dueOn).toBe("2026-02-28")
  })

  it("clamps a leap-day completion plus twelve months to 28 February", () => {
    expect(complianceStatus("2024-02-29", 12).dueOn).toBe("2025-02-28")
  })

  it("reports nothing recorded when there is no completion", () => {
    expect(complianceStatus(null, 12)).toEqual({
      status: "not_recorded",
      dueOn: null,
    })
  })

  it("has no due date for a course that does not renew", () => {
    expect(complianceStatus("2020-01-01", null)).toEqual({
      status: "current",
      dueOn: null,
    })
  })

  it("treats a zero renewal period as no renewal, matching the database", () => {
    expect(complianceStatus("2020-01-01", 0)).toEqual({
      status: "current",
      dueOn: null,
    })
  })

  it("is current well before the due date", () => {
    expect(complianceStatus("2026-06-01", 12)).toMatchObject({
      status: "current",
      dueOn: "2027-06-01",
    })
  })

  it("is due soon inside the 30-day window", () => {
    // Due 2026-07-01, sixteen days away.
    expect(complianceStatus("2025-07-01", 12).status).toBe("due_soon")
  })

  it("treats the 30-day boundary as due soon, not current", () => {
    // Due 2026-07-15, exactly thirty days away.
    expect(complianceStatus("2025-07-15", 12)).toEqual({
      status: "due_soon",
      dueOn: "2026-07-15",
    })
  })

  it("treats day 31 as still current", () => {
    expect(complianceStatus("2025-07-16", 12).status).toBe("current")
  })

  it("is due soon, not overdue, on the day it falls due", () => {
    expect(complianceStatus("2025-06-15", 12)).toEqual({
      status: "due_soon",
      dueOn: "2026-06-15",
    })
  })

  it("is overdue once the due date has passed", () => {
    expect(complianceStatus("2025-06-14", 12)).toEqual({
      status: "overdue",
      dueOn: "2026-06-14",
    })
  })

  it("is overdue for a month-end completion that clamped backwards", () => {
    // 2025-05-31 + 12 months clamps to 2026-05-31, which is in the past.
    expect(complianceStatus("2025-05-31", 12)).toEqual({
      status: "overdue",
      dueOn: "2026-05-31",
    })
  })
})

/**
 * The same answers must come out in Europe/London as in UTC. A completion date
 * is a calendar date, and British Summer Time must not move it.
 */
describe("complianceStatus across time zones", () => {
  const originalTz = process.env.TZ

  afterEach(() => {
    process.env.TZ = originalTz
    vi.useRealTimers()
  })

  it("gives the same due date in Europe/London during British Summer Time", () => {
    process.env.TZ = "Europe/London"
    vi.useFakeTimers()
    // Midnight local on 1 July is 23:00 UTC on 30 June: the exact case where a
    // local-time calculation slips a day.
    vi.setSystemTime(new Date("2026-07-01T00:30:00+01:00"))
    expect(complianceStatus("2026-01-31", 1).dueOn).toBe("2026-02-28")
    expect(complianceStatus("2024-02-29", 12).dueOn).toBe("2025-02-28")
    expect(complianceStatus("2026-03-31", 12).dueOn).toBe("2027-03-31")
  })
})
