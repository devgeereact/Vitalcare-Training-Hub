import { format } from "date-fns"
import { GraduationCap, AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useEnrolments } from "@/lib/queries/enrolments.queries"
import type { EnrollmentStatus } from "@/types/database.types"

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/15 text-success",
  expired: "bg-warning/15 text-warning",
  cancelled: "bg-destructive/15 text-destructive",
}

export default function EnrolmentsPage() {
  const { data, isLoading, isError, refetch } = useEnrolments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Enrolments</h1>
        <p className="mt-1 text-muted-foreground">
          Every learner enrolment and its progress across your courses.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load enrolments. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <GraduationCap className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No enrolments yet. Enrol learners on a course to see them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Learner</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{e.learnerName}</td>
                      <td className="px-5 py-3 text-muted-foreground">{e.courseTitle}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-brand-navy"
                              style={{ width: `${e.progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {e.progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className={STATUS_STYLE[e.status]}>
                          {e.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {format(new Date(e.enrolledAt), "d MMM yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
