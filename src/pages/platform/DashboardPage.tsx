import { lazy, Suspense } from "react"
import { Link } from "react-router-dom"
import { format, formatDistanceToNow } from "date-fns"
import {
  Users,
  BookOpen,
  Award,
  CalendarDays,
  AlertCircle,
  Inbox,
  Video,
  MapPin,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { StatCard } from "@/components/dashboard/StatCard"
import {
  useDashboardStats,
  useCompletionTrend,
  useAttendanceBreakdown,
  useRecentEnrolments,
  useUpcomingSessions,
  type RecentEnrolment,
} from "@/lib/queries/dashboard.queries"

const CompletionTrendChart = lazy(
  () => import("@/components/dashboard/CompletionTrendChart"),
)
const AttendanceDonut = lazy(
  () => import("@/components/dashboard/AttendanceDonut"),
)

function ChartSkeleton() {
  return <Skeleton className="h-[280px] w-full rounded-md" />
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">
        Could not load this section. Please try again.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  message,
  cta,
}: {
  icon: typeof Inbox
  message: string
  cta?: { label: string; to: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {cta && (
        <Button asChild size="sm" variant="outline">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  )
}

const STATUS_VARIANT: Record<RecentEnrolment["status"], string> = {
  completed: "bg-success/15 text-success",
  in_progress: "bg-primary/10 text-primary",
  not_started: "bg-muted text-muted-foreground",
  expired: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
}

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DashboardPage() {
  const stats = useDashboardStats()
  const trend = useCompletionTrend()
  const attendance = useAttendanceBreakdown()
  const enrolments = useRecentEnrolments()
  const sessions = useUpcomingSessions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Training activity across your organisation at a glance.
        </p>
      </div>

      {/* KPI cards */}
      {stats.isError ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState onRetry={() => stats.refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total learners"
            value={stats.data?.totalLearners ?? 0}
            icon={Users}
            loading={stats.isLoading}
          />
          <StatCard
            label="Active courses"
            value={stats.data?.activeCourses ?? 0}
            icon={BookOpen}
            loading={stats.isLoading}
          />
          <StatCard
            label="Completions this month"
            value={stats.data?.completionsThisMonth ?? 0}
            icon={Award}
            loading={stats.isLoading}
          />
          <StatCard
            label="Sessions this week"
            value={stats.data?.sessionsThisWeek ?? 0}
            icon={CalendarDays}
            loading={stats.isLoading}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course completions</CardTitle>
            <CardDescription>Completed enrolments, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <ChartSkeleton />
            ) : trend.isError ? (
              <ErrorState onRetry={() => trend.refetch()} />
            ) : (trend.data?.data.reduce((a, b) => a + b, 0) ?? 0) === 0 ? (
              <EmptyState
                icon={Award}
                message="No completions yet. They will appear here as learners finish courses."
              />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <CompletionTrendChart
                  categories={trend.data!.categories}
                  data={trend.data!.data}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Recorded session attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.isLoading ? (
              <ChartSkeleton />
            ) : attendance.isError ? (
              <ErrorState onRetry={() => attendance.refetch()} />
            ) : (attendance.data?.total ?? 0) === 0 ? (
              <EmptyState
                icon={CalendarDays}
                message="No attendance recorded yet."
              />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <AttendanceDonut
                  labels={attendance.data!.labels}
                  series={attendance.data!.series}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent enrolments</CardTitle>
            <CardDescription>Latest learners to join a course</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolments.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : enrolments.isError ? (
              <ErrorState onRetry={() => enrolments.refetch()} />
            ) : (enrolments.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={Inbox}
                message="No enrolments yet."
                cta={{ label: "Manage learners", to: "/platform/learners" }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolments.data!.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.learnerName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.courseTitle}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_VARIANT[e.status]}`}
                        >
                          {statusLabel(e.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
            <CardDescription>Next scheduled training</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : sessions.isError ? (
              <ErrorState onRetry={() => sessions.refetch()} />
            ) : (sessions.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CalendarDays}
                message="No upcoming sessions."
                cta={{ label: "View calendar", to: "/platform/calendar" }}
              />
            ) : (
              <ul className="divide-y divide-border">
                {sessions.data!.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {s.isVirtual ? (
                        <Video className="size-4" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.startsAt), "EEE d MMM, HH:mm")} ·{" "}
                        {formatDistanceToNow(new Date(s.startsAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {s.isVirtual ? "Virtual" : "In person"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
