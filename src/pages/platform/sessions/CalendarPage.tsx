import { useNavigate, Link } from "react-router-dom"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Plus, AlertCircle } from "lucide-react"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCalendarSessions } from "@/lib/queries/sessions.queries"
import { getGcalEvents } from "@/lib/integrations/google-calendar"

export default function CalendarPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useCalendarSessions()

  const { data: gcal } = useQuery({
    queryKey: ["gcal-events"],
    queryFn: () => {
      const now = new Date()
      const min = new Date(now.getTime() - 60 * 864e5).toISOString()
      const max = new Date(now.getTime() + 120 * 864e5).toISOString()
      return getGcalEvents(min, max)
    },
    staleTime: 15 * 60 * 1000,
    retry: false,
  })

  const events = [
    ...(data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      start: s.startsAt,
      end: s.endsAt,
      backgroundColor: s.isVirtual ? "#d4a843" : "#1b2e6b",
      borderColor: s.isVirtual ? "#d4a843" : "#1b2e6b",
    })),
    ...(gcal ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      backgroundColor: "#e8c26a",
      borderColor: "#d4a843",
      textColor: "#1b2e6b",
    })),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Calendar</h1>
          <p className="mt-1 text-muted-foreground">Your training schedule at a glance.</p>
        </div>
        <Button asChild>
          <Link to="/platform/sessions/new">
            <Plus className="mr-2 size-4" /> New session
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load the calendar.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="vitalcare-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                eventClick={(info) => {
                  info.jsEvent.preventDefault()
                  // Google Calendar overlay events have no session page.
                  if (info.event.id.startsWith("gcal:")) return
                  navigate(`/platform/sessions/${info.event.id}`)
                }}
                height="auto"
                dateClick={(info) => navigate(`/platform/sessions/new?date=${info.dateStr}`)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
