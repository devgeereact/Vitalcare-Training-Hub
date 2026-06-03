import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import {
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  MonitorPlay,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { EventCard } from "@/components/marketing/EventCard"
import { CTABand } from "@/components/marketing/CTABand"
import { Pagination } from "@/components/marketing/Pagination"
import { usePublicEvents } from "@/lib/queries/public-events.queries"
import { img, imgAlt } from "@/data/marketing-images"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

const PAGE_SIZE = 12

const WHAT_TO_EXPECT = [
  {
    icon: ShieldCheck,
    title: "Clinical oversight",
    body: "Every session is built on content overseen by our Clinical Director, a registered nurse.",
  },
  {
    icon: MonitorPlay,
    title: "Online or in person",
    body: "Join live online from anywhere, or attend an in-person session at an arranged venue.",
  },
  {
    icon: BadgeCheck,
    title: "A verifiable certificate",
    body: "Complete the session and receive a CPD-accredited certificate, verifiable at vitalcare.uk/verify.",
  },
] as const

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
        imageUrl={img("clinicalTraining")}
        imageAlt={imgAlt("clinicalTraining")}
      >
        <p className="text-sm text-white/70">
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
        </p>
      </PageHero>

      {/* What to expect */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          {WHAT_TO_EXPECT.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-brand-navy">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

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
              <p className="font-sans text-2xl font-semibold tracking-tight text-brand-navy">
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
              <h2 className="mt-6 font-sans text-2xl font-semibold tracking-tight text-brand-navy">
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
                    className="h-full"
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
