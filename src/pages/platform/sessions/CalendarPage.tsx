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
  Video,
  Hourglass,
  CheckCircle2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import { useCalendarSessions, useCreateSession, useTrainers } from "@/lib/queries/sessions.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import {
  useCalendarEvents,
  useCalendarEventMutations,
  useOrgHolidays,
} from "@/lib/queries/calendar.queries"
import { getUpcomingHolidays } from "@/lib/integrations/holidays"
import { useOneToOnes } from "@/lib/queries/one-to-one.queries"
import {
  useMyJoinRequests,
  useRequestJoin,
  getSessionJoinLink,
} from "@/lib/queries/virtual.queries"
import { selfCheckIn } from "@/lib/queries/sessions.queries"
import { cn } from "@/lib/utils"

const COLORS = {
  physical: "#1b2e6b",
  virtual: "#d4a843",
  holiday: "#64748b",
  closure: "#7c3aed",
  custom: "#16a34a",
  o2o: "#0891b2",
}
const EVENT_COLOR_CHOICES = ["#16a34a", "#1b2e6b", "#d4a843", "#dc2626", "#7c3aed", "#0891b2"]

interface Selected {
  kind: "session" | "holiday" | "custom" | "o2o"
  id: string
  title: string
  start: string
  end?: string
  description?: string
  color: string
  meetUrl?: string
  /** True when the event has already ended (computed at selection time). */
  past?: boolean
  /** True for a virtual training session (drives the inline join request). */
  isVirtual?: boolean
}

