import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertCircle,
  BookOpen,
  ShieldCheck,
  Award,
  BadgeCheck,
} from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { BannerBand } from "@/components/marketing/BannerBand"
import { CategoryGrid } from "@/components/marketing/CategoryGrid"
import { CourseCard } from "@/components/courses/CourseCard"
import { Pagination } from "@/components/marketing/Pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { COURSE_CATEGORIES, TOTAL_COURSE_COUNT } from "@/data/courses"
import { usePublishedCourses } from "@/lib/queries/public-courses.queries"

const ALL = "all" as const

const PAGE_SIZE = 12

const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: "CSTF-aligned",
    body: "Mapped to the Core Skills Training Framework so your records hold up at inspection.",
  },
  {
    icon: Award,
    title: "CPD-accredited",
    body: "Logged CPD hours on every course, ready for portfolios and revalidation.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiable certificates",
    body: "Each certificate is checkable online at vitalcare.uk/verify, with full history.",
  },
]

export default function OurCoursesPage(): React.ReactElement {
  const courses = usePublishedCourses()
  const [activeSlug, setActiveSlug] = useState<string>(ALL)
  const reduce = useReducedMotion()

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

  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(visibleCourses.length / PAGE_SIZE))

  // Reset to the first page whenever the filter changes or the live data
  // reshapes (so we never land on a now-empty page).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging on filter/data change
    setPage(1)
  }, [activeSlug, visibleCourses.length])

  const pagedCourses = useMemo(
    () => visibleCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleCourses, page],
  )

  const fadeUp = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: { opacity: 1, y: 0 },
  }

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

      {/* Assurance strip */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          {ASSURANCES.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-brand-navy">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading
          eyebrow="Browse the catalogue"
          title="Fifteen categories, every area of care"
          subtitle="From statutory and mandatory training to clinical and specialist subjects. Choose a category to see the courses within it."
        />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mt-12"
        >
          <CategoryGrid />
        </motion.div>
      </section>

      {/* Live published courses */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Available now"
            title="Courses ready to book"
            subtitle="Published courses you can explore today. New subjects are added as the catalogue rolls out."
          />

          {/* Category filter pills (only when live data is present) */}
          {!courses.isLoading &&
          !courses.isError &&
          (courses.data?.length ?? 0) > 0 ? (
            <div
              className="mt-10 flex flex-wrap gap-2"
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

          <div className="mt-10">
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
                <h3 className="mt-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
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
              <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
                <BookOpen
                  className="mx-auto size-8 text-brand-navy/40"
                  aria-hidden
                />
                <h3 className="mt-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
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
                        categoryName={course.categoryName}
                        cpdHours={course.cpdHours}
                        durationMins={course.durationMins}
                        cstf={course.cstf}
                        thumbnailUrl={course.thumbnailUrl}
                      />
                    </motion.div>
                  ))}
                </div>

                <Pagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
                  label="Courses pagination"
                  className="mt-12"
                />
              </>
            )}
          </div>
        </div>
      </section>

      <BannerBand
        eyebrow="Training solutions"
        heading="Training built around your service"
        description="From NHS Trusts to single sites and individual professionals, we shape the catalogue to the roles your people hold."
        buttonLabel="Explore solutions"
        to="/training-solutions/nhs-trusts"
        tone="gold"
      />

      <BannerBand
        tone="navy"
        eyebrow="Get a quote"
        heading="Bring this training to your team"
        description="Tell us your roles and numbers and we will put together a package and a price."
        buttonLabel="Contact us"
        to="/contact-us"
      />
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
