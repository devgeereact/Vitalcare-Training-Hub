import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  AlertCircle,
  Route,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Loader2,
  GraduationCap,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import {
  usePath,
  usePathCourses,
  usePathCourseMutations,
  useEnrolPath,
} from "@/lib/queries/paths.queries"
import { useCourses } from "@/lib/queries/courses.queries"

export default function LearningPathDetailPage() {
  const { id = "" } = useParams()
  const { user } = useAuth()
  const { isAdmin, isTrainer } = useUser()
  const canManage = isAdmin || isTrainer

  const path = usePath(id)
  const courses = usePathCourses(id, user?.id)
  const mut = usePathCourseMutations(id)
  const enrolPath = useEnrolPath(id, user?.id)
  const allCourses = useCourses()
  const [addCourse, setAddCourse] = useState("")

  const inPath = new Set((courses.data ?? []).map((c) => c.courseId))
  const options = (allCourses.data ?? []).filter((c) => !inPath.has(c.id))
  const total = courses.data?.length ?? 0
  const done = (courses.data ?? []).filter((c) => c.completed).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const allEnrolled = total > 0 && (courses.data ?? []).every((c) => c.enrolled)

  if (path.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (path.isError || !path.data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this path.</p>
        <Button variant="outline" size="sm" onClick={() => path.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/courses/paths">
          <ArrowLeft className="mr-1.5 size-4" /> Back to paths
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display text-2xl">{path.data.name}</CardTitle>
              {path.data.description && (
                <CardDescription className="mt-1">{path.data.description}</CardDescription>
              )}
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
              <Route className="size-5" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {total > 0 && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {done} of {total} courses complete ({pct}%)
              </p>
            </div>
          )}
          <Button
            disabled={total === 0 || allEnrolled || enrolPath.isPending}
            onClick={() =>
              enrolPath
                .mutateAsync()
                .then((r) =>
                  toast.success(
                    `Enrolled on ${r.enrolled}${r.skipped ? `, ${r.skipped} already enrolled` : ""}`,
                  ),
                )
                .catch(() => toast.error("Could not enrol"))
            }
          >
            {enrolPath.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <GraduationCap className="mr-2 size-4" />
            )}
            {allEnrolled ? "Enrolled on this path" : "Enrol on this path"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses in this path</CardTitle>
          <CardDescription>Complete them in order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManage && (
            <div className="flex gap-2">
              <Select value={addCourse} onValueChange={setAddCourse}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Add a course…" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={!addCourse || mut.add.isPending}
                onClick={() =>
                  mut.add
                    .mutateAsync({ courseId: addCourse, position: total })
                    .then(() => {
                      toast.success("Course added")
                      setAddCourse("")
                    })
                    .catch(() => toast.error("Could not add"))
                }
              >
                <Plus className="mr-1.5 size-4" /> Add
              </Button>
            </div>
          )}

          {courses.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : total === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No courses in this path yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {courses.data!.map((c, i) => (
                <li
                  key={c.linkId}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {i + 1}
                  </span>
                  {c.completed ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <Link
                    to={`/platform/courses/${c.courseId}`}
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm hover:underline",
                      c.completed && "text-muted-foreground",
                    )}
                  >
                    {c.title}
                  </Link>
                  {c.enrolled && !c.completed && (
                    <span className="text-xs text-primary">In progress</span>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        mut.remove
                          .mutateAsync(c.linkId)
                          .catch(() => toast.error("Could not remove"))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
