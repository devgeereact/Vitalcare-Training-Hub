import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format, isPast } from "date-fns"
import { toast } from "sonner"
import {
  CalendarOff,
  AlertCircle,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Flag,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { getUpcomingHolidays } from "@/lib/integrations/holidays"
import {
  useOrgHolidays,
  useOrgHolidayMutations,
} from "@/lib/queries/calendar.queries"
import type { OrgHoliday } from "@/lib/queries/calendar.queries"

function fmtDay(iso: string): string {
  return format(new Date(`${iso}T00:00:00`), "EEE d MMM yyyy")
}

export default function HolidaysPage() {
  const { user } = useAuth()
  const { isAdmin, isManager, isTrainer } = useUser()
  const canManage = isAdmin || isManager || isTrainer

  const org = useOrgHolidays()
  const mut = useOrgHolidayMutations()

  const publicHols = useQuery({
    queryKey: ["holidays", "GB", "list"],
    queryFn: () => getUpcomingHolidays("GB"),
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })

  const [editing, setEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [fName, setFName] = useState("")
  const [fStart, setFStart] = useState("")
  const [fEnd, setFEnd] = useState("")
  const [fNotes, setFNotes] = useState("")

  function openNew() {
    setEditId(null)
    setFName("")
    const today = format(new Date(), "yyyy-MM-dd")
    setFStart(today)
    setFEnd(today)
    setFNotes("")
    setEditing(true)
  }

  function openEdit(h: OrgHoliday) {
    setEditId(h.id)
    setFName(h.name)
    setFStart(h.startsOn)
    setFEnd(h.endsOn)
    setFNotes(h.notes ?? "")
    setEditing(true)
  }

  function save() {
    if (!fName.trim() || !fStart || !user?.id) return
    const payload = {
      name: fName,
      startsOn: fStart,
      endsOn: fEnd || fStart,
      notes: fNotes,
    }
    const op = editId
      ? mut.update.mutateAsync({ id: editId, ...payload })
      : mut.create.mutateAsync({ ...payload, createdBy: user.id })
    op
      .then(() => {
        toast.success(editId ? "Holiday updated" : "Holiday added")
        setEditing(false)
      })
      .catch(() => toast.error("Could not save the holiday"))
  }

  const saving = mut.create.isPending || mut.update.isPending

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Holidays</h1>
          <p className="mt-1 text-muted-foreground">
            Public holidays and your own closures. All of these show on the calendar and
            timetable.
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="mr-2 size-4" /> Add closure
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/platform/calendar">
              <CalendarDays className="mr-2 size-4" /> Calendar
            </Link>
          </Button>
        </div>
      </div>

      {/* Organisation closures (editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="size-4 text-brand-gold" /> Company closures
          </CardTitle>
          <CardDescription>
            Days your organisation is closed or rooms are unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {org.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : org.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load closures.</p>
              <Button variant="outline" size="sm" onClick={() => org.refetch()}>
                Retry
              </Button>
            </div>
          ) : (org.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CalendarOff className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No closures added yet.</p>
              {canManage && (
                <Button size="sm" onClick={openNew}>
                  Add a closure
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {org.data!.map((h) => {
                const multiDay = h.startsOn !== h.endsOn
                const past = isPast(new Date(`${h.endsOn}T23:59:59`))
                return (
                  <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
                      <CalendarOff className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDay(h.startsOn)}
                        {multiDay && ` – ${fmtDay(h.endsOn)}`}
                        {h.notes && ` · ${h.notes}`}
                      </p>
                    </div>
                    {past && (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Past
                      </Badge>
                    )}
                    {canManage && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit closure"
                          onClick={() => openEdit(h)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete closure"
                          className="text-destructive"
                          onClick={() =>
                            mut.remove
                              .mutateAsync(h.id)
                              .then(() => toast.success("Closure removed"))
                              .catch(() => toast.error("Could not remove"))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* UK public holidays (read-only from Nager.Date) */}
      <Card>
        <CardHeader>
          <CardTitle>United Kingdom public holidays</CardTitle>
          <CardDescription>Sourced automatically. These cannot be edited.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {publicHols.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : publicHols.isError || !publicHols.data ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load public holidays. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => publicHols.refetch()}>
                Retry
              </Button>
            </div>
          ) : publicHols.data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CalendarOff className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No public holidays found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {publicHols.data.map((h) => {
                const past = isPast(new Date(`${h.date}T23:59:59`))
                return (
                  <li
                    key={`${h.date}-${h.name}`}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <CalendarOff className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.name}</span>
                    {past && (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Past
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{fmtDay(h.date)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add / edit closure */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit closure" : "Add closure"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs">Name</Label>
              <Input
                placeholder="e.g. Office closed for staff training"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs">Starts</Label>
                <Input
                  type="date"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Ends</Label>
                <Input
                  type="date"
                  value={fEnd}
                  min={fStart || undefined}
                  onChange={(e) => setFEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Notes (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Anything the team should know"
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!fName.trim() || !fStart || saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editId ? "Save" : "Add closure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
