import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, BookOpen, Sparkles } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { CTABand } from "@/components/marketing/CTABand"
import { CourseCard } from "@/components/courses/CourseCard"
import { Skeleton } from "@/components/ui/skeleton"
import { COURSE_CATEGORIES, TOTAL_COURSE_COUNT } from "@/data/courses"
import { usePublishedCourses } from "@/lib/queries/public-courses.queries"

const ALL = "all" as const

export default function OurCoursesPage(): React.ReactElement {
  const courses = usePublishedCourses()
  const [activeSlug, setActiveSlug] = useState<string>(ALL)

  // Only show filter pills for categories that have live published courses.
  const liveCategorySlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const course of courses.data ?? []) {
      if (course.categorySlug) slugs.add(course.categorySlug)
    }
    return slugs
  }, [courses.data])

  const filterCategories = useMemo(
    () => COURSE_CATEGORIES.filter((c) => liveCategorySlugs.has(c.slug)),
    [liveCategorySlugs],
  )

  const visibleCourses = useMemo(() => {
    const list = courses.data ?? []
    if (activeSlug === ALL) return list
    return list.filter((c) => c.categorySlug === activeSlug)
  }, [courses.data, activeSlug])

  return (
    <>
      <PageHero
        eyebrow="Our courses"
        title="Training across every area of care"
        description={`${TOTAL_COURSE_COUNT}+ courses across ${COURSE_CATEGORIES.length} categories, from statutory and mandatory training to clinical and specialist subjects.`}
      >
        <p className="text-sm text-white/70">
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
        </p>
      </PageHero>

      {/* Browse by category */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-brand-navy">
            Browse by category
          </h2>
          <p className="mt-3 text-muted-foreground">
            Fifteen categories spanning the full breadth of health and social
            care training. Choose a category to see the courses within it.
          </p>
        </div>
        <div className="mt-8">
          <CategoryGrid />
        </div>
      </section>

      {/* Live published courses */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-brand-gold">
                <Sparkles className="size-4" aria-hidden /> Available now
              </p>
              <h2 className="mt-2 font-display text-3xl text-brand-navy">
                Courses ready to book
              </h2>
              <p className="mt-3 text-muted-foreground">
                Published courses you can explore today. New subjects are added
                as the catalogue rolls out.
              </p>
            </div>
          </div>

          {/* Category filter pills (only when live data is present) */}
          {!courses.isLoading &&
          !courses.isError &&
          (courses.data?.length ?? 0) > 0 ? (
            <div
              className="mt-8 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter courses by category"
            >
              <FilterPill
                label="All courses"
                active={activeSlug === ALL}
                onClick={() => setActiveSlug(ALL)}
              />
              {filterCategories.map((category) => (
                <FilterPill
                  key={category.id}
                  label={category.name}
                  active={activeSlug === category.slug}
                  onClick={() => setActiveSlug(category.slug)}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            {courses.isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-xl" />
                ))}
              </div>
            ) : courses.isError ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <AlertCircle
                  className="mx-auto size-8 text-destructive"
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-2xl text-brand-navy">
                  Could not load courses
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Please try again, or browse the categories above.
                </p>
                <button
                  type="button"
                  onClick={() => courses.refetch()}
                  className="mt-6 inline-flex rounded-md border border-border px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : visibleCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <BookOpen
                  className="mx-auto size-8 text-brand-navy/40"
                  aria-hidden
                />
                <h3 className="mt-3 font-display text-2xl text-brand-navy">
                  More courses on the way
                </h3>
                <p className="mt-2 text-muted-foreground">
                  We are loading the full catalogue into the platform. Browse a
                  category above, or get in touch for the current schedule.
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
                {visibleCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    title={course.title}
                    href={`/our-courses/course/${course.slug}`}
                    categoryName={course.categoryName}
                    cpdHours={course.cpdHours}
                    durationMins={course.durationMins}
                    cstf={course.cstf}
                    thumbnailUrl={course.thumbnailUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-brand-navy px-4 py-1.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          : "rounded-full border border-border bg-white px-4 py-1.5 text-sm text-brand-navy transition-colors hover:border-brand-gold hover:bg-brand-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
      }
    >
      {label}
    </button>
  )
}
