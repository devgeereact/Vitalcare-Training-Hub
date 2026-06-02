import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  BookOpen,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link as RLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Clock, Award, ShieldCheck as ShieldIcon, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMyCourses, useEnrolSelf } from "@/lib/queries/courses.queries"
import type { Course } from "@/types/database.types"

interface CardData {
  course: Course
  enrolled: boolean
  progressPct: number
}

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyCourses()
  const enrol = useEnrolSelf()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<CardData | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Browse the catalogue and continue your learning.
          </p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {([
            ["grid", LayoutGrid],
            ["list", ListIcon],
          ] as const).map(([v, Icon]) => (
            <button
              key={v}
              type="button"
              aria-label={`${v} view`}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                view === v ? "bg-brand-navy text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
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
      ) : view === "list" ? (
        <div className="space-y-3">
          {data!.map(({ course, enrolled, progressPct }) => (
            <Card key={course.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <BookOpen className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{course.title}</p>
                    {course.is_cstf_aligned && (
                      <Badge variant="outline" className="gap-1 text-success">
                        <ShieldCheck className="size-3" /> CSTF
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {course.summary || "No summary provided."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.cpd_hours} CPD hours
                    {enrolled ? ` · ${progressPct}% complete` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected({ course, enrolled, progressPct })}
                  >
                    View
                  </Button>
                  {enrolled && (
                    <Button asChild size="sm">
                      <Link to={`/platform/courses/${course.id}`}>Continue</Link>
                    </Button>
                  )}
                  {!enrolled && (
                    <Button
                      size="sm"
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map(({ course, enrolled, progressPct }) => (
            <Card key={course.id} className="flex flex-col overflow-hidden">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="aspect-video w-full object-cover"
                />
              )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelected({ course, enrolled, progressPct })}
                  >
                    View
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

      {/* Course detail popup */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              {selected.course.thumbnail_url && (
                <img
                  src={selected.course.thumbnail_url}
                  alt={selected.course.title}
                  className="-mx-6 -mt-6 mb-2 aspect-[21/9] w-[calc(100%+3rem)] object-cover"
                />
              )}
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {selected.course.title}
                </DialogTitle>
                {selected.course.summary && (
                  <DialogDescription>{selected.course.summary}</DialogDescription>
                )}
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {selected.course.is_cstf_aligned && (
                  <Badge variant="outline" className="gap-1 text-success">
                    <ShieldIcon className="size-3" /> CSTF aligned
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Award className="size-3" /> {selected.course.cpd_hours} CPD hours
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="size-3" /> {selected.course.duration_mins} mins
                </Badge>
              </div>

              {selected.course.description && (
                <div
                  className="prose prose-sm mt-1 max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: selected.course.description }}
                />
              )}

              {selected.enrolled && (
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${selected.progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.progressPct}% complete
                  </p>
                </div>
              )}

              <DialogFooter>
                {selected.enrolled ? (
                  <Button asChild>
                    <RLink to={`/platform/courses/${selected.course.id}`}>
                      <PlayCircle className="mr-2 size-4" /> Continue learning
                    </RLink>
                  </Button>
                ) : (
                  <Button
                    disabled={enrol.isPending}
                    onClick={() =>
                      enrol
                        .mutateAsync(selected.course.id)
                        .then(() => {
                          toast.success("Enrolled")
                          setSelected(null)
                        })
                        .catch(() => toast.error("Could not enrol"))
                    }
                  >
                    Enrol on this course
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
