import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
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
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"
import { useTrainers, useTimetable } from "@/lib/queries/sessions.queries"
import type { TimetableEntry } from "@/lib/queries/sessions.queries"

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

function SlotCard({ e, tone }: { e: TimetableEntry; tone: string }) {
  return (
    <Link
      to={`/platform/sessions/${e.id}`}
      className={cn(
        "block rounded-md border border-border border-l-4 p-3 text-sm transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]",
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
          {format(new Date(e.startsAt), "HH:mm")} – {format(new Date(e.endsAt), "HH:mm")}
        </p>
      </div>
    </Link>
  )
}

export default function TrainerTimetablePage() {
  const { profile, isTrainer } = useUser()
  const trainers = useTrainers()

  const [trainerId, setTrainerId] = useState<string>("")
  const [weekOffset, setWeekOffset] = useState(0)

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
      label: `${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Trainer timetable</h1>
        <p className="mt-1 text-muted-foreground">
          Weekly schedule of sessions, by trainer.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {DAYS.map((day, idx) => {
            const thisDate = new Date(weekStart)
            thisDate.setDate(weekStart.getDate() + idx)
            const today = isSameDay(thisDate, new Date())
            const slots = byDay[idx] ?? []
            return (
              <div key={day} className="space-y-3">
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

                {q.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border py-8 text-center">
                    <CalendarRange className="size-5 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">No sessions</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slots.map((e, i) => (
                      <SlotCard key={e.id} e={e} tone={TONES[i % TONES.length]} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
