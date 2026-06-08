import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Award,
  FileText,
  AlertCircle,
  PlayCircle,
  Layers,
  BookOpen,
  Tag,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatCourseDuration } from "@/lib/utils"
import {
  useCourse,
  useCurriculum,
  useMyCourses,
  useEnrolSelf,
  useCategoryNameMap,
  useCompletedLessons,
} from "@/lib/queries/courses.queries"
import CourseDiscussion from "@/components/platform/CourseDiscussion"
import RequestOneToOne from "@/components/platform/RequestOneToOne"
import CourseReviews from "@/components/courses/CourseReviews"
import CourseFaqs from "@/components/courses/CourseFaqs"
import { driveImageUrl } from "@/lib/drive-image"
import { usePrerequisites } from "@/lib/queries/course-extras.queries"
import { useCourseAssessment } from "@/lib/queries/assessments.queries"
import { useMyResources } from "@/lib/queries/library.queries"
import { sanitizeHtml } from "@/lib/sanitize"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { CheckCircle2, Circle, Lock, Download } from "lucide-react"

export default function CourseOverviewPage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const course = useCourse(id)
  const curriculum = useCurriculum(id)
  const myCourses = useMyCourses()
  const enrol = useEnrolSelf()
  const prereqs = usePrerequisites(id, user?.id)
  const assessment = useCourseAssessment(id)
  const categoryNames = useCategoryNameMap()
  const { isLearner, isGuest } = useUser()
  // Trainers and staff see trainer + both; learners see learner + both. RLS is
  // the real gate (migration 065); this just asks for the right slice.
  const materialAudience = isLearner || isGuest ? "learner" : "trainer"
  const resources = useMyResources(materialAudience)
  const courseMaterials = (resources.data ?? []).filter((r) => r.courseId === id)

  const mine = myCourses.data?.find((m) => m.course.id === id)
  const allLessons = curriculum.data?.flatMap((m) => m.lessons) ?? []
  const allLessonIds = allLessons.map((l) => l.id)
  const completed = useCompletedLessons(id, allLessonIds)
  const firstLesson = allLessons[0]
  // Resume point: first lesson the learner has not completed, else the first.
  const resumeLesson =
    allLessons.find((l) => !completed.data?.has(l.id)) ?? firstLesson
  const progressPct = mine?.progressPct ?? 0
  const courseComplete = progressPct >= 100 && allLessons.length > 0
  const notStarted = progressPct === 0
  const moduleCount = curriculum.data?.length ?? 0
  const lessonCount =
    curriculum.data?.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0
  const unmetPrereqs = (prereqs.data ?? []).filter((p) => !p.completed)
  const prereqsBlocked = unmetPrereqs.length > 0

  if (course.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (course.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this course.</p>
        <Button variant="outline" size="sm" onClick={() => course.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const c = course.data!
  const categoryName = c.category_id
    ? categoryNames.get(c.category_id) ?? null
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/courses">
          <ArrowLeft className="mr-1.5 size-4" /> Back to courses
        </Link>
      </Button>

      {/* About course: two-column hero */}
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Left: thumbnail + facts */}
        <Card className="h-fit overflow-hidden lg:sticky lg:top-6">
          {c.thumbnail_url && (
            <img
              src={driveImageUrl(c.thumbnail_url, 800)}
              alt=""
              className="aspect-video w-full object-cover"
            />
          )}
          <CardContent className="space-y-4 p-5">
            <h1 className="font-display text-2xl leading-tight text-brand-navy">
              {c.title}
            </h1>

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
                    {formatCourseDuration(c.duration_mins)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Award className="size-4 text-brand-navy/60" /> CPD hours
                  </dt>
                  <dd className="font-medium text-foreground">{c.cpd_hours}</dd>
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
                    {c.is_cstf_aligned ? "CSTF-aligned, CPD" : "CPD-accredited"}
                  </dd>
                </div>
              </dl>
            </div>

            {(moduleCount > 0 || lessonCount > 0) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                    <Layers className="size-4 text-brand-gold" /> {moduleCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                  <p className="flex items-center justify-center gap-1.5 text-lg font-semibold text-brand-navy">
                    <BookOpen className="size-4 text-brand-gold" /> {lessonCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Lessons</p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {mine?.enrolled ? (
                firstLesson ? (
                  <>
                    {/* Progress + resume. Label adapts to where the learner is. */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {courseComplete ? "Completed" : `${progressPct}% complete`}
                        </span>
                        {courseComplete && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="size-3.5" /> Certificate issued
                          </span>
                        )}
                      </div>
                      <Progress value={progressPct} className="h-2" />
                    </div>
                    <Button asChild className="w-full">
                      <Link
                        to={`/platform/courses/${id}/learn/${resumeLesson.id}`}
                      >
                        <PlayCircle className="mr-2 size-4" />
                        {courseComplete
                          ? "Review course"
                          : notStarted
                            ? "Start learning"
                            : "Continue learning"}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
                    You are enrolled. Lessons for this course are being prepared,
                    so check back soon. Any assessment and materials below are
                    available now.
                  </div>
                )
              ) : (
                <Button
                  className="w-full"
                  disabled={enrol.isPending || prereqsBlocked}
                  onClick={() =>
                    enrol
                      .mutateAsync(id)
                      .then(() => toast.success("Enrolled"))
                      .catch(() => toast.error("Could not enrol"))
                  }
                >
                  {prereqsBlocked && <Lock className="mr-2 size-4" />}
                  {prereqsBlocked
                    ? "Complete prerequisites first"
                    : "Enrol on this course"}
                </Button>
              )}
              {mine?.enrolled && assessment.data && (
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <FileText className="size-4 text-brand-navy" /> Course assessment
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {assessment.data.passed
                      ? "Passed — required for your certificate."
                      : `Pass mark ${assessment.data.passMark}%. Required to earn your certificate.`}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant={assessment.data.passed ? "outline" : "default"}
                    className="mt-2 w-full"
                  >
                    <Link to={`/platform/assessments/${assessment.data.id}`}>
                      {assessment.data.passed ? "Review assessment" : "Take assessment"}
                    </Link>
                  </Button>
                </div>
              )}
              {mine?.enrolled && courseMaterials.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <FileText className="size-4 text-brand-navy" /> Course materials
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {courseMaterials.map((r) => (
                      <li key={r.id}>
                        <a
                          href={r.fileUrl || r.linkUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Download className="size-4 shrink-0" />
                          <span className="truncate">{r.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <RequestOneToOne courseId={id} courseTitle={c.title} />
            </div>
          </CardContent>
        </Card>

        {/* Right: overview + accreditation + what you will cover */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {c.is_cstf_aligned && (
              <Badge
                variant="outline"
                className="gap-1 border-success/30 bg-success/10 text-success"
              >
                <ShieldCheck className="size-3.5" /> CSTF aligned
              </Badge>
            )}
            {categoryName && (
              <Badge variant="outline" className="gap-1">
                <Tag className="size-3.5" /> {categoryName}
              </Badge>
            )}
          </div>

          {c.summary && (
            <p className="max-w-[65ch] text-lg leading-relaxed text-foreground">
              {c.summary}
            </p>
          )}
          {c.description && (
            <div
              className="prose prose-sm max-w-[65ch]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.description) }}
            />
          )}

          {moduleCount > 0 && (
            <div>
              <h2 className="font-display text-xl text-brand-navy">
                What you will cover
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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

          <p className="text-sm text-muted-foreground">
            CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify.
          </p>

          {(prereqs.data?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-medium">Prerequisites</p>
              <ul className="space-y-1.5">
                {prereqs.data!.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    {p.completed ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <Link
                      to={`/platform/courses/${p.prerequisiteId}`}
                      className={cn(
                        "hover:underline",
                        p.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Curriculum</CardTitle>
        </CardHeader>
        <CardContent>
          {curriculum.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (curriculum.data?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No curriculum published yet.
            </p>
          ) : (
            <div className="space-y-4">
              {curriculum.data!.map((mod, i) => (
                <div key={mod.id}>
                  <p className="mb-1.5 text-sm font-semibold text-foreground">
                    {i + 1}. {mod.title}
                  </p>
                  <ul className="space-y-1 pl-4">
                    {mod.lessons.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <FileText className="size-3.5" />
                        {mine?.enrolled ? (
                          <Link
                            to={`/platform/courses/${id}/learn/${l.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {l.title}
                          </Link>
                        ) : (
                          <span>{l.title}</span>
                        )}
                      </li>
                    ))}
                    {mod.lessons.length === 0 && (
                      <li className="text-sm text-muted-foreground">No lessons</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CourseFaqs courseId={id} />
      <CourseReviews courseId={id} />
      <CourseDiscussion courseId={id} />
    </div>
  )
}
