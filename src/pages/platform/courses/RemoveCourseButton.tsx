import { useState } from "react"
import { AlertTriangle, Archive, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useArchiveCourse,
  useCourseDeletionImpact,
  useDeleteCoursePermanently,
} from "@/lib/queries/courses.queries"
import { ErrorState } from "@/components/common/DataState"
import { useUser } from "@/hooks/use-user"

/**
 * Remove a course from the catalogue.
 *
 * Archiving is the default and, for any course a learner has touched, the only
 * option. Certificates, assessment results and invoices all reference the
 * course; deleting it would leave a certificate that evidences a course nobody
 * can look up, which for CSTF and CPD records is worse than useless. Archiving
 * withdraws the course and unpublishes its assessments while keeping every
 * record readable.
 *
 * Permanent deletion is offered only for a course with no enrolments, no
 * certificates, no orders and no sessions: the mis-created course this workflow
 * exists for. The server re-checks that before deleting anything, so a stale
 * dialogue cannot talk it into removing live records.
 */
export default function RemoveCourseButton({
  id,
  title,
}: {
  id: string
  title: string
}) {
  const { isAdmin } = useUser()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const impact = useCourseDeletionImpact(open ? id : null)
  const archive = useArchiveCourse()
  const remove = useDeleteCoursePermanently()

  // Only administrators may remove a course. The server enforces this too; the
  // button is hidden so a trainer is not offered an action that will be refused.
  if (!isAdmin) return null

  const busy = archive.isPending || remove.isPending
  const canHardDelete = impact.data?.canHardDelete === true
  const confirmed = confirmText.trim().toLowerCase() === "delete"

  function close() {
    setOpen(false)
    setConfirmText("")
  }

  async function onArchive() {
    try {
      const ok = await archive.mutateAsync(id)
      if (ok) toast.success(`"${title}" archived`)
      else toast.error("That course could not be archived")
      close()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive the course")
    }
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(id)
      toast.success(`"${title}" deleted`)
      close()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete the course",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${title}`}
          title="Archive or delete"
        >
          <Archive className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Remove "{title}"</DialogTitle>
          <DialogDescription>
            Check what depends on this course before you remove it.
          </DialogDescription>
        </DialogHeader>

        {impact.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : impact.isError ? (
          <ErrorState
            error={impact.error}
            resource="this course's records"
            onRetry={impact.refetch}
          />
        ) : impact.data ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              {(
                [
                  ["Enrolled learners", impact.data.enrolments],
                  ["Certificates issued", impact.data.certificates],
                  ["Assessments", impact.data.assessments],
                  ["Orders", impact.data.orders],
                  ["Scheduled sessions", impact.data.sessions],
                  ["Resources", impact.data.resources],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            {canHardDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nobody has used this course, so it can be removed for good.
                  Archiving keeps it out of the catalogue while leaving it
                  recoverable, and is the safer choice if you are unsure.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-delete" className="text-sm">
                    Type <span className="font-mono font-semibold">delete</span> to
                    confirm permanent removal
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    autoComplete="off"
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="delete"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/[0.06] p-3 text-sm">
                <AlertTriangle
                  className="size-5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <p className="text-foreground">
                  Learners have used this course, so it cannot be deleted.
                  Archiving withdraws it from the catalogue and stops new
                  enrolments. Certificates, results and invoices stay exactly as
                  they are, which is what a training record has to do.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onArchive}
            disabled={busy || impact.isLoading || impact.isError}
          >
            {archive.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Archive className="mr-1.5 size-4" />
            )}
            Archive
          </Button>
          {canHardDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={busy || !confirmed}
            >
              {remove.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 size-4" />
              )}
              Delete permanently
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
