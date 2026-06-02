import { Link, useParams } from "react-router-dom"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { CourseCard } from "@/components/courses/CourseCard"
import { getCategory, getCoursesByCategory } from "@/data/courses"

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const category = categorySlug ? getCategory(categorySlug) : undefined
  const courses = categorySlug ? getCoursesByCategory(categorySlug) : []

  if (!category) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-brand-navy">
          Category not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          That category does not exist. Browse the full catalogue instead.
        </p>
        <Link
          to="/our-courses"
          className="mt-6 inline-flex rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          All courses
        </Link>
      </section>
    )
  }

  return (
    <>
      <PageHero eyebrow="Course category" title={category.name} description={category.blurb}>
        <p className="text-sm text-white/70">
          {category.count} courses in this category
        </p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <h2 className="font-display text-2xl text-brand-navy">
              Courses coming soon
            </h2>
            <p className="mt-2 text-muted-foreground">
              The full course list for this category is being loaded. Contact us
              for the current schedule.
            </p>
            <Link
              to="/contact-us"
              className="mt-6 inline-flex rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              Contact us
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard
                key={course.slug}
                title={course.title}
                href={`/our-courses/course/${course.slug}`}
                categoryName={category.name}
                cpdHours={course.cpdHours}
                durationMins={course.durationMins}
                cstf={course.cstf}
                ctaLabel="Read more"
              />
            ))}
          </div>
        )}
        <p className="mt-8 text-sm text-muted-foreground">
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
        </p>
      </section>

      <CTABand />
    </>
  )
}
