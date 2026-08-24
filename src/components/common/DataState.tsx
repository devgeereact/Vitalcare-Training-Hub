import type { ReactNode } from "react"
import { AlertCircle, Inbox, Lock, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  friendlyErrorMessage,
  isPermissionError,
} from "@/lib/queries/query-error"

/**
 * The five states every database-backed view owes its reader.
 *
 * 1. Loading      the request is in flight
 * 2. Error        the request failed
 * 3. Forbidden    the request was refused (row-level security, expired token)
 * 4. Empty        the request succeeded and there is genuinely nothing
 * 5. Populated    the request succeeded and there is something
 *
 * Collapsing 2 or 3 into 4 tells the reader an administrator has not created
 * the data yet, when in fact the platform is broken or they are not allowed to
 * see it. That hides defects from the people best placed to report them, so
 * this component keeps them apart by construction.
 */

/** The slice of a TanStack Query result these states need. */
export interface QueryLike<T> {
  isLoading: boolean
  isError: boolean
  error: unknown
  data: T | undefined
  refetch?: () => unknown
}

export function LoadingState({
  rows = 3,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function ErrorState({
  error,
  resource = "this page",
  onRetry,
  className,
}: {
  error?: unknown
  resource?: string
  onRetry?: () => unknown
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.04] px-4 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
      <p className="text-sm text-foreground">
        {friendlyErrorMessage(error, resource)}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={() => onRetry()}>
          <RefreshCw className="mr-1.5 size-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  )
}

export function PermissionState({
  resource = "this page",
  className,
}: {
  resource?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-10 text-center",
        className,
      )}
    >
      <Lock className="size-7 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-foreground">
        You do not have permission to view {resource}.
      </p>
      <p className="text-xs text-muted-foreground">
        If you believe this is wrong, ask an administrator to check your access.
      </p>
    </div>
  )
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof Inbox
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center",
        className,
      )}
    >
      <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/**
 * Render one query's five states. `children` only ever runs with data that
 * loaded successfully and is not empty.
 */
export function DataState<T>({
  query,
  resource = "this page",
  loading,
  empty,
  isEmpty,
  children,
}: {
  query: QueryLike<T>
  /** Named in the error and permission copy, e.g. "the assessment". */
  resource?: string
  /** Custom skeleton. Defaults to three rows. */
  loading?: ReactNode
  /** What to show when the request succeeded with nothing in it. */
  empty: ReactNode
  /** Defaults to "an empty array". Override for object-shaped data. */
  isEmpty?: (data: T) => boolean
  children: (data: T) => ReactNode
}) {
  if (query.isLoading) return <>{loading ?? <LoadingState />}</>

  if (query.isError) {
    return isPermissionError(query.error) ? (
      <PermissionState resource={resource} />
    ) : (
      <ErrorState error={query.error} resource={resource} onRetry={query.refetch} />
    )
  }

  // Settled without error but with no payload: treat as still loading rather
  // than as empty, so a disabled or paused query never reads as "nothing here".
  if (query.data === undefined || query.data === null) {
    return <>{loading ?? <LoadingState />}</>
  }

  const emptyCheck =
    isEmpty ?? ((d: T) => Array.isArray(d) && d.length === 0)
  if (emptyCheck(query.data)) return <>{empty}</>

  return <>{children(query.data)}</>
}
