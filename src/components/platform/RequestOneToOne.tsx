import { useState } from "react"
import { toast } from "sonner"
import { Loader2, LifeBuoy, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import {
  useO2OEligibility,
  useCreateOneToOne,
} from "@/lib/queries/one-to-one.queries"

interface Props {
  courseId: string
  courseTitle: string
}

/**
 * Gated "Request 1:1 help" action for a course.
 *
 * Learners may only request a 1:1 once they have ATTEMPTED the course and are
 * struggling: enrolled AND (a failing assessment attempt OR progress stalled
 * below 100%). The dialog asks for a short reason, which is required so the
 * trainer knows what to focus on. Staff do not see this action.
 */
export default function RequestOneToOne({ courseId, courseTitle }: Props): React.ReactElement | null {
  const { user } = useAuth()
  const { isLearner } = useUser()
  const eligibility = useO2OEligibility(courseId, user?.id)
  const create = useCreateOneToOne(user?.id)

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [preferred, setPreferred] = useState("")

  // Only learners request 1:1 help.
  if (!isLearner) return null

  const data = eligibility.data
  // Hide entirely until the learner has started the course. The gate opens once
  // they are struggling (failed attempt or stalled progress).
  if (!data || !data.enrolled || !data.started) return null
  if (!data.eligible) return null

  function submit(): void {
    if (!reason.trim()) {
      toast.error("Tell us what you are struggling with first.")
      return
    }
    create
      .mutateAsync({
        courseId,
        preferredAt: preferred,
        note: reason.trim(),
      })
      .then(() => {
        toast.success("Request sent for approval")
        setReason("")
        setPreferred("")
        setOpen(false)
      })
      .catch(() => toast.error("Could not send request"))
  }

  const hint = data.failedAttempt
    ? "Your last assessment attempt did not pass. A trainer can help."
    : "You have started this course but not finished. A trainer can help."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <LifeBuoy className="mr-2 size-4" /> Request 1:1 help
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request 1:1 help</DialogTitle>
          <DialogDescription>
            One-to-one time with a trainer for {courseTitle}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-brand-navy/60" />
            {hint}
          </p>
          <div>
            <Label htmlFor="o2o-reason" className="mb-1.5 block text-xs">
              What are you struggling with?
            </Label>
            <Textarea
              id="o2o-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe where you are stuck so the trainer can prepare."
            />
          </div>
          <div>
            <Label htmlFor="o2o-when" className="mb-1.5 block text-xs">
              Preferred date and time (optional)
            </Label>
            <DateTimePicker
              id="o2o-when"
              value={preferred}
              onChange={setPreferred}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || !reason.trim()}>
            {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
