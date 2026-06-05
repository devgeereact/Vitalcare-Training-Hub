import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, Plus } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCourses } from "@/lib/queries/courses.queries"
import {
  useMandatoryCourses,
  useSetRequirement,
  useRemoveRequirement,
} from "@/lib/queries/compliance.queries"

/** Manage which courses are mandatory for staff and their renewal interval. */
export default function RequirementsDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const courses = useCourses()
  const mandatory = useMandatoryCourses()
  const setReq = useSetRequirement()
  const removeReq = useRemoveRequirement()

  const [courseId, setCourseId] = useState("")
  const [months, setMonths] = useState("12")

  const mandatoryIds = new Set((mandatory.data ?? []).map((m) => m.courseId))
  const available = (courses.data ?? []).filter((c) => !mandatoryIds.has(c.id))

  async function add(): Promise<void> {
    if (!courseId) {
      toast.error("Choose a course first.")
      return
    }
    const parsed = months.trim() === "" ? null : Number(months)
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      toast.error("Renewal months must be a positive number, or blank for none.")
      return
    }
    try {
      await setReq.mutateAsync({ courseId, renewalMonths: parsed })
      toast.success("Course marked as mandatory")
      setCourseId("")
      setMonths("12")
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      await removeReq.mutateAsync(id)
      toast.success("Removed from mandatory")
    } catch (err) {
      toast.error("Could not remove", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mandatory courses</DialogTitle>
          <DialogDescription>
            Choose the courses every staff member must hold, and how often each
            must be renewed. Leave months blank for training that does not
            expire.
          </DialogDescription>
        </DialogHeader>

        {/* Add row */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Course
            </label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Renewal (months)
            </label>
            <Input
              type="number"
              min={0}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="None"
            />
          </div>
          <Button onClick={add} disabled={setReq.isPending}>
            {setReq.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>

        {/* Current list */}
        <div className="mt-2 space-y-1">
          {mandatory.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (mandatory.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              No mandatory courses set yet.
            </p>
          ) : (
            mandatory.data?.map((m) => (
              <div
                key={m.courseId}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm font-medium">{m.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {m.renewalMonths === null
                      ? "No renewal"
                      : `Every ${m.renewalMonths} months`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(m.courseId)}
                    disabled={removeReq.isPending}
                    aria-label={`Remove ${m.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
