import { useMemo } from "react"
import { Link } from "react-router-dom"
import { BookOpen, AlertCircle, GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseCard } from "@/components/courses/CourseCard"
import { useMyCourses, useCategoryNameMap } from "@/lib/queries/courses.queries"

/**
 * Learner-facing list of the courses they are enrolled on, with progress. The
 * full catalogue lives at /platform/courses; this page shows only enrolments so
 * a learner can find and resume their training quickly.
 */
export default function EnrolledCoursesPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useMyCourses()
  const categoryNames = useCategoryNameMap()

  const enrolled = useMemo(
    () => (data ?? []).filter((c) => c.enrolled),
    [data],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">My learning</h1>
        <p className="mt-1 text-muted-foreground">
          The courses you are enrolled on. Pick up where you left off.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load your courses.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : enrolled.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <GraduationCap className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            You are not enrolled on any courses yet.
          </p>
          <Button asChild size="sm">
            <Link to="/platform/courses">
              <BookOpen className="mr-2 size-4" /> Browse the catalogue
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enrolled.map(({ course, progressPct }) => (
            <div key={course.id} className="flex flex-col">
              <CourseCard
                title={course.title}
                href={`/platform/courses/${course.id}`}
                categoryName={
                  course.category_id ? categoryNames.get(course.category_id) ?? null : null
                }
                cpdHours={course.cpd_hours}
                durationMins={course.duration_mins}
                cstf={course.is_cstf_aligned}
                thumbnailUrl={course.thumbnail_url}
                enrolled
                ctaLabel={progressPct >= 100 ? "Review" : progressPct > 0 ? "Continue" : "Start"}
              />
              <div className="mt-2 px-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-gold"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{progressPct}% complete</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
