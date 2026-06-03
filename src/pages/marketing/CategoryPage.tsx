import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { AlertCircle, BookOpen, ShieldCheck } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { SectionHeading } from "@/components/marketing/SectionHeading"
import { BannerBand } from "@/components/marketing/BannerBand"
import { CTABand } from "@/components/marketing/CTABand"
import { CourseCard } from "@/components/courses/CourseCard"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategory } from "@/data/courses"
import { usePublishedCourses } from "@/lib/queries/public-courses.queries"

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=70",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=70",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=70",
]

/** Pick a stable hero image from the category id so it stays consistent. */
function heroForCategory(id: string): string {
  const n = Number.parseInt(id, 10) || 0
  return HERO_IMAGES[n % HERO_IMAGES.length]
}

export default function CategoryPage(): React.ReactElement {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const category = categorySlug ? getCategory(categorySlug) : undefined
  const courses = usePublishedCourses()
  const reduce = useReducedMotion()

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
        imageUrl={heroForCategory(category.id)}
        imageAlt={`${category.name} training`}
        stats={[{ value: `${category.count}`, label: "Courses" }]}
      >
        <p className="text-sm text-white/70">
          {category.count} courses in this category. CSTF-aligned,
          CPD-accredited.
        </p>
      </PageHero>

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
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
              <BookOpen
                className="mx-auto size-8 text-brand-navy/40"
                aria-hidden
              />
              <h2 className="mt-3 font-display text-2xl text-brand-navy">
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryCourses.map((course, i) => (
                <motion.div
                  key={course.id}
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
          )}

          <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-brand-gold" aria-hidden />
            CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
          </p>
        </div>
      </section>

      <BannerBand
        eyebrow="Browse more"
        heading="Explore the full catalogue"
        description={`${category.name} is one of fifteen categories spanning the full breadth of health and social care training.`}
        buttonLabel="All courses"
        to="/our-courses"
        tone="gold"
      />

      <CTABand />
    </>
  )
}
