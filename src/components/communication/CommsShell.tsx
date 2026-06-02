import type { ReactNode } from "react"

import CommsNav from "@/components/communication/CommsNav"

interface CommsShellProps {
  /** Sub-heading for the active section, shown under the area title. */
  subtitle: string
  /** Optional action slot, rendered top-right (e.g. a "New" button). */
  action?: ReactNode
  children: ReactNode
}

/**
 * Shared layout for every Communication sub-page. Renders the area title, an
 * optional per-page action, the segmented CommsNav, then the page content.
 * Each page renders this itself so routes stay untouched.
 */
export default function CommsShell({
  subtitle,
  action,
  children,
}: CommsShellProps): ReactNode {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Communication</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>

      <CommsNav />

      <div className="space-y-6">{children}</div>
    </div>
  )
}
