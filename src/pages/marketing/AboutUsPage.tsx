import { Link } from "react-router-dom"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import {
  ShieldCheck,
  ScrollText,
  HeartHandshake,
  ArrowRight,
  Mail,
  BadgeCheck,
  BookOpen,
  MapPin,
  Phone,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { BannerBand } from "@/components/marketing/BannerBand"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { LEADERSHIP, COMPANY } from "@/lib/constants"
import { PageMeta } from "@/components/seo/PageMeta"

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

interface Founder {
  name: string
  role: string
  email: string
  credentials?: string
  bio: string
}

const FOUNDERS: Founder[] = [
  {
    name: "Harni Muharami, RN MSc",
    role: "Co-Founder and Clinical Director",
    email: LEADERSHIP.clinicalDirector.email,
    credentials: "RN, MSc, active NMC registrant",
    bio: "A Registered Nurse with a Master of Science degree and more than a decade of NHS experience spanning acute care, infection prevention and control, and clinical leadership. She designed the clinical content of every Vitalcare course and oversees all course content, trainer standards, and quality assurance. She holds current NMC registration and continues to practise.",
  },
  {
    name: "Gideon Akinlotan",
    role: "Founder and CEO",
    email: LEADERSHIP.ceo.email,
    bio: "Brings operational, strategic and digital expertise to Vitalcare Training Hub. He built Vitalcare with infrastructure clinical providers typically lack: fast certificate issuance with unique verification IDs, a clean booking experience, clear pricing, and the systems that let an NHS L&D manager demonstrate compliance evidence. As CEO he oversees operations, partnerships and organisational strategy.",
  },
]

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Clinical Accuracy Above All",
    body: "Every module is written and reviewed by an active clinical practitioner, checked against current guidelines: Resuscitation Council UK, the Care Act 2014, and WHO hand hygiene.",
  },
  {
    icon: BadgeCheck,
    title: "Honest Accountability",
    body: "We issue certificates only to candidates who demonstrate competence. If someone does not meet the standard we say so and offer a resit.",
  },
  {
    icon: HeartHandshake,
    title: "Accessible by Design",
    body: "Fair prices, a simple booking process, and training delivered online or in person for organisations of all sizes. A 12-person care home deserves the same quality as an NHS trust.",
  },
] as const

