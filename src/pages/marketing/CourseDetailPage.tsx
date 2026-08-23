import { Link, useParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import {
  Clock,
  Award,
  ShieldCheck,
  Tag,
  Layers,
  BookOpen,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Users,
  ListChecks,
  Check,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { BannerBand } from "@/components/marketing/BannerBand"
import { formatCourseDuration } from "@/lib/utils"
import { driveImageUrl } from "@/lib/drive-image"
import {
  usePublishedCourse,
  usePublicCurriculum,
} from "@/lib/queries/public-courses.queries"
import { useCategories } from "@/lib/queries/courses.queries"
import { useAuth } from "@/hooks/use-auth"
import { COURSES, getCategory } from "@/data/courses"
import { sanitizeHtml } from "@/lib/sanitize"
import { PageMeta, SITE_URL } from "@/components/seo/PageMeta"
import { plainText } from "@/lib/text/plain"

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
  const { session } = useAuth()
  const course = usePublishedCourse(slug)
  const categories = useCategories()
  const curriculum = usePublicCurriculum(course.data?.id)
  const reduce = useReducedMotion()

  const fallback = COURSES.find((c) => c.slug === slug)
  const fallbackCategory = fallback ? getCategory(fallback.categorySlug) : undefined

  if (course.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
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
        <h1 className="mt-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
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
        <PageMeta
          title="Course not found"
          description="That course does not exist or is not yet published."
          noIndex
        />
        <h1 className="font-sans font-semibold tracking-tight text-3xl text-brand-navy">Course not found</h1>
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

  const fade = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0 },
  }

  // Metadata is built from this course, not from a site-wide default, so every
  // course page presents its own title, description and canonical URL. Without
  // it a crawler sees the same page a few hundred times over.
  const metaDescription =
    plainText(summary ?? description ?? "").slice(0, 300) ||
    `${title}: ${cstf ? "CSTF-aligned, " : ""}CPD-accredited training from Vitalcare Training Hub.`

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description: metaDescription,
    url: `${SITE_URL}/our-courses/course/${slug}`,
    provider: {
      "@type": "Organization",
      name: "Vitalcare Training Hub",
      url: SITE_URL,
    },
    ...(categoryName ? { about: categoryName } : {}),
    ...(thumbnail ? { image: thumbnail } : {}),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${Math.max(1, Math.round(durationMins / 60))}H`,
    },
  }

  return (
    <>
      <PageMeta
        title={title}
        description={metaDescription}
        canonicalPath={`/our-courses/course/${slug}`}
        image={thumbnail ?? undefined}
        jsonLd={courseSchema}
      />
      {/* Navy hero, matched to the shared PageHero banner */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1b2e6b] via-[#16265a] to-[#0f1b41]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-28 -top-32 size-[26rem] rounded-full bg-brand-gold/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Crumbs title={title} />
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold"
          >
            <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
            {categoryName ?? "Course"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="mt-4 max-w-3xl font-sans font-semibold tracking-tight text-4xl leading-tight text-white lg:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
              <Clock className="size-4 text-brand-gold" aria-hidden />
              {formatCourseDuration(durationMins)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
              <Award className="size-4 text-brand-gold" aria-hidden />
              {cpdHours} CPD hours
            </span>
            {cstf ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3.5 py-1.5 text-sm font-medium text-emerald-200 ring-1 ring-success/30">
                <ShieldCheck className="size-4" aria-hidden /> CSTF aligned
              </span>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
          {/* Left: facts card */}
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {thumbnail ? (
                <img
                  src={driveImageUrl(thumbnail, 800)}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-brand-navy/5 to-brand-gold/5 text-brand-navy/40">
                  <BookOpen className="size-8" aria-hidden />
                </div>
              )}
              <div className="space-y-5 p-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    About this course
                  </p>
                  <dl className="space-y-3 text-sm">
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
                    <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                        <Layers className="size-4 text-brand-gold" /> {moduleCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Modules</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                        <BookOpen className="size-4 text-brand-gold" />{" "}
                        {lessonCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                  </div>
                )}

                <Link
                  to={
                    session
                      ? c?.id
                        ? `/platform/courses/${c.id}`
                        : "/platform/courses"
                      : "/contact-us"
                  }
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                >
                  {session ? "Enrol on this course" : "Enquire about this course"}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <p className="text-center text-xs text-muted-foreground">
                  {session
                    ? "Go to the course to enrol and start learning."
                    : "Group rates and dates on request."}
                </p>
              </div>
            </div>
          </aside>

          {/* Right: overview + what you will cover */}
          <motion.div
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="space-y-10"
          >
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
                <span className="h-px w-8 bg-brand-gold/70" aria-hidden="true" />
                Overview
              </p>
              <div className="max-w-[65ch] space-y-4">
                {summary ? (
                  <p className="font-sans font-semibold tracking-tight text-2xl leading-snug text-brand-navy">
                    {summary}
                  </p>
                ) : null}
                {description ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
                  />
                ) : null}
                {!summary && !description ? (
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Get in touch for the full course outline, dates and group
                    rates. Our team will talk you through how this training fits
                    your service.
                  </p>
                ) : null}
              </div>
            </div>

            {moduleCount > 0 && (
              <div>
                <h2 className="font-sans font-semibold tracking-tight text-3xl text-brand-navy">
                  What you will cover
                </h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {curriculum.data!.map((mod) => (
                    <li
                      key={mod.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-sm text-foreground shadow-sm"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-brand-gold">
                        <ShieldCheck className="size-4" aria-hidden />
                      </span>
                      <span className="pt-0.5">{mod.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course information: who it is for, what is included, assessment */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:col-span-2">
                <h2 className="flex items-center gap-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                    <Users className="size-5" aria-hidden />
                  </span>
                  Who it's for
                </h2>
                <p className="mt-4 max-w-[65ch] leading-relaxed text-muted-foreground">
                  This course suits care and healthcare staff who need this
                  subject for their role, whether you are completing statutory
                  and mandatory training, refreshing an expiring certificate, or
                  building your CPD portfolio. Teams can be enrolled together,
                  with progress tracked centrally.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                    <ListChecks className="size-5" aria-hidden />
                  </span>
                  What's included
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand-gold"
                      aria-hidden
                    />
                    <span>
                      Self-paced online learning you can complete on any device
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand-gold"
                      aria-hidden
                    />
                    <span>
                      Content overseen by our Clinical Director, a registered
                      nurse
                    </span>
                  </li>
                  {cpdHours ? (
                    <li className="flex items-start gap-3">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-brand-gold"
                        aria-hidden
                      />
                      <span>Logged CPD hours recorded against your record</span>
                    </li>
                  ) : null}
                  <li className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-brand-gold"
                      aria-hidden
                    />
                    <span>
                      A certificate on successful completion, verifiable online
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-3 font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                    <BadgeCheck className="size-5" aria-hidden />
                  </span>
                  Assessment and certificate
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Where a course includes an assessment, you need to demonstrate
                  competence to pass. If you do not meet the standard the first
                  time, we tell you why and you can resit. On passing, your
                  certificate is issued and recorded against your name,
                  verifiable at vitalcare.uk/verify.
                </p>
              </div>
            </div>

            {/* Accreditation panel */}
            <div className="relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-gold">
                  <BadgeCheck className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="font-sans font-semibold tracking-tight text-2xl text-brand-navy">
                    Accreditation and oversight
                  </h2>
                  <p className="mt-3 max-w-[60ch] leading-relaxed text-muted-foreground">
                    Overseen by Harni Muharami RN MSc, Clinical Director.
                    CSTF-aligned, CPD-accredited, verifiable at
                    vitalcare.uk/verify.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BannerBand
        tone="navy"
        eyebrow="Get started"
        heading="Enrol your team on this course"
        description="Book this course for your team, online or in person, with records you can evidence."
        buttonLabel="Get a quote"
        to="/contact-us"
      />
    </>
  )
}
