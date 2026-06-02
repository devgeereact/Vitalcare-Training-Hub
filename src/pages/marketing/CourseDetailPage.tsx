import { Link, useParams } from "react-router-dom"
import {
  Clock,
  Award,
  ShieldCheck,
  Tag,
  Layers,
  BookOpen,
  AlertCircle,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CTABand } from "@/components/marketing/CTABand"
import { formatCourseDuration } from "@/lib/utils"
import { driveImageUrl } from "@/lib/drive-image"
import {
  usePublishedCourse,
  usePublicCurriculum,
} from "@/lib/queries/public-courses.queries"
import { useCategories } from "@/lib/queries/courses.queries"
import { COURSES, getCategory } from "@/data/courses"

function Crumbs({ title }: { title: string }): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-white/70">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            to="/our-courses"
            className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            Courses
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className="text-white">{title}</li>
      </ol>
    </nav>
  )
}

/**
 * Public "About course" page. Reads the slug from the route, fetches the
 * published course from the database, and falls back to the static catalogue
 * for facts when no published record exists.
 */
export default function CourseDetailPage(): React.ReactElement {
  const { slug = "" } = useParams<{ slug: string }>()
  const course = usePublishedCourse(slug)
  const categories = useCategories()
  const curriculum = usePublicCurriculum(course.data?.id)

  const fallback = COURSES.find((c) => c.slug === slug)
  const fallbackCategory = fallback ? getCategory(fallback.categorySlug) : undefined

  if (course.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </section>
    )
  }

  if (course.isError) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 font-display text-2xl text-brand-navy">
          Could not load this course
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please try again, or browse the full catalogue.
        </p>
        <button
          type="button"
          onClick={() => course.refetch()}
          className="mt-6 inline-flex rounded-md border border-border px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </section>
    )
  }

  const c = course.data

  // No published DB course and no static fallback: not found.
  if (!c && !fallback) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-brand-navy">Course not found</h1>
        <p className="mt-3 text-muted-foreground">
          That course does not exist or is not yet published. Browse the full
          catalogue instead.
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

  const title = c?.title ?? fallback!.title
  const cpdHours = c?.cpd_hours ?? fallback!.cpdHours
  const durationMins = c?.duration_mins ?? fallback!.durationMins
  const cstf = c?.is_cstf_aligned ?? fallback!.cstf
  const summary = c?.summary ?? null
  const description = c?.description ?? null
  const thumbnail = c?.thumbnail_url ?? null

  const categoryName = c?.category_id
    ? (categories.data ?? []).find((cat) => cat.id === c.category_id)?.name ??
      null
    : fallbackCategory?.name ?? null

  const moduleCount = curriculum.data?.length ?? 0
  const lessonCount =
    curriculum.data?.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0

  return (
    <>
      <section className="bg-brand-navy">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Crumbs title={title} />
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-gold">
            {categoryName ?? "Course"}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl text-white lg:text-5xl">
            {title}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
          {/* Left: facts card */}
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              {thumbnail ? (
                <img
                  src={driveImageUrl(thumbnail, 800)}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-brand-navy/5 text-brand-navy/40">
                  <BookOpen className="size-8" aria-hidden />
                </div>
              )}
              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    About course
                  </p>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 text-brand-navy/60" /> Duration
                      </dt>
                      <dd className="font-medium text-foreground">
                        {formatCourseDuration(durationMins)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <Award className="size-4 text-brand-navy/60" /> CPD hours
                      </dt>
                      <dd className="font-medium text-foreground">{cpdHours}</dd>
                    </div>
                    {categoryName && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="size-4 text-brand-navy/60" /> Category
                        </dt>
                        <dd className="text-right font-medium text-foreground">
                          {categoryName}
                        </dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="size-4 text-brand-navy/60" />{" "}
                        Accreditation
                      </dt>
                      <dd className="text-right font-medium text-foreground">
                        {cstf ? "CSTF-aligned, CPD" : "CPD-accredited"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {(moduleCount > 0 || lessonCount > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                        <Layers className="size-4 text-brand-gold" /> {moduleCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Modules</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                        <BookOpen className="size-4 text-brand-gold" />{" "}
                        {lessonCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                  </div>
                )}

                <Link
                  to="/contact-us"
                  className="inline-flex w-full items-center justify-center rounded-md bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                >
                  Enquire about this course
                </Link>
              </div>
            </div>
          </aside>

          {/* Right: overview + what you will cover */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {cstf && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <ShieldCheck className="size-3.5" /> CSTF aligned
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-brand-navy">
                  <Tag className="size-3.5" /> {categoryName}
                </span>
              )}
            </div>

            <div className="max-w-[65ch] space-y-4">
              {summary ? (
                <p className="text-lg leading-relaxed text-foreground">
                  {summary}
                </p>
              ) : null}
              {description ? (
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : null}
              {!summary && !description ? (
                <p className="text-muted-foreground">
                  Get in touch for the full course outline, dates and group
                  rates. Our team will talk you through how this training fits
                  your service.
                </p>
              ) : null}
            </div>

            {moduleCount > 0 && (
              <div>
                <h2 className="font-display text-2xl text-brand-navy">
                  What you will cover
                </h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {curriculum.data!.map((mod) => (
                    <li
                      key={mod.id}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                      {mod.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl text-brand-navy">
                Accreditation
              </h2>
              <p className="mt-3 max-w-[65ch] leading-relaxed text-muted-foreground">
                Overseen by Harni Muharami RN MSc, Clinical Director. CSTF-aligned,
                CPD-accredited, verifiable at vitalcare.uk/verify.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  )
}
