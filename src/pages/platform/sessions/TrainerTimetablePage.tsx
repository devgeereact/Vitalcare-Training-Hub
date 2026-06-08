import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  AlertCircle,
  BookText,
  MapPin,
  Clock,
  Video,
  Users,
  ExternalLink,
  User,
  CalendarOff,
  Plus,
  Trash2,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import {
  useTrainers,
  useTimetable,
  useDeleteSession,
} from "@/lib/queries/sessions.queries"
import type { TimetableEntry } from "@/lib/queries/sessions.queries"
import { useOrgHolidays } from "@/lib/queries/calendar.queries"
import type { OrgHoliday } from "@/lib/queries/calendar.queries"
import AssignSessionDialog from "@/components/sessions/AssignSessionDialog"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// Soft brand-friendly card tones, cycled per slot within a day.
const TONES = [
  "border-l-brand-gold bg-amber-50",
  "border-l-sky-400 bg-sky-50",
  "border-l-emerald-400 bg-emerald-50",
  "border-l-rose-400 bg-rose-50",
  "border-l-violet-400 bg-violet-50",
  "border-l-teal-400 bg-teal-50",
]

function SlotCard({
  e,
  tone,
  onOpen,
}: {
  e: TimetableEntry
  tone: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "block w-full rounded-md border border-border border-l-4 p-3 text-left text-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]",
        tone,
      )}
    >
      <p className="truncate font-semibold text-foreground">{e.title}</p>
      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
        {e.courseTitle && (
          <p className="flex items-center gap-1.5">
            <BookText className="size-3.5 shrink-0" />
            <span className="truncate">{e.courseTitle}</span>
          </p>
        )}
        <p className="flex items-center gap-1.5">
          {e.isVirtual ? (
            <Video className="size-3.5 shrink-0" />
          ) : (
            <MapPin className="size-3.5 shrink-0" />
          )}
          <span className="truncate">{e.isVirtual ? "Virtual" : e.venue || "TBC"}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {format(new Date(e.startsAt), "HH:mm")} to {format(new Date(e.endsAt), "HH:mm")}
        </p>
      </div>
    </button>
  )
}

/** Holidays that overlap a given day, used to mark the day column. */
function holidaysOnDay(holidays: OrgHoliday[], day: Date): OrgHoliday[] {
  const dayStr = format(day, "yyyy-MM-dd")
  return holidays.filter((h) => dayStr >= h.startsOn && dayStr <= h.endsOn)
}

