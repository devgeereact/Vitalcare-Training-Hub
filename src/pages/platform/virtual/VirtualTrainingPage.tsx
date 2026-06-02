import { Link } from "react-router-dom"
import { format, isPast } from "date-fns"
import { Video, AlertCircle, Clock, Plus, PlayCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { useVirtualSessions } from "@/lib/queries/virtual.queries"

export default function VirtualTrainingPage() {
  const { isAdmin, isTrainer } = useUser()
  const canManage = isAdmin || isTrainer
  const { data, isLoading, isError, refetch } = useVirtualSessions()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Virtual training</h1>
          <p className="mt-1 text-muted-foreground">
            Online sessions with Google Meet links and Zoom backup.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/platform/sessions/new">
              <Plus className="mr-2 size-4" /> New session
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load virtual sessions. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Video className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No virtual sessions yet. Create a session and mark it virtual to get a
              Meet link automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data!.map((s) => {
            const past = isPast(new Date(s.ends_at))
            return (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      <Link
                        to={`/platform/sessions/${s.id}`}
                        className="hover:text-brand-navy"
                      >
                        {s.title}
                      </Link>
                    </CardTitle>
                    <Badge variant={past ? "secondary" : "default"}>
                      {past ? "Past" : "Upcoming"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {format(new Date(s.starts_at), "EEE d MMM yyyy, HH:mm")} –{" "}
                    {format(new Date(s.ends_at), "HH:mm")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.meet_url && (
                      <Button asChild size="sm" disabled={past}>
                        <a href={s.meet_url} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-1.5 size-4" /> Join Google Meet
                        </a>
                      </Button>
                    )}
                    {s.zoom_join_url && (
                      <Button
                        asChild
                        size="sm"
                        variant={s.meet_url ? "outline" : "default"}
                      >
                        <a
                          href={s.zoom_join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Video className="mr-1.5 size-4" /> Join Zoom
                        </a>
                      </Button>
                    )}
                    {s.recording_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={s.recording_url} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="mr-1.5 size-4" /> Watch recording
                        </a>
                      </Button>
                    )}
                    {!s.meet_url && !s.zoom_join_url && !s.recording_url && (
                      <span className="text-xs text-muted-foreground">
                        No meeting link yet.
                      </span>
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
