import {
  Users,
  BookOpen,
  GraduationCap,
  Award,
  CalendarDays,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAnalyticsSummary,
  useEnrolmentTrend,
} from "@/lib/queries/analytics.queries"

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-display text-2xl text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-success">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const summary = useAnalyticsSummary()
  const trend = useEnrolmentTrend()
  const maxTrend = Math.max(1, ...(trend.data ?? []).map((p) => p.enrolments))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Training activity across your organisation at a glance.
        </p>
      </div>

      {summary.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : summary.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load analytics. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => summary.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Learners" value={summary.data!.learners} />
          <Stat
            icon={BookOpen}
            label="Courses"
            value={summary.data!.courses}
            sub={`${summary.data!.publishedCourses} published`}
          />
          <Stat
            icon={GraduationCap}
            label="Enrolments"
            value={summary.data!.enrolments}
          />
          <Stat
            icon={TrendingUp}
            label="Completion rate"
            value={`${summary.data!.completionRate}%`}
            sub={`${summary.data!.completions} completed`}
          />
          <Stat icon={Award} label="Certificates" value={summary.data!.certificates} />
          <Stat
            icon={CalendarDays}
            label="Sessions"
            value={summary.data!.sessions}
            sub={`${summary.data!.upcomingSessions} upcoming`}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enrolments, last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : trend.isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="size-7 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load the trend.</p>
              <Button variant="outline" size="sm" onClick={() => trend.refetch()}>
                Retry
              </Button>
            </div>
          ) : (trend.data?.length ?? 0) === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No enrolment data yet.
            </div>
          ) : (
            <div className="flex h-48 items-end gap-3">
              {trend.data!.map((p) => (
                <div key={p.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-brand-navy"
                      style={{ height: `${(p.enrolments / maxTrend) * 100}%` }}
                      title={`${p.enrolments} enrolments`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {p.month.slice(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
