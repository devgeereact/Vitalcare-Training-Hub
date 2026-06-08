import { Suspense } from "react"
import { lazyWithReload } from "@/lib/chunk-reload"
import type { JSX } from "react"
import { Link } from "react-router-dom"
import {
  Users,
  BookOpen,
  Award,
  CalendarDays,
  AlertCircle,
  Inbox,
  Megaphone,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  Trophy,
  Banknote,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useUser } from "@/hooks/use-user"
import { GradientStatCard } from "@/components/dashboard/GradientStatCard"
import { QuickLinks } from "@/components/dashboard/QuickLinks"
import { QuickCheckIn } from "@/components/dashboard/QuickCheckIn"
import { AttendanceBars } from "@/components/dashboard/AttendanceBars"
import { NoticeBoard } from "@/components/dashboard/NoticeBoard"
import { TopLearnersList } from "@/components/dashboard/TopLearnersList"
import { SessionsList } from "@/components/dashboard/SessionsList"
import WeatherWidget from "@/components/dashboard/WeatherWidget"
import {
  useDashboardStats,
  useCompletionTrend,
  useAttendanceBreakdown,
  useRecentEnrolments,
  useUpcomingSessions,
  useRevenueOverview,
  useTopLearners,
  useTrainerStats,
  useTrainerUpcomingSessions,
  useLearnerStats,
  useLearnerUpcomingSessions,
  type RecentEnrolment,
} from "@/lib/queries/dashboard.queries"
import { useAnnouncements } from "@/lib/queries/communication.queries"
import { useMyCourses } from "@/lib/queries/courses.queries"
import { useMyAttendanceRegister } from "@/lib/queries/attendance.queries"
import { gbp } from "@/lib/queries/invoices.queries"

const CompletionTrendChart = lazyWithReload(
  () => import("@/components/dashboard/CompletionTrendChart"),
)
const RevenueChart = lazyWithReload(() => import("@/components/dashboard/RevenueChart"))

// ─── Shared state helpers ────────────────────────────────────────────────────

function ChartSkeleton(): JSX.Element {
  return <Skeleton className="h-[280px] w-full rounded-md" />
}

function ListSkeleton({ rows = 4 }: { rows?: number }): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
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
}): JSX.Element {
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

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  trainer: "Trainer",
  learner: "Learner",
}