function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { isAdmin, isTrainer } = useUser()
  const canManage = isAdmin || isTrainer
  const sessions = useCalendarSessions()
  const customEvents = useCalendarEvents()
  const mut = useCalendarEventMutations()
  const createSession = useCreateSession()
  const courseOptions = useCourses()
  const trainerOptions = useTrainers()

  const holidays = useQuery({
    queryKey: ["holidays", "GB"],
    queryFn: () => getUpcomingHolidays("GB"),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })
  const orgHolidays = useOrgHolidays()
  // The current user's own 1:1s (as learner or assigned trainer). Approved +
  // scheduled ones surface on the calendar with their meeting link.
  const oneToOnes = useOneToOnes(user?.id, false)
  // Learner join requests, so the calendar popup can offer request / join inline.
  const myJoin = useMyJoinRequests(canManage ? undefined : user?.id)
  const requestJoin = useRequestJoin(user?.id)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  async function joinSession(sessionId: string): Promise<void> {
    setJoiningId(sessionId)
    try {
      const link = await getSessionJoinLink(sessionId)
      const url = link?.meet_url || link?.zoom_join_url
      if (!url) {
        toast.error("The meeting link is not available yet.")
        return
      }
      await selfCheckIn(sessionId, { lenient: true }).catch(() => undefined)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not join the session.")
    } finally {
      setJoiningId(null)
    }
  }

  const [selected, setSelected] = useState<Selected | null>(null)
  const [editing, setEditing] = useState(false)
  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fStart, setFStart] = useState("")
  const [fEnd, setFEnd] = useState("")
  const [fAllDay, setFAllDay] = useState(false)
  const [fColor, setFColor] = useState(COLORS.custom)
  const [editId, setEditId] = useState<string | null>(null)
  // "reminder" creates a personal calendar event; "session" creates a real
  // training session inline (no redirect to the sessions page).
  const [fKind, setFKind] = useState<"reminder" | "session">("reminder")
  const [fVirtual, setFVirtual] = useState(false)
  const [fCourse, setFCourse] = useState("")
  const [fTrainer, setFTrainer] = useState("")
  const [fVenue, setFVenue] = useState("")
  const [fCapacity, setFCapacity] = useState("")
  const [fPublic, setFPublic] = useState(false)

  const events: EventInput[] = useMemo(() => {
    const nowMs = Date.now()
    const out: EventInput[] = []
    for (const s of sessions.data ?? []) {
      // Learners do not see past sessions on their calendar; staff still do.
      if (!canManage && new Date(s.endsAt).getTime() < nowMs) continue
      out.push({
        id: `session:${s.id}`,
        title: s.title,
        start: s.startsAt,
        end: s.endsAt,
        backgroundColor: s.isVirtual ? COLORS.virtual : COLORS.physical,
        borderColor: s.isVirtual ? COLORS.virtual : COLORS.physical,
        extendedProps: { kind: "session", rawId: s.id, isVirtual: s.isVirtual },
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
    for (const h of orgHolidays.data ?? []) {
      // FullCalendar treats all-day end dates as exclusive, so add a day.
      const endExclusive = new Date(`${h.endsOn}T00:00:00`)
      endExclusive.setDate(endExclusive.getDate() + 1)
      out.push({
        id: `orgholiday:${h.id}`,
        title: h.name,
        start: h.startsOn,
        end: endExclusive.toISOString().slice(0, 10),
        allDay: true,
        backgroundColor: COLORS.closure,
        borderColor: COLORS.closure,
        extendedProps: { kind: "holiday", description: h.notes ?? undefined },
      })
    }
    for (const r of oneToOnes.data ?? []) {
      // Only approved + scheduled 1:1s belong on the calendar.
      if (r.status !== "approved" || !r.scheduled_at) continue
      const start = new Date(r.scheduled_at)
      const end = new Date(start.getTime() + 30 * 60000)
      const counterpart =
        user?.id === r.learner_id ? r.trainerName : r.learnerName
      out.push({
        id: `o2o:${r.id}`,
        title: `1:1 · ${r.courseTitle ?? counterpart ?? "Session"}`,
        start: r.scheduled_at,
        end: end.toISOString(),
        backgroundColor: COLORS.o2o,
        borderColor: COLORS.o2o,
        extendedProps: {
          kind: "o2o",
          rawId: r.id,
          description: [counterpart ? `With ${counterpart}` : null, r.note]
            .filter(Boolean)
            .join(" · ") || undefined,
          meetUrl: r.meet_url ?? undefined,
        },
      })
    }
    return out
  }, [sessions.data, customEvents.data, holidays.data, orgHolidays.data, oneToOnes.data, user?.id, canManage])

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
    setFKind("reminder")
    setFVirtual(false)
    setFCourse("")
    setFTrainer("")
    setFVenue("")
    setFCapacity("")
    setFPublic(false)
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

    // New session: create a real training session inline, no redirect.
    if (!editId && fKind === "session") {
      createSession
        .mutateAsync({
          title: fTitle,
          description: fDesc,
          course_id: fCourse,
          trainer_id: fTrainer,
          starts_at: fStart,
          ends_at: fEnd || fStart,
          venue: fVenue,
          capacity: fCapacity ? Number(fCapacity) : undefined,
          is_virtual: fVirtual,
          is_public: fPublic,
          meeting_provider: "google_meet",
        })
        .then(() => {
          toast.success("Session created")
          setEditing(false)
        })
        .catch(() => toast.error("Could not create session"))
      return
    }

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
          <Button onClick={() => openNew()}>
            <Plus className="mr-2 size-4" /> New event
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          ["In-person session", COLORS.physical],
          ["Virtual session", COLORS.virtual],
          ["Holiday", COLORS.holiday],
          ["Closure", COLORS.closure],
          ["1:1 session", COLORS.o2o],
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
                  eventClassNames={(arg) => {
                    const end = arg.event.end ?? arg.event.start
                    return end && end.getTime() < Date.now()
                      ? ["vc-event-past"]
                      : []
                  }}
                  eventClick={(info) => {
                    info.jsEvent.preventDefault()
                    const kind = info.event.extendedProps.kind as Selected["kind"]
                    const endAt = info.event.end ?? info.event.start
                    setSelected({
                      kind,
                      id: (info.event.extendedProps.rawId as string) ?? info.event.id,
                      title: info.event.title,
                      start: info.event.start?.toISOString() ?? "",
                      end: info.event.end?.toISOString(),
                      description: info.event.extendedProps.description as string | undefined,
                      color: info.event.backgroundColor || COLORS.custom,
                      meetUrl: info.event.extendedProps.meetUrl as string | undefined,
                      past: endAt ? endAt.getTime() < Date.now() : false,
                      isVirtual: Boolean(info.event.extendedProps.isVirtual),
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
                      meetUrl: e.extendedProps?.meetUrl as string | undefined,
                      past: new Date((e.end ?? e.start) as string).getTime() < Date.now(),
                      isVirtual: Boolean(e.extendedProps?.isVirtual),
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
                  {selected.end && ` to ${format(new Date(selected.end), "HH:mm")}`}
                </DialogDescription>
              </DialogHeader>
              {selected.description && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {selected.description}
                </p>
              )}
              <DialogFooter>
                {selected.kind === "session" &&
                  (canManage ? (
                    <Button asChild>
                      <Link to={`/platform/sessions/${selected.id}`}>
                        <ExternalLink className="mr-2 size-4" /> Open session
                      </Link>
                    </Button>
                  ) : selected.past ? (
                    <Button disabled variant="secondary">
                      Session ended
                    </Button>
                  ) : selected.isVirtual ? (
                    // Inline request-to-join for a virtual session.
                    (() => {
                      const status = myJoin.data?.[selected.id]
                      if (status === "approved")
                        return (
                          <Button
                            onClick={() => joinSession(selected.id)}
                            disabled={joiningId === selected.id}
                          >
                            {joiningId === selected.id ? (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                              <Video className="mr-2 size-4" />
                            )}
                            Join meeting
                          </Button>
                        )
                      if (status === "pending")
                        return (
                          <Button variant="outline" disabled>
                            <Hourglass className="mr-2 size-4" /> Awaiting approval
                          </Button>
                        )
                      if (status === "declined")
                        return (
                          <span className="text-sm text-muted-foreground">
                            Request not approved
                          </span>
                        )
                      return (
                        <Button
                          onClick={() =>
                            requestJoin.mutate(selected.id, {
                              onSuccess: () =>
                                toast.success("Request sent. An admin will review it."),
                              onError: (err) =>
                                toast.error(
                                  err instanceof Error ? err.message : "Could not send request",
                                ),
                            })
                          }
                          disabled={requestJoin.isPending}
                        >
                          <CheckCircle2 className="mr-2 size-4" /> Request to join
                        </Button>
                      )
                    })()
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      In-person session. Your trainer will confirm your place.
                    </span>
                  ))}
                {selected.kind === "o2o" && (
                  <>
                    <Button asChild variant="outline">
                      <Link to="/platform/one-to-one">
                        <ExternalLink className="mr-2 size-4" /> View 1:1
                      </Link>
                    </Button>
                    {selected.meetUrl &&
                      (selected.past ? (
                        <Button disabled variant="secondary">
                          Meeting ended
                        </Button>
                      ) : (
                        <Button asChild>
                          <a
                            href={selected.meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 size-4" /> Join meeting
                          </a>
                        </Button>
                      ))}
                  </>
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
            <DialogTitle>
              {editId ? "Edit event" : fKind === "session" ? "New session" : "New event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editId && (
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(["reminder", "session"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFKind(k)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      fKind === k
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
            <Input placeholder="Title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
            <div className="flex justify-end">
              <AiFieldsButton
                subject="a short calendar event"
                context={fTitle ? `Topic: ${fTitle}` : undefined}
                fields={[
                  { key: "title", label: "Title", format: "text" },
                  { key: "description", label: "Description", format: "text" },
                ]}
                onApply={(v) => {
                  if (v.title) setFTitle(v.title.slice(0, 80))
                  if (v.description) setFDesc(v.description)
                }}
              />
            </div>
            <Textarea
              placeholder="Description (optional)"
              rows={2}
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs">Starts</Label>
                <DateTimePicker value={fStart} onChange={setFStart} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Ends</Label>
                <DateTimePicker value={fEnd} onChange={setFEnd} />
              </div>
            </div>
            {!editId && fKind === "session" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs">Course</Label>
                    <Select value={fCourse} onValueChange={setFCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {(courseOptions.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Trainer</Label>
                    <Select value={fTrainer} onValueChange={setFTrainer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {(trainerOptions.data ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs">
                      {fVirtual ? "Joining note" : "Venue"}
                    </Label>
                    <Input
                      placeholder={fVirtual ? "e.g. Google Meet" : "e.g. Training Room 1"}
                      value={fVenue}
                      onChange={(e) => setFVenue(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs">Capacity</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Optional"
                      value={fCapacity}
                      onChange={(e) => setFCapacity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={fVirtual} onCheckedChange={setFVirtual} />
                    <Label className="text-sm">Virtual session</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={fPublic} onCheckedChange={setFPublic} />
                    <Label className="text-sm">Public (open enrolment)</Label>
                  </div>
                </div>
              </div>
            )}
            {(editId || fKind === "reminder") && (
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEvent}
              disabled={
                !fTitle.trim() ||
                mut.create.isPending ||
                mut.update.isPending ||
                createSession.isPending
              }
            >
              {(mut.create.isPending || mut.update.isPending || createSession.isPending) && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {editId ? "Save" : fKind === "session" ? "Create session" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
