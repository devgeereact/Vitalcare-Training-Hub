import { Link, useParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Check, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { BannerBand } from "@/components/marketing/BannerBand"
import { getSector } from "@/data/sectors"
import { getCategory } from "@/data/courses"

export default function TrainingSolutionPage(): React.ReactElement {
  const { sector: sectorSlug } = useParams<{ sector: string }>()
  const sector = sectorSlug ? getSector(sectorSlug) : undefined
  const reduce = useReducedMotion()

  if (!sector) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-sans font-semibold tracking-tight text-3xl text-brand-navy">
          Solution not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          That training solution does not exist.
        </p>
        <Link
          to="/our-courses"
          className="mt-6 inline-flex rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          Browse courses
        </Link>
      </section>
    )
  }

  const categories = sector.categorySlugs
    .map((slug) => getCategory(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <>
      <PageHero
        eyebrow="Training solutions"
        title={sector.headline}
        description={sector.intro}
      >
        <p className="text-sm text-white/70">
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
        </p>
      </PageHero>

      {/* Challenges + how we help */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="The fit"
          title={`Built for ${sector.name.toLowerCase()}`}
          subtitle="The pressures we hear from teams like yours, and how we answer them."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="flex items-center gap-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              The challenges we hear
            </h3>
            <ul className="mt-6 space-y-4">
              {sector.painPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-muted-foreground"
                >
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-navy/30"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.08 }}
            className="flex h-full flex-col rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="flex items-center gap-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              How Vitalcare helps
            </h3>
            <ul className="mt-6 space-y-4">
              {sector.howWeHelp.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-success"
                    aria-hidden
                  />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* How we get you started */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Getting started"
          title="A clear path from enquiry to evidence"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Scope your training",
              body: "We map the roles you employ to the courses and standards they need, statutory, mandatory and clinical.",
            },
            {
              title: "Enrol your team",
              body: "Add your staff, assign role-based learning paths, and set the refresher cycle that keeps everything in date.",
            },
            {
              title: "Evidence compliance",
              body: "Track completion on live dashboards and produce inspection-ready records in minutes, by department or staff group.",
            },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08 }}
              className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy font-semibold">
                {i + 1}
              </span>
              <h3 className="mt-5 font-sans font-semibold tracking-tight text-xl text-brand-navy">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Relevant categories */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Where to start"
            title="Relevant course categories"
            subtitle={`A starting point for ${sector.name.toLowerCase()}. Open a category to see the courses within it.`}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, i) => (
              <motion.div
                key={category.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.06 }}
              >
                <Link
                  to={`/our-courses/${category.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                    {category.count} courses
                  </span>
                  <span className="mt-2 font-sans font-semibold tracking-tight text-xl text-brand-navy">
                    {category.name}
                  </span>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {category.blurb}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                    View courses
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BannerBand
        eyebrow="Browse everything"
        heading="See the full course catalogue"
        description="190+ courses across fifteen categories, from statutory and mandatory training to clinical and specialist subjects."
        buttonLabel="All courses"
        to="/our-courses"
        tone="navy"
      />

      <BannerBand
        tone="navy"
        eyebrow="Get started"
        heading="Bring this to your service"
        description="Set up your team, assign role-based learning and evidence compliance from day one."
        buttonLabel="Talk to us"
        to="/contact-us"
      />
    </>
  )
}
