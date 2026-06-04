import { isPast, isWithinInterval } from "date-fns"

/** Where a session sits relative to now. */
export type SessionPhase = "upcoming" | "live" | "ended"

/**
 * Classify a session against the current time. "live" while now is between
 * start and end, "ended" once the end time has passed, otherwise "upcoming".
 * Invalid dates are treated as "upcoming" so nothing is wrongly locked off.
 */
export function sessionPhase(
  startsAt: string | Date,
  endsAt: string | Date,
): SessionPhase {
  const now = new Date()
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "upcoming"
  }
  if (isWithinInterval(now, { start, end })) return "live"
  if (isPast(end)) return "ended"
  return "upcoming"
}

/** Short human label for a session phase, e.g. for a status badge. */
export function sessionPhaseLabel(phase: SessionPhase): string {
  switch (phase) {
    case "live":
      return "In progress"
    case "ended":
      return "Completed"
    default:
      return "Scheduled"
  }
}
