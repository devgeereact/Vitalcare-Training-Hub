import { Link } from "react-router-dom"
import {
  Building2,
  Home,
  Stethoscope,
  UserRound,
  ShieldCheck,
  MonitorPlay,
  BadgeCheck,
  ArrowRight,
  Quote,
} from "lucide-react"
import { TrustBadges } from "@/components/marketing/TrustBadges"
import { StatsBar } from "@/components/marketing/StatsBar"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { CTABand } from "@/components/marketing/CTABand"
import { SECTORS } from "@/data/sectors"
import { LEADERSHIP } from "@/lib/constants"

const AUDIENCES = [
  { icon: Building2, label: "NHS Trusts", to: "/training-solutions/nhs-trusts" },
  { icon: Home, label: "Care Homes", to: "/training-solutions/care-homes" },
  { icon: Stethoscope, label: "GP Practices", to: "/training-solutions/gp-practices" },
  {
    icon: UserRound,
    label: "Individual Professionals",
    to: "/training-solutions/individual-professionals",
  },
] as const

const WHY = [
  {
    icon: ShieldCheck,
    title: "Registered nurse oversight",
    body: "Clinical content is overseen by Harni Muharami RN MSc, our Clinical Director, so training reflects current practice.",
  },
  {
    icon: MonitorPlay,
    title: "Online and in-person",
    body: "Self-paced online learning and live sessions, scheduled around clinical work and shift patterns.",
  },
  {
    icon: BadgeCheck,
    title: "Instant certificate verification",
    body: "Every certificate is verifiable at vitalcare.uk/verify, so completion is easy to evidence at inspection.",
  },
] as const

const TESTIMONIALS = [
  {
    quote:
      "The compliance dashboard replaced three spreadsheets. We can produce training records for inspection in minutes, by department and staff group.",
    name: "Training Lead",
    org: "NHS Trust",
  },
  {
    quote:
      "Role-based learning paths cut our induction time for new care assistants. The automatic refresher reminders mean nothing slips out of date.",
    name: "Registered Manager",
    org: "Residential Care Home",
  },
] as const

/** Sectors to feature on the home page (first four from the data source). */
const FEATURED_SECTORS = SECTORS.slice(0, 4)

export default function HomePage() {
  return (
    <>
      {/* Hero with diagonal navy-to-white split */}
      <section className="relative overflow-hidden bg-white">
        <div
          className="absolute inset-0 bg-brand-navy"
          style={{ clipPath: "polygon(0 0, 62% 0, 42% 100%, 0% 100%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
              Vitalcare Training Hub
            </p>
            <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Healthcare Training That Earns NHS Trust
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/85">
              CSTF-aligned, CPD-accredited training for NHS Trusts, care homes
              and healthcare professionals. Overseen by a registered nurse.
              Certificates verifiable at vitalcare.uk/verify.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/our-courses"
                className="inline-flex items-center gap-2 rounded-md bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                Explore Our Courses
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/sign-up"
                className="inline-flex items-center rounded-md border border-white/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
              >
                Create an Account
              </Link>
            </div>
          </div>

          <div className="flex items-end lg:justify-end">
            <div className="w-full rounded-2xl border border-border bg-white p-8 shadow-xl lg:max-w-md">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
                Trusted standards
              </p>
              <div className="mt-4">
                <TrustBadges />
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
              </p>
              <Link
                to="/resources/accreditations"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                How our accreditation works
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StatsBar />

      {/* Who we train */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-brand-navy">Who we train</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Training shaped to the people you employ and the standards you answer to.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col items-start rounded-xl border border-border bg-white p-6 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy transition-colors group-hover:bg-brand-gold/15 group-hover:text-brand-gold">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 font-semibold text-brand-navy">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Course categories */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-brand-navy">
                Course categories
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Fifteen categories spanning statutory, mandatory, clinical and
                specialist training.
              </p>
            </div>
            <Link
              to="/our-courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              View all courses
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10">
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* Training solutions by sector */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-brand-navy">
              Training solutions by sector
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Training mapped to the standards each part of the sector answers to.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FEATURED_SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              to={`/training-solutions/${sector.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-white p-7 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <h3 className="text-lg font-semibold text-brand-navy">
                {sector.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {sector.headline}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-gold">
                See how we help
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Vitalcare (asymmetric) */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="font-display text-3xl text-brand-navy">
                Why Vitalcare
              </h2>
              <p className="mt-4 text-muted-foreground">
                Training built for healthcare, with the clinical credibility and
                evidence that procurement and inspection teams look for.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
              {WHY.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span className="flex size-11 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-brand-navy">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Credibility: testimonials + clinical sign-off */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl text-brand-navy">
          Built for the people who answer to inspection
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          How training leads describe working with Vitalcare.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.org}
              className="flex flex-col rounded-xl border border-border bg-white p-8"
            >
              <Quote
                className="size-7 text-brand-gold"
                aria-hidden="true"
              />
              <blockquote className="mt-4 text-base leading-relaxed text-foreground">
                {item.quote}
              </blockquote>
              <figcaption className="mt-5 text-sm font-medium text-brand-navy">
                {item.name}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {item.org}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-border bg-brand-navy/5 p-6 text-sm text-brand-navy">
          Clinical content is overseen by {LEADERSHIP.clinicalDirector.name},
          our {LEADERSHIP.clinicalDirector.role}.
        </div>
      </section>

      <CTABand />
    </>
  )
}
