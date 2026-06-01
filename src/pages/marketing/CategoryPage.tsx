import { Link, useParams } from "react-router-dom"
import { Clock } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { CTABand } from "@/components/marketing/CTABand"
import { getCategory, getCoursesByCategory } from "@/data/courses"

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const hours = Math.round((mins / 60) * 10) / 10
  return `${hours} hr`
}

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

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
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
          <ul className="divide-y divide-border rounded-xl border border-border">
            {courses.map((course) => (
              <li
                key={course.slug}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-brand-navy">{course.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-4" />
                      {formatDuration(course.durationMins)}
                    </span>
                    <span>{course.cpdHours} CPD hours</span>
                  </div>
                </div>
                {course.cstf ? (
                  <span className="inline-flex w-fit items-center rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    CSTF aligned
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
        </p>
      </section>

      <CTABand />
    </>
  )
}
