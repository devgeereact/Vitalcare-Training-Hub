import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

// px-2 at the narrowest widths: nine 36px controls in one row is 324px, which
// does not fit a 320px screen and pushed the whole page sideways.
const BASE =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number
  /** Total number of pages. Pagination renders nothing when this is 1 or less. */
  pageCount: number
  /** Called with the requested page (1-based). */
  onPageChange: (page: number) => void
  /** Accessible label for the surrounding nav. */
  label?: string
  className?: string
}

const ELLIPSIS = "ellipsis" as const

/**
 * Build the list of page tokens to render: first, last, the current page and
 * its neighbours, with an ellipsis marker filling the gaps. Keeps the control
 * compact even with many pages.
 */
function buildPages(page: number, pageCount: number): Array<number | typeof ELLIPSIS> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  const pages: Array<number | typeof ELLIPSIS> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)

  if (start > 2) pages.push(ELLIPSIS)
  for (let p = start; p <= end; p += 1) pages.push(p)
  if (end < pageCount - 1) pages.push(ELLIPSIS)

  pages.push(pageCount)
  return pages
}

/**
 * Accessible, button-driven pagination for the marketing pages. Uses real
 * buttons (not anchors) so it is safe to render server-side and works for
 * keyboard users; prev/next disable at the bounds and the active page carries
 * aria-current. Renders nothing when there is a single page.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "Pagination",
  className,
}: PaginationProps): React.ReactElement | null {
  if (pageCount <= 1) return null

  const clampedPage = Math.min(Math.max(page, 1), pageCount)
  const tokens = buildPages(clampedPage, pageCount)
  const atStart = clampedPage <= 1
  const atEnd = clampedPage >= pageCount

  return (
    <nav
      aria-label={label}
      className={cn("flex flex-wrap items-center justify-center gap-1", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(clampedPage - 1)}
        disabled={atStart}
        aria-label="Go to previous page"
        className={cn(
          BASE,
          FOCUS,
          "gap-1 border border-border bg-white text-brand-navy enabled:hover:border-brand-gold enabled:hover:bg-brand-gold/10",
        )}
      >
        <ChevronLeft className="size-4" aria-hidden />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ul className="flex flex-wrap items-center justify-center gap-1">
        {tokens.map((token, i) =>
          token === ELLIPSIS ? (
            <li key={`ellipsis-${i}`} aria-hidden>
              <span className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm text-muted-foreground">
                ...
              </span>
            </li>
          ) : (
            <li key={token}>
              <button
                type="button"
                onClick={() => onPageChange(token)}
                aria-current={token === clampedPage ? "page" : undefined}
                aria-label={`Go to page ${token}`}
                className={cn(
                  BASE,
                  FOCUS,
                  token === clampedPage
                    ? "bg-brand-navy text-white"
                    : "border border-border bg-white text-brand-navy hover:border-brand-gold hover:bg-brand-gold/10",
                )}
              >
                {token}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(clampedPage + 1)}
        disabled={atEnd}
        aria-label="Go to next page"
        className={cn(
          BASE,
          FOCUS,
          "gap-1 border border-border bg-white text-brand-navy enabled:hover:border-brand-gold enabled:hover:bg-brand-gold/10",
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  )
}
