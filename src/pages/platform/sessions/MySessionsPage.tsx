import { format, isToday, isPast } from "date-fns"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Video,
  QrCode,
  Loader2,
  PlayCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  useMyBookedSessions,
  useMarkSelfAttendance,
} from "@/lib/queries/attendance.queries"

export default function MySessionsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useMyBookedSessions(user?.id)
  const mark = useMarkSelfAttendance(user?.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">My sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Tap to mark your attendance if you cannot scan the QR code.
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
            const ended = isPast(new Date(s.endsAt))
            const marked = !!s.attendance
            return (
              <Card key={s.sessionId} className={cn(today && "border-brand-gold")}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    {today && !ended && <Badge>Today</Badge>}
                    {marked && (
                      <Badge variant="secondary" className="gap-1 text-success">
                        <CheckCircle2 className="size-3" /> {s.attendance}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {format(start, "EEE d MMM yyyy, HH:mm")} – {format(new Date(s.endsAt), "HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!marked && (
                      <Button
                        size="sm"
                        disabled={mark.isPending}
                        onClick={() =>
                          mark
                            .mutateAsync(s.sessionId)
                            .then(() => toast.success("Attendance marked — you're in"))
                            .catch(() => toast.error("Could not mark attendance"))
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
                    {s.isVirtual && (s.meetUrl || s.zoomUrl) && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={s.meetUrl || s.zoomUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="mr-1.5 size-4" /> Join
                        </a>
                      </Button>
                    )}
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
