import { Link } from "react-router-dom"
import { toast } from "sonner"
import { BookOpen, AlertCircle, ShieldCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyCourses, useEnrolSelf } from "@/lib/queries/courses.queries"

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyCourses()
  const enrol = useEnrolSelf()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Courses</h1>
        <p className="mt-1 text-muted-foreground">
          Browse the catalogue and continue your learning.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load courses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <BookOpen className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            No published courses yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map(({ course, enrolled, progressPct }) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
                  {course.is_cstf_aligned && (
                    <Badge variant="outline" className="shrink-0 gap-1 text-success">
                      <ShieldCheck className="size-3" /> CSTF
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {course.summary || "No summary provided."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {course.cpd_hours} CPD hours
                </p>

                {enrolled && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{progressPct}% complete</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/platform/courses/${course.id}`}>View</Link>
                  </Button>
                  {enrolled ? (
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/platform/courses/${course.id}`}>Continue</Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={enrol.isPending}
                      onClick={() =>
                        enrol
                          .mutateAsync(course.id)
                          .then(() => toast.success("Enrolled"))
                          .catch(() => toast.error("Could not enrol"))
                      }
                    >
                      Enrol
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
