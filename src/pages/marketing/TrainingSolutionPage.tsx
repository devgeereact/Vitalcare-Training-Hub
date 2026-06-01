import { Link, useParams } from "react-router-dom"
import { Check, ArrowRight } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { getSector } from "@/data/sectors"
import { getCategory } from "@/data/courses"

export default function TrainingSolutionPage() {
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
      <PageHero eyebrow="Training solutions" title={sector.headline} description={sector.intro} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-brand-navy">
              The challenges we hear
            </h2>
            <ul className="mt-6 space-y-4">
              {sector.painPoints.map((point) => (
                <li key={point} className="text-muted-foreground">
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-brand-navy">
              How Vitalcare helps
            </h2>
            <ul className="mt-6 space-y-4">
              {sector.howWeHelp.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-brand-gold" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-brand-navy">
            Relevant course categories
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/our-courses/${category.slug}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-white p-5 transition-colors hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                <span className="font-medium text-brand-navy">{category.name}</span>
                <ArrowRight className="size-4 text-brand-gold opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABand heading={`Bring Vitalcare training to your ${sector.name.toLowerCase()}`} />
    </>
  )
}
