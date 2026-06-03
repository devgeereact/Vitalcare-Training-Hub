import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  ShieldCheck,
  Award,
  ClipboardCheck,
  Stethoscope,
  Check,
  Map,
  UserCheck,
  Layers,
  CalendarCheck,
  PenLine,
  Archive,
  FileText,
  Hash,
  Search,
  ArrowRight,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { LEADERSHIP, CREDENTIAL_PHRASE } from "@/lib/constants"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "CSTF alignment",
    body: "Our statutory and mandatory courses map to the Core Skills Training Framework subjects and learning outcomes by staff group, so completed training is recognised across NHS organisations.",
  },
  {
    icon: Award,
    title: "CPD accreditation",
    body: "Courses are CPD-accredited with logged hours, supporting revalidation and professional portfolios for nurses, carers and allied professionals.",
  },
  {
    icon: ClipboardCheck,
    title: "CQC compliance",
    body: "Reporting is designed around the questions inspectors ask, so providers can evidence safe, effective and well-led training at inspection.",
  },
  {
    icon: Stethoscope,
    title: "Registered nurse oversight",
    body: `Clinical content is overseen by ${LEADERSHIP.clinicalDirector.name}, our Clinical Director, keeping training aligned to current practice.`,
  },
] as const

const BADGE_MEANINGS = [
  {
    badge: "CSTF Aligned",
    meaning:
      "Content maps to the agreed Core Skills Training Framework subjects for the relevant staff group, so training is portable between NHS organisations.",
  },
  {
    badge: "CPD Accredited",
    meaning:
      "The course carries Continuing Professional Development accreditation with logged hours that count towards revalidation and professional portfolios.",
  },
  {
    badge: "Verifiable Certificate",
    meaning:
      "Each certificate carries a reference that can be checked at vitalcare.uk/verify, so employers and inspectors can confirm completion.",
  },
] as const

const CSTF_POINTS = [
  {
    icon: Map,
    title: "Mapped to the framework",
    body: "Each statutory and mandatory course is mapped to the Core Skills Training Framework subjects and learning outcomes, so completion can be evidenced against a recognised standard at inspection.",
  },
  {
    icon: UserCheck,
    title: "Overseen by a registered nurse",
    body: `Clinical content is reviewed and overseen by ${LEADERSHIP.clinicalDirector.name}, our ${LEADERSHIP.clinicalDirector.role}, keeping every subject aligned to current practice.`,
  },
  {
    icon: Layers,
    title: "Recorded by staff group",
    body: "Because the framework sets expectations by staff group, records are produced the same way, so managers can show the right training for the right roles.",
  },
] as const

const REVIEW_STEPS = [
  {
    step: "01",
    icon: CalendarCheck,
    title: "Checked at least yearly",
    body: "On a rolling 12-month cycle, content is checked against current guidance and updated whenever practice changes, rather than left to drift.",
  },
  {
    step: "02",
    icon: PenLine,
    title: "Signed off clinically",
    body: `Updates to clinical content are signed off by ${LEADERSHIP.clinicalDirector.name}, our Clinical Director and a registered nurse, before they reach learners.`,
  },
  {
    step: "03",
    icon: Archive,
    title: "Versions retained for audit",
    body: "Superseded versions are kept, so a certificate always reflects the content that was taught at the time and audit history stays intact.",
  },
] as const

const VERIFY_STEPS = [
  {
    step: "01",
    icon: FileText,
    title: "Recorded against the learner",
    body: "Every completion is recorded against the named learner, with the course, the result and the dates held on file.",
  },
  {
    step: "02",
    icon: Hash,
    title: "A unique reference is issued",
    body: "Each certificate carries its own reference, printed on the document, so it can be traced back to a single record.",
  },
  {
    step: "03",
    icon: Search,
    title: "Anyone can confirm it",
    body: "Enter the reference at vitalcare.uk/verify to confirm the course, the learner and the issue and expiry dates in seconds.",
  },
] as const

export default function AccreditationsPage() {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  return (
    <>
      <PageHero
        eyebrow="Accreditations"
        title="Standards you can evidence"
        description="The marks behind our training, explained in plain terms: what they mean, how content stays current, and how anyone can confirm a certificate is genuine."
      >
        <p className="text-sm text-white/70">{CREDENTIAL_PHRASE}.</p>
      </PageHero>

      {/* Accreditation pillars */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="The standards we hold"
          title="Four pillars of credible training"
          subtitle="The recognition, accreditation and oversight that procurement and inspection teams look for."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 sm:grid-cols-2"
        >
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={item}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                <Icon className="size-6" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-brand-navy">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* What the badges mean */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="In plain terms"
            title="What the badges mean"
            subtitle="The marks you see on our courses and certificates, without the jargon."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {BADGE_MEANINGS.map((badge) => (
              <div
                key={badge.badge}
                className="flex h-full flex-col rounded-2xl border border-border bg-white p-7 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
              >
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white">
                  <Check className="size-3 text-brand-gold" aria-hidden="true" />
                  {badge.badge}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {badge.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How CSTF alignment works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="The detail"
          title="How CSTF alignment works"
          subtitle="What it means in practice for a manager who has to evidence training at inspection."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 lg:grid-cols-3"
        >
          {CSTF_POINTS.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={item}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Our review cycle */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Kept current"
            title="Our review cycle"
            subtitle="A rolling 12-month review keeps content matched to current guidance and ready for audit."
          />
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-6 lg:grid-cols-3"
          >
            {REVIEW_STEPS.map(({ step, icon: Icon, title, body }) => (
              <motion.div
                key={step}
                variants={item}
                className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="font-sans text-2xl font-semibold tracking-tight text-brand-gold">
                    {step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How verification works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Verifiable by design"
          title="How verification works"
          subtitle="From completion to a certificate anyone can check, in three steps."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 lg:grid-cols-3"
        >
          {VERIFY_STEPS.map(({ step, icon: Icon, title, body }) => (
            <motion.div
              key={step}
              variants={item}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-sans text-2xl font-semibold tracking-tight text-brand-gold">
                  {step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-12 flex justify-center">
          <Link
            to="/resources/verify-certificate"
            className={`inline-flex items-center gap-2 rounded-2xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-0.5 hover:shadow-md ${FOCUS}`}
          >
            Verify a certificate
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Verification */}
      <BannerBand
        tone="gold"
        eyebrow="Verifiable by design"
        heading="Confirm a certificate in seconds"
        description="Enter a certificate reference to check completion, the course and the date awarded."
        buttonLabel="Verify a certificate"
        to="/resources/verify-certificate"
      />
    </>
  )
}
