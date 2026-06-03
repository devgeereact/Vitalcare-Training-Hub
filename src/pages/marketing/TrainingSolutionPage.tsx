import { Link, useParams } from "react-router-dom"
import { Check, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { getSector } from "@/data/sectors"
import { getCategory } from "@/data/courses"

export default function TrainingSolutionPage(): React.ReactElement {
  const { sector: sectorSlug } = useParams<{ sector: string }>()
  const sector = sectorSlug ? getSector(sectorSlug) : undefined

  if (!sector) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-brand-navy">
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
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-8">
            <h2 className="flex items-center gap-2 font-display text-2xl text-brand-navy">
              <AlertTriangle className="size-5 text-brand-gold" aria-hidden />
              The challenges we hear
            </h2>
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
          </div>

          <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-8">
            <h2 className="flex items-center gap-2 font-display text-2xl text-brand-navy">
              <ShieldCheck className="size-5 text-brand-gold" aria-hidden />
              How Vitalcare helps
            </h2>
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
          </div>
        </div>
      </section>

      {/* Relevant categories */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl text-brand-navy">
              Relevant course categories
            </h2>
            <p className="mt-3 text-muted-foreground">
              A starting point for{" "}
              {sector.name.toLowerCase()}. Open a category to see the courses
              within it.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/our-courses/${category.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-white p-5 transition-transform duration-200 will-change-transform hover:-translate-y-1 hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                <span className="font-semibold text-brand-navy">
                  {category.name}
                </span>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {category.blurb}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                  View courses
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        heading={`Bring Vitalcare training to your ${sector.name.toLowerCase()}`}
      />
    </>
  )
}
