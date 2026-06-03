import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { AlertCircle, BookOpen, ShieldCheck } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { BannerBand } from "@/components/marketing/BannerBand"
import { Pagination } from "@/components/marketing/Pagination"
import { CourseCard } from "@/components/courses/CourseCard"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategory } from "@/data/courses"
import { usePublishedCourses } from "@/lib/queries/public-courses.queries"

const PAGE_SIZE = 12

export default function CategoryPage(): React.ReactElement {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const category = categorySlug ? getCategory(categorySlug) : undefined
  const courses = usePublishedCourses()
  const reduce = useReducedMotion()

  const categoryCourses = useMemo(() => {
    if (!categorySlug) return []
    return (courses.data ?? []).filter((c) => c.categorySlug === categorySlug)
  }, [courses.data, categorySlug])

  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(categoryCourses.length / PAGE_SIZE))

  // Reset to the first page when the category or live data changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging on category/data change
    setPage(1)
  }, [categorySlug, categoryCourses.length])

  const pagedCourses = useMemo(
    () => categoryCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [categoryCourses, page],
  )

  if (!category) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-sans font-semibold tracking-tight text-3xl text-brand-navy">
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

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <>
      <PageHero
        eyebrow="Course category"
        title={category.name}
        description={category.blurb}
        stats={[{ value: `${category.count}`, label: "Courses" }]}
      >
        <p className="text-sm text-white/70">
          {category.count} courses in this category. CSTF-aligned,
          CPD-accredited.
        </p>
      </PageHero>

      <section className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <SectionHeading
          eyebrow="About this category"
          title={`Training in ${category.name}`}
        />
        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>{category.blurb}</p>
          <p>
            Where the subject calls for it, these courses are CSTF-aligned and
            mapped to current good practice, so the training stands up to
            inspection and supports safe care.
          </p>
          <p>
            Every completion carries logged CPD hours and produces a
            certificate that managers and regulators can confirm at
            vitalcare.uk/verify.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Available now"
          title={`Published ${category.name.toLowerCase()} courses`}
          subtitle="Courses in this category you can explore today. New subjects are added as the catalogue rolls out."
        />

        <div className="mt-12">
          {courses.isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          ) : courses.isError ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
              <AlertCircle
                className="mx-auto size-8 text-destructive"
                aria-hidden
              />
              <h2 className="mt-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
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
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
              <BookOpen
                className="mx-auto size-8 text-brand-navy/40"
                aria-hidden
              />
              <h2 className="mt-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                Courses coming soon
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                {category.blurb} The full list for this category is being loaded
                into the platform. Get in touch for the current schedule and
                dates.
              </p>
              <Link
                to="/contact-us"
                className="mt-6 inline-flex rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                Contact us
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pagedCourses.map((course, i) => (
                  <motion.div
                    key={course.id}
                    className="h-full"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 0.45,
                      delay: reduce ? 0 : Math.min(i, 7) * 0.05,
                    }}
                  >
                    <CourseCard
                      className="h-full"
                      title={course.title}
                      href={`/our-courses/course/${course.slug}`}
                      categoryName={category.name}
                      cpdHours={course.cpdHours}
                      durationMins={course.durationMins}
                      cstf={course.cstf}
                      thumbnailUrl={course.thumbnailUrl}
                      ctaLabel="View course"
                    />
                  </motion.div>
                ))}
              </div>

              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                label="Category courses pagination"
                className="mt-12"
              />
            </>
          )}

          <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-brand-gold" aria-hidden />
            CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
          </p>
        </div>
      </section>

      <BannerBand
        tone="navy"
        eyebrow="Get started"
        heading="Talk to us about this training"
        description="We will help you choose the right courses for your team and the standards you answer to."
        buttonLabel="Contact us"
        to="/contact-us"
      />
    </>
  )
}
