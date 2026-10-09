/**
 * Calendar date arithmetic that agrees with the database.
 *
 * Renewal and expiry dates are calculated in three places: PostgreSQL when a
 * certificate is issued (`now() + (renewal_months || ' months')::interval`),
 * the backfill script, and the browser when the compliance matrix works out
 * what is due. Those three have to give the same answer, or a learner is told
 * one date, the certificate prints another and the reminder job fires on a
 * third.
 *
 * PostgreSQL clamps: 31 January plus one month is 28 February (29 in a leap
 * year). JavaScript's `setMonth` overflows instead, and returns 3 March. These
 * helpers follow PostgreSQL, because the database holds the record.
 *
 * Everything here works in UTC. Stored completion dates are plain calendar
 * dates ("2026-01-31"), which the Date constructor reads as UTC midnight, and
 * the answer must not move because the person reading it is in British Summer
 * Time.
 */

/** A plain calendar date, "YYYY-MM-DD". */
export type IsoDate = string

/**
 * Add whole calendar months, clamping to the last day of a shorter month.
 *
 * 2026-01-31 + 1 month  -> 2026-02-28
 * 2024-02-29 + 12 months -> 2025-02-28
 * 2026-01-31 + 0 months -> 2026-01-31
 */
export function addCalendarMonths(date: Date, months: number): Date {
  const day = date.getUTCDate()
  const result = new Date(date.getTime())
  // Move to the first of the month before shifting, so the shift itself can
  // never overflow, then put the day back and clamp.
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(day, lastDayOfTargetMonth))
  return result
}

/**
 * Add whole calendar months to an ISO date or timestamp, returning a plain
 * calendar date. Returns null when the input is not a usable date, so a bad
 * row shows as "no date" rather than "Invalid Date".
 */
export function addCalendarMonthsIso(
  iso: string,
  months: number,
): IsoDate | null {
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return null
  return toIsoDate(addCalendarMonths(start, months))
}

/** Format a Date as a plain calendar date in UTC. */
export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

/** Midnight UTC on 1 January of the year containing `now`. */
export function startOfYearUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
}
