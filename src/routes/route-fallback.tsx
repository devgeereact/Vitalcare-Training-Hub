import { Loader2 } from "lucide-react"

/**
 * Shown while a route's code chunk is downloading.
 *
 * Every page below the marketing home is code-split, so this is what a visitor
 * sees for the fraction of a second between clicking a link and the chunk
 * arriving. It is deliberately quiet: a full skeleton here would flash on fast
 * connections, and the page renders its own skeleton the moment it mounts.
 */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] w-full items-center justify-center"
    >
      <Loader2 className="size-6 animate-spin text-brand-navy" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
