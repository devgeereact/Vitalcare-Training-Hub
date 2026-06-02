import type { JSX } from "react"
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
import { GradientStatCard } from "@/components/dashboard/GradientStatCard"
import {
  useAnalyticsSummary,
  useEnrolmentTrend,
} from "@/lib/queries/analytics.queries"

export default function AnalyticsPage(): JSX.Element {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <GradientStatCard
            icon={Users}
            label="Learners"
            value={summary.data!.learners}
            tone="navy"
          />
          <GradientStatCard
            icon={BookOpen}
            label="Courses"
            value={summary.data!.courses}
            hint={`${summary.data!.publishedCourses} published`}
            tone="gold"
          />
          <GradientStatCard
            icon={GraduationCap}
            label="Enrolments"
            value={summary.data!.enrolments}
            tone="slate"
          />
          <GradientStatCard
            icon={TrendingUp}
            label="Completion rate"
            value={`${summary.data!.completionRate}%`}
            hint={`${summary.data!.completions} completed`}
            tone="emerald"
          />
          <GradientStatCard
            icon={Award}
            label="Certificates"
            value={summary.data!.certificates}
            tone="navy"
          />
          <GradientStatCard
            icon={CalendarDays}
            label="Sessions"
            value={summary.data!.sessions}
            hint={`${summary.data!.upcomingSessions} upcoming`}
            tone="gold"
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
