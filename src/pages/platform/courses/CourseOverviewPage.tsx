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
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCourse,
  useCurriculum,
  useMyCourses,
  useEnrolSelf,
} from "@/lib/queries/courses.queries"

export default function CourseOverviewPage() {
  const { id = "" } = useParams()
  const course = useCourse(id)
  const curriculum = useCurriculum(id)
  const myCourses = useMyCourses()
  const enrol = useEnrolSelf()

  const mine = myCourses.data?.find((m) => m.course.id === id)
  const firstLesson = curriculum.data?.flatMap((m) => m.lessons)[0]

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/courses">
          <ArrowLeft className="mr-1.5 size-4" /> Back to courses
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="font-display text-2xl">{c.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {c.is_cstf_aligned && (
                <Badge variant="outline" className="gap-1 text-success">
                  <ShieldCheck className="size-3.5" /> CSTF aligned
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Award className="size-3.5" /> {c.cpd_hours} CPD
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3.5" /> {c.duration_mins} mins
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {c.summary && <p className="text-muted-foreground">{c.summary}</p>}
          {c.description && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: c.description }}
            />
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {mine?.enrolled ? (
              firstLesson ? (
                <Button asChild>
                  <Link to={`/platform/courses/${id}/learn/${firstLesson.id}`}>
                    <PlayCircle className="mr-2 size-4" /> Continue learning
                  </Link>
                </Button>
              ) : (
                <Button disabled>No lessons yet</Button>
              )
            ) : (
              <Button
                disabled={enrol.isPending}
                onClick={() =>
                  enrol
                    .mutateAsync(id)
                    .then(() => toast.success("Enrolled"))
                    .catch(() => toast.error("Could not enrol"))
                }
              >
                Enrol on this course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
