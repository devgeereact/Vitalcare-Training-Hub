import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Users,
  AlertCircle,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import {
  useOneToOnes,
  useCreateOneToOne,
  useDecideOneToOne,
  type O2ORow,
} from "@/lib/queries/one-to-one.queries"
import { useCourses } from "@/lib/queries/courses.queries"
import { useTrainers } from "@/lib/queries/trainers.queries"
import type { OneToOneStatus } from "@/types/database.types"

const STATUS_STYLE: Record<OneToOneStatus, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  declined: "bg-destructive/15 text-destructive",
  completed: "bg-muted text-muted-foreground",
}

function ApproveDialog({ row, deciderId }: { row: O2ORow; deciderId?: string }) {
  const decide = useDecideOneToOne(deciderId)
  const trainers = useTrainers()
  const [open, setOpen] = useState(false)
  const [trainerId, setTrainerId] = useState(row.trainer_id ?? "")
  const [when, setWhen] = useState("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CheckCircle2 className="mr-1.5 size-4" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve 1:1 session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Trainer</Label>
            <Select value={trainerId} onValueChange={setTrainerId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign a trainer" />
              </SelectTrigger>
              <SelectContent>
                {(trainers.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Date &amp; time</Label>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
            {row.preferred_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Learner prefers {format(new Date(row.preferred_at), "EEE d MMM, HH:mm")}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!trainerId || !when || decide.isPending}
            onClick={() =>
              decide
                .mutateAsync({
                  id: row.id,
                  approve: true,
                  trainerId,
                  scheduledAt: when,
                  title: row.courseTitle ?? "1:1 session",
                })
                .then(() => {
                  toast.success("Approved and scheduled")
                  setOpen(false)
                })
                .catch((e) => toast.error(e instanceof Error ? e.message : "Could not approve"))
            }
          >
            {decide.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function OneToOnePage() {
  const { user } = useAuth()
  const { isAdmin, profile } = useUser()
  const { data, isLoading, isError, refetch } = useOneToOnes(user?.id, isAdmin)
  const create = useCreateOneToOne(user?.id)
  const decline = useDecideOneToOne(profile?.id)
  const courses = useCourses()

  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState("none")
  const [preferred, setPreferred] = useState("")
  const [note, setNote] = useState("")

  function request() {
    if (!user?.id) return
    create
      .mutateAsync({
        courseId: courseId === "none" ? null : courseId,
        preferredAt: preferred,
        note,
      })
      .then(() => {
        toast.success("Request sent for approval")
        setCourseId("none")
        setPreferred("")
        setNote("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not send request"))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">1:1 sessions</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin
              ? "Approve learner requests and assign a trainer and time."
              : "Request one-to-one time with a trainer for a course."}
          </p>
        </div>
        {!isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Request 1:1
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a 1:1 session</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General</SelectItem>
                      {(courses.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Preferred date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={preferred}
                    onChange={(e) => setPreferred(e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="What would you like help with?"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={request} disabled={create.isPending}>
                  {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Send request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load 1:1 sessions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "No requests yet." : "No 1:1 sessions yet. Request one above."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data!.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {r.courseTitle ?? "General 1:1"}
                  </CardTitle>
                  <Badge variant="secondary" className={STATUS_STYLE[r.status]}>
                    {r.status}
                  </Badge>
                </div>
                <CardDescription>
                  {isAdmin || r.trainer_id === user?.id
                    ? `Learner: ${r.learnerName}`
                    : r.trainerName
                    ? `Trainer: ${r.trainerName}`
                    : "Awaiting approval"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.note && <p className="text-sm text-muted-foreground">{r.note}</p>}
                <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {r.scheduled_at ? (
                    <span className="flex items-center gap-1 text-success">
                      <Clock className="size-3.5" />
                      {format(new Date(r.scheduled_at), "EEE d MMM yyyy, HH:mm")}
                    </span>
                  ) : r.preferred_at ? (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> prefers{" "}
                      {format(new Date(r.preferred_at), "EEE d MMM, HH:mm")}
                    </span>
                  ) : null}
                </p>
                {isAdmin && r.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <ApproveDialog row={r} deciderId={profile?.id} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        decline
                          .mutateAsync({ id: r.id, approve: false, title: r.courseTitle ?? "1:1" })
                          .then(() => toast.success("Declined"))
                          .catch(() => toast.error("Could not decline"))
                      }
                    >
                      <XCircle className="mr-1.5 size-4" /> Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