export default function AboutUsPage() {
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
  }
  const item: Variants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  }

  return (
    <>
      <PageMeta
        title="About us"
        description="Vitalcare Training Hub is a CPD-accredited healthcare training provider working with NHS Trusts, care homes and independent practitioners across the UK."
        canonicalPath="/about-us"
      />
      <PageHero
        eyebrow="About us"
        title="About Vitalcare Training Hub"
        description="Mandatory healthcare training, delivered by people who still practise, mapped to the frameworks CQC inspectors look for, and documented to hold up under scrutiny."
      >
        <div className="flex flex-wrap gap-4">
          <Link
            to="/our-courses"
            className={`group inline-flex items-center gap-2 rounded-md bg-brand-gold px-7 py-3.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold-light ${FOCUS} focus-visible:ring-offset-brand-navy`}
          >
            Explore Our Courses
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <Link
            to="/contact-us"
            className="inline-flex items-center rounded-md border border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
          >
            Get a Quote
          </Link>
        </div>
      </PageHero>

      {/* Why We Exist */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Why we exist"
          title="A question neither of our founders could stop asking"
        />
        <div className="mt-8 grid gap-12 lg:grid-cols-3">
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground lg:col-span-2">
            <p className="max-w-[65ch]">
              Vitalcare Training Hub started with a question that neither of our
              founders could stop asking: why is mandatory healthcare training so
              often treated as a box to tick rather than a skill to build? Both
              Harni and Gideon had seen what happens when training is rushed,
              outsourced to providers who have never worked a shift, or delivered
              in formats that nobody retains.
            </p>
            <p className="max-w-[65ch]">
              Harni had watched staff freeze in situations where a solid BLS
              drill would have made the difference. Gideon had seen organisations
              scramble before CQC inspections, trying to backfill training
              records for staff who had sat through sessions that taught them
              almost nothing.
            </p>
            <p className="max-w-[65ch]">
              We built Vitalcare Training Hub to offer something different:
              training delivered by people who still practise, mapped to the
              frameworks that CQC inspectors look for, and documented in a way
              that holds up under scrutiny.
            </p>
          </div>

          <aside className="rounded-2xl border border-border bg-brand-navy/5 p-7">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy">
              <MapPin className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-brand-navy">
              Where we work
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We are based in South East London, SE13. We deliver across Greater
              London and deliver training in person at your premises or live
              online.
            </p>
            <p className="mt-4 text-sm font-medium text-brand-navy">
              {COMPANY.address.line1}, {COMPANY.address.city}{" "}
              {COMPANY.address.postcode}
            </p>
          </aside>
        </div>
      </section>

      {/* Founders */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Our founders"
            title="An operational lead and a clinical lead"
            subtitle="Vitalcare is run by people who have built training programmes and worked at the front line of care."
          />
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-6 lg:grid-cols-2"
          >
            {FOUNDERS.map((person) => (
              <motion.figure
                key={person.email}
                variants={item}
                className="flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-[transform,box-shadow] duration-200 will-change-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b2e6b] to-[#142054] font-sans font-semibold tracking-tight text-2xl text-white ring-1 ring-brand-gold/40">
                    {person.name
                      .replace(/,.*$/, "")
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
                <p className="mt-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {person.bio}
                </p>
                {person.credentials ? (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-gold/[0.08] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-navy">
                    <BadgeCheck
                      className="size-4 text-brand-gold"
                      aria-hidden="true"
                    />
                    {person.credentials}
                  </p>
                ) : null}
                <a
                  href={`mailto:${person.email}`}
                  className={`mt-6 inline-flex items-center gap-2 rounded text-sm font-medium text-brand-navy hover:text-brand-gold ${FOCUS}`}
                >
                  <Mail className="size-4 text-brand-gold" aria-hidden="true" />
                  {person.email}
                </a>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <BannerBand
        tone="navy"
        eyebrow="Our mission"
        heading="Raising the standard of mandatory healthcare training"
        description="To make evidence-based, clinically grounded courses accessible to every professional and every organisation in the UK, regardless of size."
        buttonLabel="Explore Our Courses"
        to="/our-courses"
      />

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Our values"
          title="Three principles behind every course"
          subtitle="What decides the training we build and the certificates we issue."
        />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VALUES.map(({ icon: Icon, title, body }) => (
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

      {/* CSTF Alignment */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="CSTF alignment"
                title="Built on evidence CQC inspectors recognise"
              />
              <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
                <p className="max-w-[60ch]">
                  The NHS Core Skills Training Framework sets the national
                  standard for mandatory training in health and social care, and
                  CQC inspectors use it as a reference. All four Vitalcare
                  courses are CSTF-aligned, so your training records are built on
                  evidence CQC inspectors recognise.
                </p>
                <p className="max-w-[60ch]">
                  Each course maps directly to the relevant CSTF subject area and
                  is reviewed against the framework on a rolling 12-month cycle.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-gold/30 bg-white p-8 shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-xl bg-brand-navy text-white">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Framework
                  </dt>
                  <dd className="mt-1 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                    CSTF-aligned
                  </dd>
                </div>
                <div className="h-px bg-border" aria-hidden="true" />
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Review cycle
                  </dt>
                  <dd className="mt-1 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                    Rolling 12 months
                  </dd>
                </div>
                <div className="h-px bg-border" aria-hidden="true" />
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Verification
                  </dt>
                  <dd className="mt-1 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                    vitalcare.uk/verify
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing Imprint */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[auto,1fr] lg:items-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-navy text-white">
              <BookOpen className="size-8" aria-hidden="true" />
            </span>
            <div>
              <p className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold-ink">
                <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
                Our publishing imprint
              </p>
              <h2 className="mt-3 font-sans font-semibold tracking-tight text-3xl leading-tight text-brand-navy sm:text-4xl">
                Reference texts and training support materials
              </h2>
              <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                Vitalcare Training Hub maintains a publishing imprint producing
                healthcare reference texts and training support materials,
                written by Harni Muharami and Gideon Akinlotan, covering
                infection prevention, safeguarding practice, and clinical
                decision support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Work With Us */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="Work with us"
                title="Open to organisations of all sizes"
              />
              <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
                We are open to organisations of all sizes: NHS trusts, care
                homes, GP practices, supported-living providers, and community
                healthcare teams. Training is delivered online or in person, with
                group bookings and rolling contracts available. Once you join,
                you can request a 1:1 session on any course you are finding
                difficult.
              </p>
              <div className="mt-8 flex flex-col gap-3 text-sm">
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className={`inline-flex items-center gap-3 rounded text-brand-navy hover:text-brand-gold ${FOCUS}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className={`inline-flex items-center gap-3 rounded text-brand-navy hover:text-brand-gold ${FOCUS}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-navy">
                    <Mail className="size-5" aria-hidden="true" />
                  </span>
                  {COMPANY.email}
                </a>
              </div>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-navy">
                <ScrollText
                  className="size-4 text-brand-gold"
                  aria-hidden="true"
                />
                We read every message and aim to reply within one working day.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/contact-us"
                  className={`group inline-flex items-center gap-2 rounded-md bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-navy-dark ${FOCUS}`}
                >
                  Get a Quote
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  to="/our-courses"
                  className={`inline-flex items-center gap-2 rounded-md border border-brand-navy/20 px-7 py-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-navy/5 ${FOCUS}`}
                >
                  Explore Our Courses
                </Link>
              </div>
            </div>

            <motion.ul
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                "NHS trusts",
                "Care homes",
                "GP practices",
                "Supported-living providers",
                "Community healthcare teams",
                "Group bookings and rolling contracts",
              ].map((label) => (
                <motion.li
                  key={label}
                  variants={item}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm"
                >
                  <BadgeCheck
                    className="mt-0.5 size-5 shrink-0 text-brand-gold"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-brand-navy">
                    {label}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      <BannerBand
        tone="navy"
        eyebrow="Work with us"
        heading="Bring trusted training to your team"
        description="Set up your organisation, enrol your staff and evidence compliance from day one."
        buttonLabel="Contact us"
        to="/contact-us"
      />
    </>
  )
}
