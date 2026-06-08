import { Link } from "react-router-dom"
import { format, isToday, isPast, isWithinInterval } from "date-fns"
import { toast } from "sonner"
import {
  Plus,
  CalendarDays,
  AlertCircle,
  Video,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Clock,
  QrCode,
  Loader2,
  PlayCircle,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import { useSessions } from "@/lib/queries/sessions.queries"
import {
  useMyBookedSessions,
  useMarkSelfAttendance,
} from "@/lib/queries/attendance.queries"
import { sessionPhase, sessionPhaseLabel } from "@/lib/sessions/timing"

/** True when "now" sits between start and end (session is in progress). */
function isOngoing(startsAt: string, endsAt: string): boolean {
  const now = new Date()
  try {
    return isWithinInterval(now, { start: new Date(startsAt), end: new Date(endsAt) })
  } catch {
    return false
  }
}

// ─── Learner view: their booked sessions (was "My sessions") ─────────────────
function LearnerSessions() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useMyBookedSessions(user?.id)
  const mark = useMarkSelfAttendance(user?.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">My sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Your booked training. Join, check in, or watch a recording.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load your sessions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarCheck className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              You are not booked on any sessions yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data!.map((s) => {
            const start = new Date(s.startsAt)
            const today = isToday(start)
            const live = isOngoing(s.startsAt, s.endsAt)
            const ended = isPast(new Date(s.endsAt))
            const marked = !!s.attendance
            return (
              <Card
                key={s.sessionId}
                className={cn(
                  live && "border-success ring-1 ring-success/30",
                  !live && today && "border-brand-gold",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {live && (
                        <Badge className="gap-1 bg-success text-white">
                          <Radio className="size-3" /> Live now
                        </Badge>
                      )}
                      {!live && today && !ended && <Badge>Today</Badge>}
                      {!live && ended && (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted text-muted-foreground"
                        >
                          Ended
                        </Badge>
                      )}
                      {marked && (
                        <Badge variant="secondary" className="gap-1 text-success">
                          <CheckCircle2 className="size-3" /> {s.attendance}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {format(start, "EEE d MMM yyyy, HH:mm")} to {format(new Date(s.endsAt), "HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!marked && !ended && (
                      <Button
                        size="sm"
                        disabled={mark.isPending}
                        onClick={() =>
                          mark
                            .mutateAsync(s.sessionId)
                            .then(() => toast.success("Attendance marked, you're in"))
                            .catch((e: unknown) =>
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : "Could not mark attendance",
                              ),
                            )
                        }
                      >
                        {mark.isPending ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 size-4" />
                        )}
                        I'm here
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/platform/sessions/${s.sessionId}/checkin`}>
                        <QrCode className="mr-1.5 size-4" /> QR check-in
                      </Link>
                    </Button>
                    {s.isVirtual &&
                      (s.meetUrl || s.zoomUrl) &&
                      (ended ? (
                        <Button variant="outline" size="sm" disabled>
                          <Video className="mr-1.5 size-4" /> Meeting ended
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={s.meetUrl || s.zoomUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Video className="mr-1.5 size-4" /> Join
                          </a>
                        </Button>
                      ))}
                    {s.recordingUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="mr-1.5 size-4" /> Watch recording
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Staff view: all sessions + create / manage ──────────────────────────────
function StaffSessions() {
  const { data, isLoading, isError, refetch } = useSessions()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Sessions</h1>
          <p className="mt-1 text-muted-foreground">
            Schedule and run live and virtual training sessions.
          </p>
        </div>
        <Button asChild>
          <Link to="/platform/sessions/new">
            <Plus className="mr-2 size-4" /> New session
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load sessions.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CalendarDays className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
              <Button asChild size="sm">
                <Link to="/platform/sessions/new">New session</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((s) => {
                  const today = isToday(new Date(s.startsAt))
                  const live = isOngoing(s.startsAt, s.endsAt)
                  const phase = sessionPhase(s.startsAt, s.endsAt)
                  const statusLabel =
                    s.status === "cancelled"
                      ? "Cancelled"
                      : sessionPhaseLabel(phase)
                  return (
                    <TableRow
                      key={s.id}
                      className={cn(
                        live && "bg-success/5",
                        !live && today && "bg-brand-gold/5",
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/platform/sessions/${s.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {s.title}
                          </Link>
                          {live && (
                            <Badge className="gap-1 bg-success text-white">
                              <Radio className="size-3" /> Live
                            </Badge>
                          )}
                          {!live && today && (
                            <Badge variant="outline" className="border-brand-gold text-brand-navy">
                              Today
                            </Badge>
                          )}
                        </div>
                        {s.venue && (
                          <span className="block text-xs text-muted-foreground">{s.venue}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(s.startsAt), "d MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {s.isVirtual ? (
                            <Video className="size-3" />
                          ) : (
                            <MapPin className="size-3" />
                          )}
                          {s.isVirtual ? "Virtual" : "In person"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1",
                            phase === "live" && "border-success bg-success/10 text-success",
                            phase === "ended" &&
                              "border-border bg-muted text-muted-foreground",
                            phase === "upcoming" &&
                              "border-brand-gold bg-brand-gold/10 text-brand-navy",
                            s.status === "cancelled" &&
                              "border-destructive/40 bg-destructive/10 text-destructive",
                          )}
                        >
                          {phase === "live" && <Radio className="size-3" />}
                          {statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SessionsListPage() {
  const { isLearner, isGuest, loading } = useUser()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  // Learners (and guests) see only their own booked sessions; staff manage all.
  return isLearner || isGuest ? <LearnerSessions /> : <StaffSessions />
}
