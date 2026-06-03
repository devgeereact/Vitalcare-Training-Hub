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
  Check,
  CalendarClock,
  LineChart,
} from "lucide-react"
import { StatsBar } from "@/components/marketing/StatsBar"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { PageHero, type HeroStat } from "@/components/marketing/PageHero"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { SECTORS } from "@/data/sectors"
import { TOTAL_COURSE_COUNT, COURSE_CATEGORIES } from "@/data/courses"
import { LEADERSHIP } from "@/lib/constants"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=70"
const LEARNING_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=70"

const HERO_STATS: HeroStat[] = [
  { value: `${TOTAL_COURSE_COUNT}+`, label: "Accredited courses" },
  { value: "CSTF", label: "Framework aligned" },
]

const TRUST_CHIPS = ["CSTF-aligned", "CPD-accredited", "CQC-ready"] as const

const AUDIENCES = [
  {
    icon: Building2,
    label: "NHS Trusts",
    body: "Statutory and mandatory training your governance teams can evidence at inspection.",
    to: "/training-solutions/nhs-trusts",
  },
  {
    icon: Home,
    label: "Care Homes",
    body: "CQC-ready learning paths that onboard new starters fast and keep refreshers in date.",
    to: "/training-solutions/care-homes",
  },
  {
    icon: Stethoscope,
    label: "GP Practices",
    body: "Practical training the whole practice team can complete between clinical sessions.",
    to: "/training-solutions/gp-practices",
  },
  {
    icon: UserRound,
    label: "Individual Professionals",
    body: "CPD-accredited courses with logged hours and certificates you can verify online.",
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
    title: "Online and in person",
    body: "Self-paced online learning and live sessions, scheduled around clinical work and shift patterns.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable certificates",
    body: "Every certificate is verifiable at vitalcare.uk/verify, so completion is easy to evidence at inspection.",
  },
  {
    icon: LineChart,
    title: "Live compliance reporting",
    body: "Dashboards by department and staff group, so you can produce training records in minutes.",
  },
  {
    icon: CalendarClock,
    title: "Refresher reminders",
    body: "Automatic prompts before training expires mean nothing slips out of date across your team.",
  },
  {
    icon: BadgeCheck,
    title: "CPD-accredited catalogue",
    body: `${TOTAL_COURSE_COUNT}+ courses across ${COURSE_CATEGORIES.length} categories, from statutory mandatory to specialist clinical care.`,
  },
] as const

const TESTIMONIALS = [
  {
    quote:
      "The compliance dashboard replaced three spreadsheets. We can produce training records for inspection in minutes, by department and staff group.",
    role: "Training Lead",
    org: "NHS Trust",
  },
  {
    quote:
      "Role-based learning paths cut our induction time for new care assistants. The automatic refresher reminders mean nothing slips out of date.",
    role: "Registered Manager",
    org: "Residential Care Home",
  },
] as const

/** Sectors to feature on the home page (first four from the data source). */
const FEATURED_SECTORS = SECTORS.slice(0, 4)

export default function HomePage() {
  return (
    <>
      <PageHero
        eyebrow="Vitalcare Training Hub"
        title="Healthcare training that earns NHS trust"
        description="CSTF-aligned, CPD-accredited training for NHS Trusts, care homes and healthcare professionals. Overseen by a registered nurse, with certificates verifiable at vitalcare.uk/verify."
        imageUrl={HERO_IMAGE}
        imageAlt="Healthcare professionals in a clinical training session"
        stats={HERO_STATS}
      >
        <div className="flex flex-wrap gap-4">
          <Link
            to="/our-courses"
            className="group inline-flex items-center gap-2 rounded-md bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Explore courses
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <Link
            to="/contact-us"
            className="inline-flex items-center rounded-md border border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Talk to us
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap gap-3">
          {TRUST_CHIPS.map((chip) => (
            <li
              key={chip}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur"
            >
              <span
                className="flex size-4 items-center justify-center rounded-full bg-brand-gold/90"
                aria-hidden="true"
              >
                <Check className="size-3 text-brand-navy" />
              </span>
              {chip}
            </li>
          ))}
        </ul>
      </PageHero>

      <StatsBar />

      {/* Who we train */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Who we train"
          title="Built around the people you employ"
          subtitle="Training shaped to the roles your staff hold and the standards you answer to."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ icon: Icon, label, body, to }) => (
            <Link
              key={label}
              to={to}
              className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy transition-colors group-hover:bg-brand-gold group-hover:text-brand-navy">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-brand-navy">
                {label}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                See how we help
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Course categories */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Course catalogue"
            title="Course categories"
            subtitle={`${COURSE_CATEGORIES.length} categories spanning statutory, mandatory, clinical and specialist training.`}
            action={
              <Link
                to="/our-courses"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                View all courses
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-12">
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* Gold banner band */}
      <BannerBand
        tone="gold"
        eyebrow="Verifiable by design"
        heading="Certificates your inspectors can check in seconds"
        description="Every completion is recorded against the learner and verifiable at vitalcare.uk/verify, with a full audit history behind it."
        buttonLabel="How our accreditation works"
        to="/resources/accreditations"
      />

      {/* Training solutions by sector */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Training solutions"
          title="Mapped to the standards you answer to"
          subtitle="Training built for the way each part of the sector is inspected and governed."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURED_SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              to={`/training-solutions/${sector.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-white p-7 shadow-sm transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <h3 className="text-lg font-semibold text-brand-navy">
                {sector.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {sector.headline}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold">
                See how we help
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Vitalcare bento */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Why Vitalcare"
            title="Clinical credibility, built in"
            subtitle="The evidence and oversight that procurement and inspection teams look for, in one platform."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* Feature image tile */}
            <div className="relative overflow-hidden rounded-2xl shadow-sm lg:row-span-2">
              <img
                src={LEARNING_IMAGE}
                alt="Healthcare staff completing online training"
                loading="lazy"
                className="h-full min-h-72 w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/80 via-brand-navy/30 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-2xl leading-tight text-white">
                  Learning that fits around the shift
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Any device, at the learner's pace, with progress tracked centrally.
                </p>
              </div>
            </div>

            {WHY.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-brand-navy">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credibility: role-attributed quotes + clinical sign-off */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="In their words"
          title="Built for the people who answer to inspection"
          subtitle="How training leads describe working with Vitalcare."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.org}
              className="flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm"
            >
              <Quote className="size-8 text-brand-gold" aria-hidden="true" />
              <blockquote className="mt-5 text-lg leading-relaxed text-foreground">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm font-semibold text-brand-navy">
                {item.role}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  {item.org}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-brand-navy/5 p-6 text-sm text-brand-navy">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-brand-gold"
            aria-hidden="true"
          />
          <p>
            Clinical content is overseen by {LEADERSHIP.clinicalDirector.name},
            our {LEADERSHIP.clinicalDirector.role}.
          </p>
        </div>
      </section>

      {/* Closing navy banner band */}
      <BannerBand
        tone="navy"
        eyebrow="Get started"
        heading="Bring trusted training to your team"
        description="Set up your organisation, enrol your staff and start evidencing compliance from day one. Talk to us about a package that fits."
        buttonLabel="Create an account"
        to="/sign-up"
      />
    </>
  )
}
