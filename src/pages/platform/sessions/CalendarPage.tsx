import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventInput } from "@fullcalendar/core"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  ExternalLink,
  CalendarClock,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useCalendarSessions } from "@/lib/queries/sessions.queries"
import {
  useCalendarEvents,
  useCalendarEventMutations,
} from "@/lib/queries/calendar.queries"
import { getUpcomingHolidays } from "@/lib/integrations/holidays"

const COLORS = {
  physical: "#1b2e6b",
  virtual: "#d4a843",
  holiday: "#64748b",
  custom: "#16a34a",
}
const EVENT_COLOR_CHOICES = ["#16a34a", "#1b2e6b", "#d4a843", "#dc2626", "#7c3aed", "#0891b2"]

interface Selected {
  kind: "session" | "holiday" | "custom"
  id: string
  title: string
  start: string
  end?: string
  description?: string
  color: string
}

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function CalendarPage() {
  const { user } = useAuth()
  const sessions = useCalendarSessions()
  const customEvents = useCalendarEvents()
  const mut = useCalendarEventMutations()

  const holidays = useQuery({
    queryKey: ["holidays", "GB"],
    queryFn: () => getUpcomingHolidays("GB"),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })

  const [selected, setSelected] = useState<Selected | null>(null)
  const [editing, setEditing] = useState(false)
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fStart, setFStart] = useState("")
  const [fEnd, setFEnd] = useState("")
  const [fAllDay, setFAllDay] = useState(false)
  const [fColor, setFColor] = useState(COLORS.custom)
  const [editId, setEditId] = useState<string | null>(null)

  const events: EventInput[] = useMemo(() => {
    const out: EventInput[] = []
    for (const s of sessions.data ?? []) {
      out.push({
        id: `session:${s.id}`,
        title: s.title,
        start: s.startsAt,
        end: s.endsAt,
        backgroundColor: s.isVirtual ? COLORS.virtual : COLORS.physical,
        borderColor: s.isVirtual ? COLORS.virtual : COLORS.physical,
        extendedProps: { kind: "session", rawId: s.id },
      })
    }
    for (const e of customEvents.data ?? []) {
      out.push({
        id: `custom:${e.id}`,
        title: e.title,
        start: e.starts_at,
        end: e.ends_at,
        allDay: e.all_day,
        backgroundColor: e.color,
        borderColor: e.color,
        extendedProps: { kind: "custom", rawId: e.id, description: e.description },
      })
    }
    for (const h of holidays.data ?? []) {
      out.push({
        id: `holiday:${h.date}-${h.name}`,
        title: `🇬🇧 ${h.name}`,
        start: h.date,
        allDay: true,
        backgroundColor: COLORS.holiday,
        borderColor: COLORS.holiday,
        extendedProps: { kind: "holiday" },
      })
    }
    return out
  }, [sessions.data, customEvents.data, holidays.data])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return events
      .filter((e) => e.start && new Date(e.start as string).getTime() >= now - 36e5)
      .sort(
        (a, b) =>
          new Date(a.start as string).getTime() - new Date(b.start as string).getTime(),
      )
      .slice(0, 6)
  }, [events])

  function openNew(dateStr?: string) {
    setEditId(null)
    setFTitle("")
    setFDesc("")
    const base = dateStr ? new Date(dateStr) : new Date()
    setFStart(toLocalInput(base))
    setFEnd(toLocalInput(new Date(base.getTime() + 36e5)))
    setFAllDay(false)
    setFColor(COLORS.custom)
    setEditing(true)
  }

  function openEdit(s: Selected) {
    setEditId(s.id)
    setFTitle(s.title)
    setFDesc(s.description ?? "")
    setFStart(toLocalInput(new Date(s.start)))
    setFEnd(toLocalInput(new Date(s.end ?? s.start)))
    setFColor(s.color)
    setFAllDay(false)
    setSelected(null)
    setEditing(true)
  }

  function saveEvent() {
    if (!fTitle.trim() || !user?.id) return
    const payload = {
      title: fTitle,
      description: fDesc,
      starts_at: fStart,
      ends_at: fEnd || fStart,
      all_day: fAllDay,
      color: fColor,
    }
    const op = editId
      ? mut.update.mutateAsync({ id: editId, ...payload })
      : mut.create.mutateAsync({ ...payload, createdBy: user.id })
    op
      .then(() => {
        toast.success(editId ? "Event updated" : "Event added")
        setEditing(false)
      })
      .catch(() => toast.error("Could not save event"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Calendar</h1>
          <p className="mt-1 text-muted-foreground">
            Sessions, holidays and your events in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openNew()}>
            <Plus className="mr-2 size-4" /> New event
          </Button>
          <Button asChild>
            <Link to="/platform/sessions/new">
              <Plus className="mr-2 size-4" /> New session
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          ["In-person session", COLORS.physical],
          ["Virtual session", COLORS.virtual],
          ["Holiday", COLORS.holiday],
          ["My event", COLORS.custom],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-4">
            {sessions.isLoading ? (
              <Skeleton className="h-[600px] w-full" />
            ) : sessions.isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="size-8 text-destructive" />
                <p className="text-sm text-muted-foreground">Could not load the calendar.</p>
                <Button variant="outline" size="sm" onClick={() => sessions.refetch()}>
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
                  height="auto"
                  eventClick={(info) => {
                    info.jsEvent.preventDefault()
                    const kind = info.event.extendedProps.kind as Selected["kind"]
                    setSelected({
                      kind,
                      id: (info.event.extendedProps.rawId as string) ?? info.event.id,
                      title: info.event.title,
                      start: info.event.start?.toISOString() ?? "",
                      end: info.event.end?.toISOString(),
                      description: info.event.extendedProps.description as string | undefined,
                      color: info.event.backgroundColor || COLORS.custom,
                    })
                  }}
                  dateClick={(info) => openNew(info.dateStr)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-brand-navy" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              upcoming.map((e) => (
                <button
                  key={e.id as string}
                  type="button"
                  onClick={() =>
                    setSelected({
                      kind: (e.extendedProps?.kind ?? "custom") as Selected["kind"],
                      id: (e.extendedProps?.rawId as string) ?? (e.id as string),
                      title: e.title as string,
                      start: e.start as string,
                      end: e.end as string | undefined,
                      description: e.extendedProps?.description as string | undefined,
                      color: (e.backgroundColor as string) || COLORS.custom,
                    })
                  }
                  className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: e.backgroundColor as string }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {e.title as string}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(e.start as string),
                        e.allDay ? "EEE d MMM" : "EEE d MMM, HH:mm",
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event detail popup */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: selected.color }}
                  />
                  {selected.title}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selected.start), "EEE d MMM yyyy, HH:mm")}
                  {selected.end && ` – ${format(new Date(selected.end), "HH:mm")}`}
                </DialogDescription>
              </DialogHeader>
              {selected.description && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {selected.description}
                </p>
              )}
              <DialogFooter>
                {selected.kind === "session" && (
                  <Button asChild>
                    <Link to={`/platform/sessions/${selected.id}`}>
                      <ExternalLink className="mr-2 size-4" /> Open session
                    </Link>
                  </Button>
                )}
                {selected.kind === "custom" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() =>
                        mut.remove
                          .mutateAsync(selected.id)
                          .then(() => {
                            toast.success("Event deleted")
                            setSelected(null)
                          })
                          .catch(() => toast.error("Could not delete"))
                      }
                    >
                      <Trash2 className="mr-2 size-4" /> Delete
                    </Button>
                    <Button onClick={() => openEdit(selected)}>
                      <Pencil className="mr-2 size-4" /> Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New / edit event */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
            <Textarea
              placeholder="Description (optional)"
              rows={2}
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs">Starts</Label>
                <Input
                  type="datetime-local"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Ends</Label>
                <Input
                  type="datetime-local"
                  value={fEnd}
                  onChange={(e) => setFEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={fAllDay} onCheckedChange={setFAllDay} />
                <Label className="text-sm">All day</Label>
              </div>
              <div className="flex gap-1.5">
                {EVENT_COLOR_CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Colour ${c}`}
                    onClick={() => setFColor(c)}
                    className="size-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                    style={{
                      backgroundColor: c,
                      outline: fColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEvent}
              disabled={!fTitle.trim() || mut.create.isPending || mut.update.isPending}
            >
              {(mut.create.isPending || mut.update.isPending) && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {editId ? "Save" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
