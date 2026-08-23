/**
 * Classification of data-layer failures.
 *
 * A screen must never present a failed request as an empty result: "no
 * questions yet" and "we could not load the questions" mean opposite things to
 * the person reading them, and only one of them is a defect the user can
 * report. These helpers let a component tell the two apart, and separate a
 * blocked request (row-level security, expired token) from a broken one.
 */

/** Shape shared by PostgrestError and the Storage/Functions error objects. */
interface SupabaseLikeError {
  code?: string | number
  status?: number
  statusCode?: string | number
  message?: string
  name?: string
}

function asError(err: unknown): SupabaseLikeError | null {
  if (!err || typeof err !== "object") return null
  return err as SupabaseLikeError
}

/**
 * True when the request was understood but refused: row-level security denied
 * it, the JWT is missing or expired, or the role lacks the grant.
 *
 * PostgREST reports these as HTTP 401/403 with SQLSTATE 42501 (insufficient
 * privilege) or a PGRST301/PGRST302 code. A row-level security policy that
 * simply filters rows out is NOT an error and never reaches here: it returns an
 * empty set, which is a genuine empty state.
 */
export function isPermissionError(err: unknown): boolean {
  const e = asError(err)
  if (!e) return false
  const code = String(e.code ?? e.statusCode ?? "")
  const status = Number(e.status ?? e.statusCode ?? 0)
  if (status === 401 || status === 403) return true
  if (code === "42501" || code === "PGRST301" || code === "PGRST302") return true
  if (code === "401" || code === "403") return true
  const msg = (e.message ?? "").toLowerCase()
  return (
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("jwt expired")
  )
}

/** True when the browser could not reach the API at all. */
export function isNetworkError(err: unknown): boolean {
  const e = asError(err)
  if (!e) return false
  if (e.name === "TypeError" && (e.message ?? "").includes("fetch")) return true
  return (e.message ?? "").toLowerCase().includes("failed to fetch")
}

/**
 * A short, plain-English sentence for a failed request. Never exposes the
 * database message: those leak table and column names.
 */
export function friendlyErrorMessage(err: unknown, resource = "this page"): string {
  if (isPermissionError(err)) {
    return `You do not have permission to view ${resource}.`
  }
  if (isNetworkError(err)) {
    return `We could not reach the server. Check your connection and try again.`
  }
  return `We could not load ${resource}. Please try again.`
}
