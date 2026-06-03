import { Link } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  GraduationCap,
  ArrowRight,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { usePublicEvents, type PublicEvent } from "@/lib/queries/public-events.queries"

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

function EventCard({ event }: { event: PublicEvent }): React.ReactElement {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-border bg-brand-navy/[0.03] px-6 py-4">
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-navy text-white">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-gold">
            {new Date(event.starts_at).toLocaleDateString("en-GB", {
              month: "short",
            })}
          </span>
          <span className="font-display text-xl leading-tight">
            {new Date(event.starts_at).getDate()}
          </span>
        </div>
        <h2 className="font-display text-xl text-brand-navy">{event.title}</h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-6 py-5">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <CalendarDays className="size-4 shrink-0 text-brand-gold" />
          {formatDate(event.starts_at)}
        </p>
        <p className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="size-4 shrink-0 text-brand-gold" />
          {formatTimeRange(event.starts_at, event.ends_at)}
        </p>
        <p className="flex items-center gap-2 text-sm text-foreground">
          {event.is_virtual ? (
            <Monitor className="size-4 shrink-0 text-brand-gold" />
          ) : (
            <MapPin className="size-4 shrink-0 text-brand-gold" />
          )}
          {event.is_virtual ? "Online" : (event.venue ?? "In person")}
        </p>
        {event.course_title ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4 shrink-0 text-brand-gold" />
            {event.course_title}
          </p>
        ) : null}
        {event.description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
      </div>

      <div className="px-6 pb-6">
        <Link
          to="/contact-us"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
        >
          Register interest
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  )
}

export default function EventsPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = usePublicEvents()

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Upcoming training sessions"
        description="Live and online sessions open to book. New dates are added regularly, so check back or contact us to arrange training for your team."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-border bg-muted/50"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-10 text-center">
            <p className="font-display text-2xl text-brand-navy">
              Could not load events
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while loading upcoming sessions. Please try
              again.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className={`mt-6 rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
            >
              Try again
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-navy/[0.06]">
              <CalendarDays className="size-7 text-brand-navy/50" />
            </div>
            <h2 className="mt-5 font-display text-2xl text-brand-navy">
              No upcoming public events yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              There are no open sessions scheduled right now. Contact us to
              arrange training for your team or to join the next available date.
            </p>
            <Link
              to="/contact-us"
              className={`mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
            >
              Contact us
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <CTABand />
    </>
  )
}
