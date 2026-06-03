import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
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
  CalendarClock,
  LineChart,
  Award,
  FileCheck2,
  Clock3,
} from "lucide-react"
import { StatsBar } from "@/components/marketing/StatsBar"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { SECTORS } from "@/data/sectors"
import { TOTAL_COURSE_COUNT, COURSE_CATEGORIES } from "@/data/courses"
import { LEADERSHIP } from "@/lib/constants"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=70"
const LEARNING_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=70"

/** Flagship trust bar shown beneath the hero CTAs. */
const HERO_TRUST = [
  { icon: ShieldCheck, label: "CSTF-Aligned Courses" },
  { icon: Award, label: "CPD-Accredited" },
  { icon: FileCheck2, label: "Certificates Verifiable Online" },
  { icon: Clock3, label: "24-Hour Certificate Issue" },
] as const

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

/**
 * Flagship homepage hero. Bespoke, distinct from the interior PageHero:
 * editorial split layout, layered navy gradient with grid + dot texture,
 * gold glows, a masked healthcare photo and a four-chip trust bar.
 */
function HomeHero() {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  return (
    <section className="relative overflow-hidden bg-brand-navy">
      {/* Rich navy gradient base */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1b2e6b] via-[#142054] to-[#0b1129]"
        aria-hidden="true"
      />
      {/* Layered gold glows */}
      <div
        className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-brand-gold/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-28 size-[30rem] rounded-full bg-brand-gold/10 blur-3xl"
        aria-hidden="true"
      />
      {/* Fine grid texture, masked towards the top-left */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse at 25% 15%, black 0%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 25% 15%, black 0%, transparent 72%)",
        }}
        aria-hidden="true"
      />
      {/* Dot texture overlay for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(212,168,67,0.9) 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at 80% 90%, black 0%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 80% 90%, black 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      {/* Gold hairline along the bottom edge */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
        {/* Editorial column */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold-light"
          >
            <span className="size-1.5 rounded-full bg-brand-gold" aria-hidden="true" />
            CSTF-aligned · CPD-accredited · CQC-ready
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-6 max-w-2xl font-display text-5xl leading-tight text-white sm:text-6xl lg:text-7xl"
          >
            Healthcare Training Built for Real Care Environments.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/80"
          >
            CSTF-aligned, CPD-accredited mandatory training for NHS and care
            sector professionals. CQC-ready certificates issued within 24 hours.
            Delivered in South East London and across Greater London.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/our-courses"
              className="group inline-flex items-center gap-2 rounded-md bg-brand-navy px-7 py-3.5 text-sm font-semibold text-brand-gold shadow-lg ring-1 ring-inset ring-brand-gold/40 transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            >
              Explore Our Courses
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              to="/contact-us"
              className="inline-flex items-center rounded-md bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy shadow-lg transition-colors hover:bg-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            >
              Get a Quote
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.ul
            variants={item}
            className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          >
            {HERO_TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-white backdrop-blur"
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/90"
                  aria-hidden="true"
                >
                  <Icon className="size-3 text-brand-navy" />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Visual column */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 30, scale: reduce ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.75,
            ease: [0.21, 0.47, 0.32, 0.98],
            delay: 0.12,
          }}
          className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-none"
        >
          {/* Gold ring accent behind the frame */}
          <div
            className="pointer-events-none absolute -right-4 -top-4 hidden h-full w-full rounded-3xl border-2 border-brand-gold/60 sm:block"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
            <img
              src={HERO_IMAGE}
              alt="Healthcare professionals in a clinical training session"
              loading="eager"
              className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark/55 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>

          {/* Floating practitioner-credibility card */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.5,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="absolute -bottom-6 -left-4 max-w-[17rem] rounded-2xl border border-white/20 bg-white/95 p-5 shadow-xl backdrop-blur sm:-left-8"
          >
            <ShieldCheck
              className="size-6 text-brand-gold"
              aria-hidden="true"
            />
            <p className="mt-2.5 text-sm font-medium leading-snug text-brand-navy">
              Healthcare training built by practitioners who know what is at
              stake.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <HomeHero />

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
