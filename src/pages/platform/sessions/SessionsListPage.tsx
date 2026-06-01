import { Link } from "react-router-dom"
import { format } from "date-fns"
import { Plus, CalendarDays, AlertCircle, Video, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useSessions } from "@/lib/queries/sessions.queries"

export default function SessionsListPage() {
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
                {data!.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/platform/sessions/${s.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {s.title}
                      </Link>
                      {s.venue && (
                        <span className="block text-xs text-muted-foreground">{s.venue}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(s.startsAt), "d MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {s.isVirtual ? <Video className="size-3" /> : <MapPin className="size-3" />}
                        {s.isVirtual ? "Virtual" : "In person"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{s.status.replace("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
