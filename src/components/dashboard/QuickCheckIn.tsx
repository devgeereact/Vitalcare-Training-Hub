import type { JSX } from "react"
import { Link } from "react-router-dom"
import { QrCode, ChevronRight } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent } from "@/components/ui/card"

export interface QuickCheckInSession {
  id: string
  title: string
  startsAt: string
}

interface Props {
  /** The next upcoming session to check in to, if one exists. */
  session?: QuickCheckInSession | null
  /** Hide while the upstream sessions query is still loading. */
  loading?: boolean
}

/** Prominent entry point to session check-in from the dashboard. */
export function QuickCheckIn({ session, loading = false }: Props): JSX.Element {
  const to = session
    ? `/platform/sessions/${session.id}/checkin`
    : "/platform/sessions"

  const detail = loading
    ? "Loading your next session…"
    : session
      ? `${session.title} · ${format(new Date(session.startsAt), "EEE d MMM, HH:mm")}`
      : "Pick a session to record attendance"

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1b2e6b] to-[#142054] text-white shadow-sm">
      <CardContent className="p-0">
        <Link
          to={to}
          className="flex items-center gap-4 p-5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2e6b]"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold text-brand-navy">
            <QrCode className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight">Quick check-in</p>
            <p className="truncate text-sm text-white/75">{detail}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-white/70" />
        </Link>
      </CardContent>
    </Card>
  )
}