export default function TrainerTimetablePage() {
  const { profile, isTrainer, isAdmin, isManager } = useUser()
  const trainers = useTrainers()
  const holidays = useOrgHolidays()
  const deleteSession = useDeleteSession()

  // Admins, super admins and managers may assign and remove timetable slots.
  const canManage = isAdmin || isManager

  const [trainerId, setTrainerId] = useState<string>("")
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState<TimetableEntry | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignDate, setAssignDate] = useState<string | undefined>(undefined)

  // Default the select to the current user when they are a trainer,
  // otherwise the first trainer in the list.
  const activeTrainer =
    trainerId ||
    (isTrainer && profile?.id ? profile.id : "") ||
    trainers.data?.[0]?.id ||
    ""

  const { weekStart, weekEnd, label } = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset)
    const ws = startOfWeek(base, { weekStartsOn: 1 })
    const we = endOfWeek(base, { weekStartsOn: 1 })
    return {
      weekStart: ws,
      weekEnd: we,
      label: `${format(ws, "d MMM")} to ${format(we, "d MMM yyyy")}`,
    }
  }, [weekOffset])

  const q = useTimetable(activeTrainer, weekStart.toISOString(), weekEnd.toISOString())

  const byDay = useMemo(() => {
    const map: Record<number, TimetableEntry[]> = {}
    for (const e of q.data ?? []) {
      ;(map[e.weekday] ??= []).push(e)
    }
    return map
  }, [q.data])

  const activeTrainerName =
    trainers.data?.find((t) => t.id === activeTrainer)?.name ?? ""

  function openAssign(date?: string): void {
    setAssignDate(date)
    setAssignOpen(true)
  }

  async function handleRemove(entry: TimetableEntry): Promise<void> {
    try {
      await deleteSession.mutateAsync(entry.id)
      toast.success("Removed from timetable")
      setSelected(null)
    } catch {
      toast.error("Could not remove the session. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Trainer timetable</h1>
        <p className="mt-1 text-muted-foreground">
          Weekly schedule of sessions, by trainer. Tap a session for the full details.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={activeTrainer} onValueChange={setTrainerId}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Choose a trainer" />
          </SelectTrigger>
          <SelectContent>
            {(trainers.data ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-medium">{label}</span>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="size-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              This week
            </Button>
          )}

          {canManage && (
            <Button
              onClick={() => openAssign(undefined)}
              disabled={!activeTrainer}
              className="ml-1"
            >
              <Plus className="mr-1.5 size-4" /> Assign session
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {q.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load the timetable.</p>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {DAYS.map((day, idx) => {
            const thisDate = new Date(weekStart)
            thisDate.setDate(weekStart.getDate() + idx)
            const today = isSameDay(thisDate, new Date())
            const slots = byDay[idx] ?? []
            const dayHolidays = holidaysOnDay(holidays.data ?? [], thisDate)
            return (
              <div
                key={day}
                className={cn(
                  "space-y-3 rounded-lg p-2",
                  today ? "bg-brand-gold/10 ring-1 ring-brand-gold/40" : "bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex items-baseline justify-between border-b pb-2",
                    today ? "border-brand-gold" : "border-border",
                  )}
                >
                  <span className={cn("text-sm font-semibold", today && "text-brand-navy")}>
                    {day}
                  </span>
                  <span className="text-xs text-muted-foreground">{format(thisDate, "d MMM")}</span>
                </div>

                {/* Holiday markers render before any scheduled session. */}
                {dayHolidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-1.5 rounded-md border border-dashed border-brand-navy/30 bg-brand-navy/5 px-2.5 py-1.5 text-xs font-medium text-brand-navy"
                  >
                    <CalendarOff className="size-3.5 shrink-0" />
                    <span className="truncate">Holiday: {h.name}</span>
                  </div>
                ))}

                {q.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : slots.length === 0 ? (
                  dayHolidays.length === 0 ? (
                    canManage && activeTrainer ? (
                      <button
                        type="button"
                        onClick={() => openAssign(format(thisDate, "yyyy-MM-dd"))}
                        className="flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-8 text-center transition-colors hover:border-brand-gold hover:bg-brand-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]"
                      >
                        <Plus className="size-5 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">Assign session</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-8 text-center">
                        <CalendarRange className="size-5 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">No sessions</span>
                      </div>
                    )
                  ) : null
                ) : (
                  <div className="space-y-3">
                    {slots.map((e, i) => (
                      <SlotCard
                        key={e.id}
                        e={e}
                        tone={TONES[i % TONES.length]}
                        onOpen={() => setSelected(e)}
                      />
                    ))}
                    {canManage && activeTrainer && (
                      <button
                        type="button"
                        onClick={() => openAssign(format(thisDate, "yyyy-MM-dd"))}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-brand-gold hover:bg-brand-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]"
                      >
                        <Plus className="size-3.5" /> Add
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Session detail popup */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 font-display text-xl">
                  {selected.title}
                  <Badge variant="outline" className="gap-1">
                    {selected.isVirtual ? (
                      <Video className="size-3" />
                    ) : (
                      <MapPin className="size-3" />
                    )}
                    {selected.isVirtual ? "Virtual" : "In person"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selected.startsAt), "EEE d MMM yyyy, HH:mm")} to{" "}
                  {format(new Date(selected.endsAt), "HH:mm")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2.5 text-sm">
                {selected.courseTitle && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <BookText className="size-4 shrink-0" /> {selected.courseTitle}
                  </p>
                )}
                <p className="flex items-center gap-2 text-muted-foreground">
                  {selected.isVirtual ? (
                    <Video className="size-4 shrink-0" />
                  ) : (
                    <MapPin className="size-4 shrink-0" />
                  )}
                  {selected.isVirtual ? "Online" : selected.venue || "Venue to be confirmed"}
                </p>
                {selected.trainerName && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-4 shrink-0" /> {selected.trainerName}
                  </p>
                )}
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  {selected.booked} booked
                  {selected.capacity != null && ` of ${selected.capacity} places`}
                </p>
                <p className="text-xs capitalize text-muted-foreground">
                  Status: {selected.status.replace("_", " ")}
                </p>
                {selected.description && (
                  <p className="whitespace-pre-wrap pt-1 text-foreground">
                    {selected.description}
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                {canManage && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive sm:mr-auto"
                    disabled={deleteSession.isPending}
                    onClick={() => handleRemove(selected)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {deleteSession.isPending ? "Removing…" : "Remove from timetable"}
                  </Button>
                )}
                {selected.isVirtual && (selected.meetUrl || selected.zoomUrl) && (
                  <Button asChild variant="outline">
                    <a
                      href={selected.meetUrl || selected.zoomUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="mr-2 size-4" /> Join
                    </a>
                  </Button>
                )}
                <Button asChild>
                  <Link to={`/platform/sessions/${selected.id}`}>
                    <ExternalLink className="mr-2 size-4" /> Open session
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin/manager: assign a session to the selected trainer */}
      {canManage && activeTrainer && (
        <AssignSessionDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          trainerId={activeTrainer}
          trainerName={activeTrainerName}
          defaultDate={assignDate}
        />
      )}
    </div>
  )
}
