import { Link } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  GraduationCap,
  ArrowRight,
} from "lucide-react"
import type { PublicEvent } from "@/lib/queries/public-events.queries"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  const start = new Date(startIso).toLocaleTimeString("en-GB", opts)
  const end = new Date(endIso).toLocaleTimeString("en-GB", opts)
  return `${start} to ${end}`
}

/**
 * Shared event card for the events page and homepage teaser. Fixed structure
 * with a flex body so every card in a row settles to the same height and the
 * action pins to the bottom.
 */
export function EventCard({ event }: { event: PublicEvent }): React.ReactElement {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start gap-4 border-b border-border bg-brand-navy/[0.03] px-6 py-5">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#1b2e6b] to-[#142054] text-white ring-1 ring-brand-gold/30">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-gold">
            {new Date(event.starts_at).toLocaleDateString("en-GB", {
              month: "short",
            })}
          </span>
          <span className="text-2xl font-semibold leading-tight tracking-tight">
            {new Date(event.starts_at).getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-navy">
            {event.is_virtual ? "Online" : "In person"}
          </span>
          <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-tight tracking-tight text-brand-navy">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-6 py-5">
        <p className="flex items-center gap-2.5 text-sm text-foreground">
          <CalendarDays className="size-4 shrink-0 text-brand-gold" />
          {formatDate(event.starts_at)}
        </p>
        <p className="flex items-center gap-2.5 text-sm text-foreground">
          <Clock className="size-4 shrink-0 text-brand-gold" />
          {formatTimeRange(event.starts_at, event.ends_at)}
        </p>
        <p className="flex items-center gap-2.5 text-sm text-foreground">
          {event.is_virtual ? (
            <Monitor className="size-4 shrink-0 text-brand-gold" />
          ) : (
            <MapPin className="size-4 shrink-0 text-brand-gold" />
          )}
          {event.is_virtual ? "Live online session" : (event.venue ?? "In person")}
        </p>
        {event.course_title ? (
          <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <GraduationCap className="size-4 shrink-0 text-brand-gold" />
            {event.course_title}
          </p>
        ) : null}
        {event.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <Link
            to="/contact-us"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
          >
            Register interest
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