function PageHeader({
  title,
  subtitle,
  roleLabel,
}: {
  title: string
  subtitle: string
  roleLabel?: string
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl leading-tight text-foreground">
            {title}
          </h1>
          {roleLabel && (
            <Badge
              variant="outline"
              className="border-brand-navy/20 bg-brand-navy/5 text-brand-navy"
            >
              {roleLabel}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      </div>
      <WeatherWidget />
    </div>
  )
}

/** Section heading for grouping dashboard cards with consistent rhythm. */
function SectionHeading({
  title,
  description,
}: {
  title: string
  description?: string
}): JSX.Element {
  return (
    <div className="space-y-0.5">
      <h2 className="font-display text-xl leading-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
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

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Notice board card (reused by admin + trainer) ──────────────────────────

function NoticeBoardCard(): JSX.Element {
  const announcements = useAnnouncements()
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Notice board</CardTitle>
        <CardDescription>Latest announcements for the team</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {announcements.isLoading ? (
          <ListSkeleton />
        ) : announcements.isError ? (
          <ErrorState onRetry={() => announcements.refetch()} />
        ) : (announcements.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Megaphone}
            message="No announcements yet."
            cta={{ label: "Post an announcement", to: "/platform/announcements" }}
          />
        ) : (
          <NoticeBoard
            items={announcements.data!.slice(0, 5).map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              authorName: a.authorName,
              createdAt: a.published_at ?? a.created_at,
            }))}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Admin / super_admin dashboard ───────────────────────────────────────────

function AdminDashboard({
  name,
  roleLabel,
}: {
  name: string
  roleLabel: string
}): JSX.Element {
  const stats = useDashboardStats()
  const trend = useCompletionTrend()
  const attendance = useAttendanceBreakdown()
  const enrolments = useRecentEnrolments()
  const sessions = useUpcomingSessions()
  const revenue = useRevenueOverview()
  const topLearners = useTopLearners()

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="Training activity across your organisation at a glance."
        roleLabel={roleLabel}
      />

      {/* KPI cards */}
      {stats.isError ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState onRetry={() => stats.refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <GradientStatCard
            label="Total learners"
            value={stats.data?.totalLearners ?? 0}
            icon={Users}
            tone="navy"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="Total courses"
            value={stats.data?.activeCourses ?? 0}
            icon={BookOpen}
            tone="gold"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="Upcoming sessions"
            value={stats.data?.upcomingSessions ?? 0}
            icon={CalendarDays}
            tone="slate"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="Certificates issued"
            value={stats.data?.certificatesIssued ?? 0}
            icon={Award}
            tone="emerald"
            loading={stats.isLoading}
          />
        </div>
      )}

      {/* Quick actions */}
      <section className="space-y-4">
        <SectionHeading
          title="Get started"
          description="Record attendance and jump to your most-used tools."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <QuickCheckIn
              session={sessions.data?.[0] ?? null}
              loading={sessions.isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <QuickLinks role="admin" />
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-4">
        <SectionHeading
          title="Performance"
          description="Completions, attendance and fees across the organisation."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>Course completions</CardTitle>
              <CardDescription>
                Completed enrolments, last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
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

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Recorded session attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              {attendance.isLoading ? (
                <ListSkeleton />
              ) : attendance.isError ? (
                <ErrorState onRetry={() => attendance.refetch()} />
              ) : (attendance.data?.total ?? 0) === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  message="No attendance recorded yet."
                />
              ) : (
                <AttendanceBars
                  labels={attendance.data!.labels}
                  series={attendance.data!.series}
                  total={attendance.data!.total}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>Fees overview</CardTitle>
              <CardDescription>
                Invoiced, collected and outstanding
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {revenue.isLoading ? (
                <ChartSkeleton />
              ) : revenue.isError ? (
                <ErrorState onRetry={() => revenue.refetch()} />
              ) : (revenue.data?.invoiceCount ?? 0) === 0 ? (
                <EmptyState
                  icon={Banknote}
                  message="No invoices raised yet."
                  cta={{ label: "Go to payments", to: "/platform/payments" }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Billed</p>
                      <p className="mt-0.5 font-display text-xl text-brand-navy tabular-nums">
                        {gbp(revenue.data!.billedPence)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Collected</p>
                      <p className="mt-0.5 font-display text-xl text-success tabular-nums">
                        {gbp(revenue.data!.paidPence)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="mt-0.5 font-display text-xl text-brand-gold tabular-nums">
                        {gbp(revenue.data!.outstandingPence)}
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<ChartSkeleton />}>
                    <RevenueChart
                      billed={revenue.data!.billedPence / 100}
                      paid={revenue.data!.paidPence / 100}
                      outstanding={revenue.data!.outstandingPence / 100}
                    />
                  </Suspense>
                </div>
              )}
            </CardContent>
          </Card>

          <NoticeBoardCard />
        </div>
      </section>

      {/* Activity */}
      <section className="space-y-4">
        <SectionHeading
          title="Activity"
          description="Recent enrolments, top learners and what's coming up."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent enrolments</CardTitle>
              <CardDescription>
                Latest learners to join a course
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {enrolments.isLoading ? (
                <ListSkeleton />
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
                        <TableCell className="font-medium">
                          {e.learnerName}
                        </TableCell>
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

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Top learners</CardTitle>
              <CardDescription>By courses completed</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {topLearners.isLoading ? (
                <ListSkeleton />
              ) : topLearners.isError ? (
                <ErrorState onRetry={() => topLearners.refetch()} />
              ) : (topLearners.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Trophy}
                  message="No completions recorded yet."
                />
              ) : (
                <TopLearnersList items={topLearners.data!} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming sessions</CardTitle>
            <CardDescription>Next scheduled training</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.isLoading ? (
              <ListSkeleton />
            ) : sessions.isError ? (
              <ErrorState onRetry={() => sessions.refetch()} />
            ) : (sessions.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CalendarDays}
                message="No upcoming sessions."
                cta={{ label: "View calendar", to: "/platform/calendar" }}
              />
            ) : (
              <SessionsList items={sessions.data!} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

// ─── Trainer dashboard ───────────────────────────────────────────────────────

function TrainerDashboard({
  trainerId,
  name,
  roleLabel,
}: {
  trainerId: string
  name: string
  roleLabel: string
}): JSX.Element {
  const stats = useTrainerStats(trainerId)
  const sessions = useTrainerUpcomingSessions(trainerId)

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="Your sessions, courses and learners at a glance."
        roleLabel={roleLabel}
      />

      {stats.isError ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState onRetry={() => stats.refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GradientStatCard
            label="My upcoming sessions"
            value={stats.data?.upcomingSessions ?? 0}
            icon={CalendarDays}
            tone="navy"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="My learners"
            value={stats.data?.myLearners ?? 0}
            icon={Users}
            tone="gold"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="My courses"
            value={stats.data?.myCourses ?? 0}
            icon={BookOpen}
            tone="slate"
            loading={stats.isLoading}
          />
        </div>
      )}

      {/* Quick actions */}
      <section className="space-y-4">
        <SectionHeading
          title="Get started"
          description="Check in to a session or open the tools you use most."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <QuickCheckIn
              session={sessions.data?.[0] ?? null}
              loading={sessions.isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <QuickLinks role="trainer" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Your week"
          description="Sessions you are leading and the latest team notices."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>My upcoming sessions</CardTitle>
              <CardDescription>Sessions you are leading</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {sessions.isLoading ? (
                <ListSkeleton />
              ) : sessions.isError ? (
                <ErrorState onRetry={() => sessions.refetch()} />
              ) : (sessions.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  message="You have no upcoming sessions."
                  cta={{ label: "View sessions", to: "/platform/sessions" }}
                />
              ) : (
                <SessionsList items={sessions.data!} showJoin />
              )}
            </CardContent>
          </Card>

          <NoticeBoardCard />
        </div>
      </section>
    </div>
  )
}

// ─── Learner dashboard ───────────────────────────────────────────────────────

/** Pill colours for each attendance status, shared with the attendance log. */
const ATTENDANCE_STATUS_CLS: Record<string, string> = {
  present: "bg-success/15 text-success",
  attended: "bg-success/15 text-success",
  late: "bg-warning/15 text-warning",
  excused: "bg-primary/10 text-primary",
  absent: "bg-destructive/15 text-destructive",
}

function LearnerDashboard({
  learnerId,
  name,
  roleLabel,
}: {
  learnerId: string
  name: string
  roleLabel: string
}): JSX.Element {
  const stats = useLearnerStats(learnerId)
  const myCourses = useMyCourses()
  const sessions = useLearnerUpcomingSessions(learnerId)
  const register = useMyAttendanceRegister(learnerId)

  const inProgress = (myCourses.data ?? []).filter(
    (c) => c.enrolled && c.progressPct < 100,
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}${name ? `, ${name}` : ""}`}
        subtitle="Your courses, sessions and certificates in one place."
        roleLabel={roleLabel}
      />

      {stats.isError ? (
        <Card>
          <CardContent className="p-0">
            <ErrorState onRetry={() => stats.refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GradientStatCard
            label="My courses"
            value={stats.data?.enrolledCourses ?? 0}
            icon={GraduationCap}
            tone="navy"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="Completed"
            value={stats.data?.completedCourses ?? 0}
            icon={CheckCircle2}
            tone="emerald"
            loading={stats.isLoading}
          />
          <GradientStatCard
            label="My certificates"
            value={stats.data?.certificates ?? 0}
            icon={Award}
            tone="gold"
            loading={stats.isLoading}
          />
        </div>
      )}

      {/* Quick actions */}
      <section className="space-y-4">
        <SectionHeading
          title="Get started"
          description="Check in to a session or jump back into your learning."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {(() => {
            // The QR check-in only appears when the learner has an upcoming
            // online or virtual session to attend.
            const virtualSession =
              (sessions.data ?? []).find((s) => s.isVirtual) ?? null
            if (!sessions.isLoading && !virtualSession) return null
            return (
              <div className="lg:col-span-1">
                <QuickCheckIn session={virtualSession} loading={sessions.isLoading} />
              </div>
            )
          })()}
          <div className="lg:col-span-2">
            <QuickLinks role="learner" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Your learning"
          description="Pick up where you left off and see what's coming up."
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>Courses in progress</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {myCourses.isLoading ? (
                <ListSkeleton />
              ) : myCourses.isError ? (
                <ErrorState onRetry={() => myCourses.refetch()} />
              ) : inProgress.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  message="No courses in progress. Browse the catalogue to enrol."
                  cta={{ label: "Find a course", to: "/platform/courses" }}
                />
              ) : (
                <ul className="-my-1 divide-y divide-border">
                  {inProgress.slice(0, 6).map((c) => (
                    <li
                      key={c.course.id}
                      className="rounded-lg px-1 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <Link
                          to={`/platform/courses/${c.course.id}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
                        >
                          {c.course.title}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {c.progressPct}%
                        </span>
                      </div>
                      <Progress value={c.progressPct} className="h-2" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>My upcoming sessions</CardTitle>
              <CardDescription>Sessions you are booked onto</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {sessions.isLoading ? (
                <ListSkeleton />
              ) : sessions.isError ? (
                <ErrorState onRetry={() => sessions.refetch()} />
              ) : (sessions.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  message="No upcoming sessions booked."
                  cta={{ label: "View calendar", to: "/platform/calendar" }}
                />
              ) : (
                <SessionsList items={sessions.data!} showJoin />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Attendance register"
          description="Every training session you have been marked for."
        />
        <Card>
          <CardContent className="p-5">
            {register.isLoading ? (
              <ListSkeleton />
            ) : register.isError ? (
              <ErrorState onRetry={() => register.refetch()} />
            ) : (register.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                message="No attendance recorded yet. Check in to a session to start your register."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Training</TableHead>
                    <TableHead>Session date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {register.data!.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.sessionTitle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.sessionStartsAt
                          ? format(new Date(r.sessionStartsAt), "d MMM yyyy, HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            ATTENDANCE_STATUS_CLS[r.status] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.markedAt ? format(new Date(r.markedAt), "d MMM yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <NoticeBoardCard />
    </div>
  )
}

// ─── Role router ─────────────────────────────────────────────────────────────

export default function DashboardPage(): JSX.Element {
  const { profile, role, isAdmin, isTrainer, isManager, isContentEditor, loading } =
    useUser()

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    )
  }

  const firstName =
    profile?.first_name?.trim() || profile?.full_name?.trim().split(" ")[0] || ""
  const roleLabel = role ? (ROLE_LABEL[role] ?? "") : ""

  // Managers get the org-wide admin view; content editors get the trainer view.
  if (isAdmin || isManager) return <AdminDashboard name={firstName} roleLabel={roleLabel} />
  if ((isTrainer || isContentEditor) && profile)
    return (
      <TrainerDashboard
        trainerId={profile.id}
        name={firstName}
        roleLabel={roleLabel}
      />
    )
  if (profile)
    return (
      <LearnerDashboard
        learnerId={profile.id}
        name={firstName}
        roleLabel={roleLabel}
      />
    )

  // No profile resolved: minimal safe fallback.
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your training activity at a glance."
      />
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Inbox}
            message="We could not load your profile. Please sign in again."
          />
        </CardContent>
      </Card>
    </div>
  )
}
