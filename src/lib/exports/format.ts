/**
 * Shared formatting helpers for exports. The app stores money as integer pence;
 * always convert to pounds before placing a value in a `#,##0.00` cell.
 */

/** Integer pence to a pounds number (e.g. 9500 -> 95). */
export function penceToPounds(pence: number | null | undefined): number | null {
  if (pence === null || pence === undefined) return null
  return Math.round(pence) / 100
}

/** Parse an ISO date string into a Date, or null when absent or invalid. So a
 *  cell renders a real date (for dd/mm/yyyy) rather than text. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Split a full name into first and last parts. */
export function splitName(full: string | null | undefined): {
  first: string
  last: string
} {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: "", last: "" }
  if (parts.length === 1) return { first: parts[0], last: "" }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}
