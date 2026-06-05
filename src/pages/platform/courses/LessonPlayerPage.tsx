import { useParams, Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import {
  useCurriculum,
  useCompletedLessons,
  useMarkLessonComplete,
  useMyCourses,
} from "@/lib/queries/courses.queries"

export default function LessonPlayerPage() {
  const { id = "", lessonId = "" } = useParams()
  const navigate = useNavigate()
  const curriculum = useCurriculum(id)
  const myCourses = useMyCourses()
  const { isLearner, isGuest } = useUser()

  // Learners must be enrolled to open a lesson (staff can preview). Without this
  // a learner could reach a lesson by URL, complete it, and trigger a
  // certificate without ever enrolling.
  const enrolled = myCourses.data?.some((m) => m.course.id === id && m.enrolled)
  const mustEnrol = (isLearner || isGuest) && myCourses.isSuccess && !enrolled

  const allLessons = curriculum.data?.flatMap((m) => m.lessons) ?? []
  const lessonIds = allLessons.map((l) => l.id)
  const completed = useCompletedLessons(id, lessonIds)
  const markComplete = useMarkLessonComplete(id, lessonIds)

  const index = allLessons.findIndex((l) => l.id === lessonId)
  const lesson = index >= 0 ? allLessons[index] : null
  const prev = index > 0 ? allLessons[index - 1] : null
  const next = index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : null
  const isDone = completed.data?.has(lessonId) ?? false

  if (curriculum.isLoading || myCourses.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  if (mustEnrol) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-brand-gold" />
        <p className="text-sm text-muted-foreground">
          Enrol on this course to start the lessons.
        </p>
        <Button asChild size="sm">
          <Link to={`/platform/courses/${id}`}>Go to course</Link>
        </Button>
      </div>
    )
  }
  if (curriculum.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this course.</p>
        <Button variant="outline" size="sm" onClick={() => curriculum.refetch()}>
          Retry
        </Button>
      </div>
    )
  }
  if (!lesson) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to={`/platform/courses/${id}`}>Back to course</Link>
        </Button>
      </div>
    )
  }

  function handleComplete() {
    markComplete
      .mutateAsync(lessonId)
      .then((res) => {
        if (res?.done) {
          toast.success("Course complete", {
            description: "Your certificate has been issued.",
          })
        } else if (res?.assessmentPending) {
          toast.success("All lessons done", {
            description: "Pass the course assessment to earn your certificate.",
          })
        } else {
          toast.success("Lesson complete")
        }
        if (next) navigate(`/platform/courses/${id}/learn/${next.id}`)
      })
      .catch(() => toast.error("Could not save progress"))
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to={`/platform/courses/${id}`}>
          <ArrowLeft className="mr-1.5 size-4" /> Back to course
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Lesson list */}
        <Card className="h-fit">
          <CardContent className="p-3">
            <nav className="space-y-4">
              {curriculum.data!.map((mod) => (
                <div key={mod.id}>
                  <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {mod.title}
                  </p>
                  <ul className="mt-1">
                    {mod.lessons.map((l) => {
                      const done = completed.data?.has(l.id)
                      const active = l.id === lessonId
                      return (
                        <li key={l.id}>
                          <Link
                            to={`/platform/courses/${id}/learn/${l.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                              active
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="size-4 shrink-0 text-success" />
                            ) : (
                              <Circle className="size-4 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Lesson content */}
        <Card>
          <CardContent className="p-6">
            <h1 className="font-display text-2xl text-foreground">{lesson.title}</h1>
            <div className="mt-4">
              {lesson.type === "text" && lesson.content ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              ) : lesson.type === "video" && lesson.video_url ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <iframe
                    src={lesson.video_url}
                    title={lesson.title}
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (lesson.document_url || lesson.scorm_url) ? (
                <Button asChild variant="outline">
                  <a
                    href={lesson.document_url || lesson.scorm_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {lesson.type} content
                    <ExternalLink className="ml-2 size-4" />
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No content provided for this lesson.
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!prev}
                onClick={() => prev && navigate(`/platform/courses/${id}/learn/${prev.id}`)}
              >
                <ChevronLeft className="mr-1 size-4" /> Previous
              </Button>

              <Button
                size="sm"
                variant={isDone ? "outline" : "default"}
                disabled={markComplete.isPending}
                onClick={handleComplete}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4 text-success" /> Completed
                  </>
                ) : markComplete.isPending ? (
                  "Saving…"
                ) : (
                  "Mark complete"
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!next}
                onClick={() => next && navigate(`/platform/courses/${id}/learn/${next.id}`)}
              >
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
