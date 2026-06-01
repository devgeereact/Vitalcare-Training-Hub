import { Link } from "react-router-dom"
import { PageHero } from "@/components/marketing/PageHero"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { CTABand } from "@/components/marketing/CTABand"
import { COURSE_CATEGORIES, TOTAL_COURSE_COUNT } from "@/data/courses"

export default function OurCoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our courses"
        title="Training across every area of care"
        description={`${TOTAL_COURSE_COUNT}+ courses across ${COURSE_CATEGORIES.length} categories, from statutory and mandatory training to clinical and specialist subjects.`}
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {COURSE_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={`/our-courses/${category.slug}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-brand-navy transition-colors hover:border-brand-gold hover:bg-brand-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <CategoryGrid />
        </div>
      </section>

      <CTABand />
    </>
  )
}
