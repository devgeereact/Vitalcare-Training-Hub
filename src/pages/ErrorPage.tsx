import { useRouteError, Link } from "react-router-dom"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string } | null
  const detail = error?.statusText || error?.message || "Unexpected error"

  // A failed dynamic import (stale chunk after a deploy) is recoverable with a
  // reload. Detect it so the reload button is the obvious next step.
  const isChunkError = /loading chunk|dynamically imported module|importing a module/i.test(
    detail,
  )

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-gold">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-3xl text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isChunkError
          ? "A new version of the app is available. Reload to continue."
          : detail}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <RefreshCw className="size-4" aria-hidden /> Reload
        </button>
        <Link
          to="/platform/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Home className="size-4" aria-hidden /> Dashboard
        </Link>
      </div>
    </div>
  )
}
