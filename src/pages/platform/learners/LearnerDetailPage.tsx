import { useParams, Link } from "react-router-dom"
import { format } from "date-fns"
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  AlertCircle,
  BookOpen,
  Award,
  CalendarCheck,
  Receipt,
  GraduationCap,
  UserCheck,
  UserX,
  Clock3,
  ShieldCheck,
  Wallet,
  BadgePoundSterling,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  useLearner,
  useLearnerEnrolments,
  useLearnerCertificates,
  useLearnerExamResults,
} from "@/lib/queries/learners.queries"
import { useMyBookedSessions } from "@/lib/queries/attendance.queries"
import { useInvoices, gbp } from "@/lib/queries/invoices.queries"
import type { AttendanceStatus } from "@/types/database.types"

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

const ATT_STYLE: Record<AttendanceStatus, string> = {
  present: "bg-success/15 text-success",
  late: "bg-warning/15 text-warning",
  excused: "bg-primary/10 text-primary",
  absent: "bg-destructive/15 text-destructive",
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  icon: typeof UserCheck
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="font-display text-2xl text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-full", tone)}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

function EmptyState({ icon: Icon, msg }: { icon: typeof BookOpen; msg: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  )
}

function RowSkeletons({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/* ---------------- Attendance tab ---------------- */
function AttendanceTab({ learnerId }: { learnerId: string }) {
  const q = useMyBookedSessions(learnerId)
  const sessions = q.data ?? []
  const count = (s: AttendanceStatus) => sessions.filter((x) => x.attendance === s).length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={count("present")} icon={UserCheck} tone="bg-success/15 text-success" />
        <StatCard label="Absent" value={count("absent")} icon={UserX} tone="bg-destructive/15 text-destructive" />
        <StatCard label="Late" value={count("late")} icon={Clock3} tone="bg-warning/15 text-warning" />
        <StatCard label="Excused" value={count("excused")} icon={ShieldCheck} tone="bg-primary/10 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session attendance</CardTitle>
          <CardDescription>Every session this learner is booked on.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <RowSkeletons />
          ) : q.isError ? (
            <ErrorState msg="Could not load attendance." onRetry={() => q.refetch()} />
          ) : sessions.length === 0 ? (
            <EmptyState icon={CalendarCheck} msg="No booked sessions yet." />
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((s) => (
                <li key={s.sessionId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/platform/sessions/${s.sessionId}`}
                      className="truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {s.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.startsAt), "EEE d MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  {s.attendance ? (
                    <Badge variant="secondary" className={cn("capitalize", ATT_STYLE[s.attendance])}>
                      {s.attendance}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not marked
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- Fees tab ---------------- */
function FeesTab({ learnerId }: { learnerId: string }) {
  const q = useInvoices(false, learnerId)
  const invoices = q.data ?? []
  const total = invoices.reduce((s, i) => s + i.total_pence, 0)
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total_pence, 0)
  const due = total - paid

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={gbp(total)} icon={Wallet} tone="bg-primary/10 text-primary" />
        <StatCard label="Paid" value={gbp(paid)} icon={BadgePoundSterling} tone="bg-success/15 text-success" />
        <StatCard label="Due" value={gbp(due)} icon={Receipt} tone="bg-warning/15 text-warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Fees issued to this learner.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <RowSkeletons />
          ) : q.isError ? (
            <ErrorState msg="Could not load fees." onRetry={() => q.refetch()} />
          ) : invoices.length === 0 ? (
            <EmptyState icon={Receipt} msg="No invoices for this learner." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Number</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-mono text-xs">{inv.number}</td>
                      <td className="px-5 py-3">{gbp(inv.total_pence)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inv.due_date ? format(new Date(inv.due_date), "d MMM yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize",
                            inv.status === "paid"
                              ? "bg-success/15 text-success"
                              : inv.status === "void"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          {inv.status}
                        </Badge>
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

/* ---------------- Exam tab ---------------- */
function ExamTab({ learnerId }: { learnerId: string }) {
  const q = useLearnerExamResults(learnerId)
  const results = q.data ?? []
  const passed = results.filter((r) => r.passed).length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Attempts" value={results.length} icon={GraduationCap} tone="bg-primary/10 text-primary" />
        <StatCard label="Passed" value={passed} icon={UserCheck} tone="bg-success/15 text-success" />
        <StatCard label="Failed" value={results.length - passed} icon={UserX} tone="bg-destructive/15 text-destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment results</CardTitle>
          <CardDescription>Marks and outcomes across assessments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <RowSkeletons />
          ) : q.isError ? (
            <ErrorState msg="Could not load results." onRetry={() => q.refetch()} />
          ) : results.length === 0 ? (
            <EmptyState icon={GraduationCap} msg="No assessment attempts yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Assessment</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{r.assessmentTitle}</td>
                      <td className="px-5 py-3">{r.score}%</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.completedAt ? format(new Date(r.completedAt), "d MMM yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            r.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                          }
                        >
                          {r.passed ? "Pass" : "Fail"}
                        </Badge>
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

/* ---------------- Courses & certificates tab ---------------- */
function CoursesTab({ learnerId }: { learnerId: string }) {
  const enrolments = useLearnerEnrolments(learnerId)
  const certificates = useLearnerCertificates(learnerId)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Course enrolments</CardTitle>
          <CardDescription>Progress across enrolled courses</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolments.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : enrolments.isError ? (
            <ErrorState msg="Could not load enrolments." onRetry={() => enrolments.refetch()} />
          ) : (enrolments.data?.length ?? 0) === 0 ? (
            <EmptyState icon={BookOpen} msg="No enrolments yet." />
          ) : (
            <ul className="divide-y divide-border">
              {enrolments.data!.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-foreground">{e.courseTitle}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{e.progressPct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${e.progressPct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
          <CardDescription>Issued certificates and CPD hours</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : certificates.isError ? (
            <ErrorState msg="Could not load certificates." onRetry={() => certificates.refetch()} />
          ) : (certificates.data?.length ?? 0) === 0 ? (
            <EmptyState icon={Award} msg="No certificates issued yet." />
          ) : (
            <ul className="divide-y divide-border">
              {certificates.data!.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.cpdHours} CPD hours · issued {format(new Date(c.issuedAt), "d MMM yyyy")}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link to={`/resources/verify-certificate?id=${c.verificationUuid}`}>Verify</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- Page ---------------- */
export default function LearnerDetailPage() {
  const { id = "" } = useParams()
  const learner = useLearner(id)

  const name =
    learner.data?.full_name ||
    [learner.data?.first_name, learner.data?.last_name].filter(Boolean).join(" ") ||
    "Learner"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/platform/learners">
            <ArrowLeft className="mr-1.5 size-4" /> Back to learners
          </Link>
        </Button>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          {learner.isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : learner.isError ? (
            <ErrorState msg="Could not load this learner." onRetry={() => learner.refetch()} />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl text-foreground">{name}</h1>
                  <Badge variant="outline" className="capitalize">
                    {learner.data?.role}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {learner.data?.email}
                  </span>
                  {learner.data?.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {learner.data.phone}
                    </span>
                  )}
                  {learner.data?.created_at && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" /> Joined{" "}
                      {format(new Date(learner.data.created_at), "d MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {id && !learner.isError && (
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="exam">Exam</TabsTrigger>
            <TabsTrigger value="courses">Courses &amp; certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceTab learnerId={id} />
          </TabsContent>
          <TabsContent value="fees">
            <FeesTab learnerId={id} />
          </TabsContent>
          <TabsContent value="exam">
            <ExamTab learnerId={id} />
          </TabsContent>
          <TabsContent value="courses">
            <CoursesTab learnerId={id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
