import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Loader2, Trash2, ChevronRight, ChevronLeft } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useDepartmentMembers,
  useDepartmentTasks,
  useDepartmentTaskMutations,
  type DepartmentTaskStatus,
  type DepartmentTaskRow,
} from "@/lib/queries/org.queries"

const COLUMNS: { key: DepartmentTaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
]

const NEXT: Record<DepartmentTaskStatus, DepartmentTaskStatus | null> = {
  todo: "doing",
  doing: "done",
  done: null,
}
const PREV: Record<DepartmentTaskStatus, DepartmentTaskStatus | null> = {
  todo: null,
  doing: "todo",
  done: "doing",
}

interface Props {
  departmentId: string
  createdBy: string | null
}

/** Simple per-department task board: members collaborate on tasks. */
export default function DepartmentBoard({ departmentId, createdBy }: Props) {
  const members = useDepartmentMembers(departmentId)
  const tasks = useDepartmentTasks(departmentId)
  const mut = useDepartmentTaskMutations(departmentId)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignee, setAssignee] = useState("")
  const [dueDate, setDueDate] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setAssignee("")
    setDueDate("")
  }

  function createTask() {
    if (!title.trim()) return
    mut.createTask
      .mutateAsync({
        title,
        description,
        assigneeId: assignee || null,
        dueDate: dueDate || null,
        createdBy,
      })
      .then(() => {
        toast.success("Task added")
        resetForm()
        setOpen(false)
      })
      .catch(() => toast.error("Could not add task. Please try again."))
  }

  function move(task: DepartmentTaskRow, status: DepartmentTaskStatus) {
    mut.updateTask
      .mutateAsync({ id: task.id, status })
      .catch(() => toast.error("Could not move task"))
  }

  function removeTask(id: string) {
    mut.deleteTask
      .mutateAsync(id)
      .then(() => toast.success("Task removed"))
      .catch(() => toast.error("Could not remove task"))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Task board</CardTitle>
          <CardDescription>
            Plan and track work with this department's members.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 size-4" /> Add task
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((c) => (
              <Skeleton key={c.key} className="h-40 w-full" />
            ))}
          </div>
        ) : tasks.isError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load tasks. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => tasks.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => {
              const items = (tasks.data ?? []).filter((t) => t.status === col.key)
              return (
                <div key={col.key} className="rounded-xl bg-muted/50 p-3">
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label} ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <p className="px-1 py-3 text-xs text-muted-foreground">
                        Nothing here yet.
                      </p>
                    ) : (
                      items.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-border bg-background p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{t.title}</p>
                            <button
                              type="button"
                              onClick={() => removeTask(t.id)}
                              aria-label="Remove task"
                              className="rounded text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          {t.description && (
                            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                              {t.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            {t.assigneeName && <span>{t.assigneeName}</span>}
                            {t.dueDate && (
                              <span>
                                Due {format(new Date(t.dueDate), "d MMM")}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <button
                              type="button"
                              disabled={!PREV[t.status]}
                              onClick={() =>
                                PREV[t.status] && move(t, PREV[t.status]!)
                              }
                              aria-label="Move back"
                              className="rounded p-0.5 text-muted-foreground enabled:hover:text-brand-navy disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]"
                            >
                              <ChevronLeft className="size-4" />
                            </button>
                            <button
                              type="button"
                              disabled={!NEXT[t.status]}
                              onClick={() =>
                                NEXT[t.status] && move(t, NEXT[t.status]!)
                              }
                              aria-label="Move forward"
                              className="rounded p-0.5 text-muted-foreground enabled:hover:text-brand-navy disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(members.data ?? []).length === 0 ? (
                  <SelectItem value="none" disabled>
                    No members yet
                  </SelectItem>
                ) : (
                  members.data!.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createTask}
              disabled={!title.trim() || mut.createTask.isPending}
            >
              {mut.createTask.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Add task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
