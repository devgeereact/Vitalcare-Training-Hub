import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  GraduationCap,
  ArrowRight,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { CTABand } from "@/components/marketing/CTABand"
import { Pagination } from "@/components/marketing/Pagination"
import { usePublicEvents, type PublicEvent } from "@/lib/queries/public-events.queries"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

const PAGE_SIZE = 12

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
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start gap-4 border-b border-border bg-brand-navy/[0.03] px-6 py-5">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#1b2e6b] to-[#142054] text-white ring-1 ring-brand-gold/30">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-gold">
            {new Date(event.starts_at).toLocaleDateString("en-GB", {
              month: "short",
            })}
          </span>
          <span className="font-display text-2xl leading-tight">
            {new Date(event.starts_at).getDate()}
          </span>
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-navy">
            {event.is_virtual ? "Online" : "In person"}
          </span>
          <h2 className="mt-1.5 font-display text-xl leading-tight text-brand-navy">
            {event.title}
          </h2>
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
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
      </div>

      <div className="px-6 pb-6">
        <Link
          to="/contact-us"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
        >
          Register interest
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}

export default function EventsPage(): React.ReactElement {
  const reduce = useReducedMotion()
  const { data, isLoading, isError, refetch } = usePublicEvents()

  const events = useMemo(() => data ?? [], [data])
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE))

  // Reset to the first page whenever the underlying data reshapes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging on data change
    setPage(1)
  }, [events.length])

  const pagedEvents = useMemo(
    () => events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [events, page],
  )

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Upcoming training sessions"
        description="Live and online sessions open to book. New dates are added regularly, so check back or contact us to arrange training for your team."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Open to book"
          title="Public sessions on the calendar"
          subtitle="Sessions you can join, online or in person, with clinical oversight on every course."
        />

        <div className="mt-12">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-12 text-center shadow-sm">
              <p className="font-display text-2xl text-brand-navy">
                Could not load events
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Something went wrong while loading upcoming sessions. Please try
                again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className={`mt-6 rounded-md bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
              >
                Try again
              </button>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-14 text-center shadow-sm">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-gold/15">
                <CalendarDays className="size-8 text-brand-navy" />
              </div>
              <h2 className="mt-6 font-display text-2xl text-brand-navy">
                No upcoming public events yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                There are no open sessions scheduled right now. Contact us to
                arrange training for your team or to join the next available
                date.
              </p>
              <Link
                to="/contact-us"
                className={`mt-6 inline-flex items-center gap-2 rounded-md bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
              >
                Contact us
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pagedEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: reduce ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 0.45,
                      delay: reduce ? 0 : Math.min(i, 5) * 0.06,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>

              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                label="Events pagination"
                className="mt-12"
              />
            </>
          )}
        </div>
      </section>

      <CTABand />
    </>
  )
}
