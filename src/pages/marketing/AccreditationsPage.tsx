import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  ShieldCheck,
  Award,
  ClipboardCheck,
  Stethoscope,
  Check,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP } from "@/lib/constants"

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
        description="CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify. The marks behind our training explained in plain terms."
      />

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
              className="flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
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
                className="flex flex-col rounded-2xl border border-border bg-white p-7 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
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

      {/* Verification */}
      <BannerBand
        tone="gold"
        eyebrow="Verifiable by design"
        heading="Confirm a certificate in seconds"
        description="Enter a certificate reference to check completion, the course and the date awarded. Genuine, in date and ready for inspection."
        buttonLabel="Verify a certificate"
        to="/resources/verify-certificate"
      />

      <CTABand />
    </>
  )
}
