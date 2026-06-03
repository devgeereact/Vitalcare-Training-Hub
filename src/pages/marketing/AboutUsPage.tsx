import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  Target,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  Mail,
  Quote,
} from "lucide-react"
import { PageHero, type HeroStat } from "@/components/marketing/PageHero"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { CTABand } from "@/components/marketing/CTABand"
import { LEADERSHIP, COMPANY, ACCREDITATION } from "@/lib/constants"

const TEAM_IMAGE =
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1400&q=70"
const CARE_IMAGE =
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=70"

const HERO_STATS: HeroStat[] = [
  { value: "2024", label: "Founded in London" },
  { value: "RN", label: "Clinical oversight" },
]

const CREDENTIALS = [
  { label: "Company number", value: COMPANY.companyNumber },
  { label: "Founded", value: COMPANY.founded },
  { label: "NHS framework", value: ACCREDITATION.nhsFramework },
  { label: "Accreditation", value: ACCREDITATION.cpd },
] as const

const PRINCIPLES = [
  {
    icon: Target,
    title: "Evidence first",
    body: "Training that maps cleanly to the standards providers answer to, with records governance teams can produce at inspection.",
  },
  {
    icon: ShieldCheck,
    title: "Clinical credibility",
    body: "Every course is overseen by a registered nurse, so content stays aligned to current practice.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable on completion",
    body: "Certificates are verifiable at vitalcare.uk/verify, so completion is simple to share and check.",
  },
] as const

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function AboutUsPage() {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
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
        eyebrow="About us"
        title="Healthcare training with clinical credibility"
        description="Vitalcare Training Hub was founded in May 2024 in south-east London to give healthcare providers training they can trust and evidence."
        imageUrl={TEAM_IMAGE}
        imageAlt="Healthcare professionals collaborating in a training session"
        stats={HERO_STATS}
      >
        <div className="flex flex-wrap gap-4">
          <Link
            to="/our-courses"
            className={`group inline-flex items-center gap-2 rounded-md bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold-light ${FOCUS} focus-visible:ring-offset-brand-navy`}
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
      </PageHero>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="Built to close the gap between training and evidence"
            />
            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p className="max-w-[60ch]">
                We started Vitalcare because too much healthcare training was
                hard to evidence and disconnected from current clinical
                practice. Care providers were paying for courses that did not
                map cleanly to the standards they answer to, and chasing paper
                certificates at inspection.
              </p>
              <p className="max-w-[60ch]">
                From our base at {COMPANY.address.line1}, {COMPANY.address.city},
                we build CSTF-aligned, CPD-accredited training for NHS Trusts,
                care homes, GP practices and individual professionals. Every
                course is overseen by a registered nurse, and every certificate
                is verifiable online.
              </p>
            </div>
            <div className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-border bg-brand-navy/5 p-5 text-sm text-brand-navy">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-brand-gold"
                aria-hidden="true"
              />
              <p className="max-w-[44ch]">
                Clinical content is overseen by{" "}
                {LEADERSHIP.clinicalDirector.name}, our{" "}
                {LEADERSHIP.clinicalDirector.role}.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            <div
              className="pointer-events-none absolute -bottom-4 -left-4 hidden h-full w-full rounded-3xl border-2 border-brand-gold/50 sm:block"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
              <img
                src={CARE_IMAGE}
                alt="A carer supporting a patient with compassion"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-brand-navy/30 to-transparent"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <BannerBand
        tone="navy"
        eyebrow="Our mission"
        heading="Training providers can trust, deliver and evidence"
        description="So staff are confident in their roles and patients receive safe care. That standard shapes every course we build and every certificate we issue."
        buttonLabel="See our accreditation"
        to="/resources/accreditations"
      />

      {/* Principles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="What we stand by"
          title="Three commitments behind every course"
          subtitle="The principles that decide what we build and how we evidence it."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={item}
              className="rounded-2xl border border-border bg-white p-7 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
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
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Leadership */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Leadership"
            title="Founded by an operational and clinical team"
            subtitle="Vitalcare is led by people who have run training programmes and worked at the front line of care."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[LEADERSHIP.ceo, LEADERSHIP.clinicalDirector].map((person) => (
              <figure
                key={person.email}
                className="flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b2e6b] to-[#142054] font-display text-2xl text-white ring-1 ring-brand-gold/40">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <figcaption className="text-lg font-semibold text-brand-navy">
                      {person.name}
                    </figcaption>
                    <p className="text-sm font-medium text-brand-gold">
                      {person.role}
                    </p>
                  </div>
                </div>
                <Quote
                  className="mt-6 size-7 text-brand-gold/70"
                  aria-hidden="true"
                />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {person.email === LEADERSHIP.ceo.email
                    ? "Leads the direction of Vitalcare Training Hub, from the product to the partnerships we build with providers."
                    : "Oversees clinical content as a registered nurse, keeping every course aligned to current practice."}
                </p>
                <a
                  href={`mailto:${person.email}`}
                  className={`mt-6 inline-flex items-center gap-2 rounded text-sm font-medium text-brand-navy hover:text-brand-gold ${FOCUS}`}
                >
                  <Mail className="size-4 text-brand-gold" aria-hidden="true" />
                  {person.email}
                </a>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Credentials"
          title="Registered, accredited and accountable"
        />
        <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CREDENTIALS.map((credential) => (
            <div
              key={credential.label}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <dt className="text-sm text-muted-foreground">
                {credential.label}
              </dt>
              <dd className="mt-1.5 font-display text-2xl text-brand-navy">
                {credential.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
          {COMPANY.legalName} is registered in {COMPANY.jurisdiction}, company
          number {COMPANY.companyNumber}. Clinical oversight is provided by{" "}
          {LEADERSHIP.clinicalDirector.name}.
        </p>
        <Link
          to="/resources/accreditations"
          className={`mt-6 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-navy underline-offset-4 hover:underline ${FOCUS}`}
        >
          Read about our accreditation
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <CTABand />
    </>
  )
}
