import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { AlertCircle, BookOpen } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { CourseCard } from "@/components/courses/CourseCard"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategory } from "@/data/courses"
import { usePublishedCourses } from "@/lib/queries/public-courses.queries"

export default function CategoryPage(): React.ReactElement {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const category = categorySlug ? getCategory(categorySlug) : undefined
  const courses = usePublishedCourses()

  const categoryCourses = useMemo(() => {
    if (!categorySlug) return []
    return (courses.data ?? []).filter((c) => c.categorySlug === categorySlug)
  }, [courses.data, categorySlug])

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
      <PageHero
        eyebrow="Course category"
        title={category.name}
        description={category.blurb}
      >
        <p className="text-sm text-white/70">
          {category.count} courses in this category
        </p>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {courses.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : courses.isError ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <AlertCircle
              className="mx-auto size-8 text-destructive"
              aria-hidden
            />
            <h2 className="mt-3 font-display text-2xl text-brand-navy">
              Could not load courses
            </h2>
            <p className="mt-2 text-muted-foreground">
              Please try again, or get in touch for the current schedule.
            </p>
            <button
              type="button"
              onClick={() => courses.refetch()}
              className="mt-6 inline-flex rounded-md border border-border px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </div>
        ) : categoryCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <BookOpen
              className="mx-auto size-8 text-brand-navy/40"
              aria-hidden
            />
            <h2 className="mt-3 font-display text-2xl text-brand-navy">
              Courses coming soon
            </h2>
            <p className="mt-2 max-w-xl mx-auto text-muted-foreground">
              {category.blurb} The full list for this category is being loaded
              into the platform. Get in touch for the current schedule and dates.
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
            {categoryCourses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                href={`/our-courses/course/${course.slug}`}
                categoryName={category.name}
                cpdHours={course.cpdHours}
                durationMins={course.durationMins}
                cstf={course.cstf}
                thumbnailUrl={course.thumbnailUrl}
                ctaLabel="View course"
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
