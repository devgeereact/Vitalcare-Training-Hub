import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useRecordTraining } from "@/lib/queries/compliance.queries"

export interface RecordTarget {
  staffId: string
  staffName: string
  courseId: string
  courseTitle: string
  renewalMonths: number | null
}

const schema = z.object({
  completedOn: z.string().min(1, "Enter the date completed."),
  notes: z.string().max(500).optional(),
})
type Values = z.infer<typeof schema>

/** Today as yyyy-mm-dd for the date input default. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function RecordTrainingDialog({
  target,
  onClose,
}: {
  target: RecordTarget | null
  onClose: () => void
}) {
  const record = useRecordTraining()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { completedOn: today(), notes: "" },
  })

  // Reset the form each time a new cell is opened.
  useEffect(() => {
    if (target) form.reset({ completedOn: today(), notes: "" })
  }, [target, form])

  async function onSubmit(values: Values): Promise<void> {
    if (!target) return
    try {
      await record.mutateAsync({
        staffId: target.staffId,
        courseId: target.courseId,
        completedOn: values.completedOn,
        renewalMonths: target.renewalMonths,
        notes: values.notes || null,
      })
      toast.success("Training recorded", {
        description: `${target.courseTitle} for ${target.staffName}.`,
      })
      onClose()
    } catch (err) {
      toast.error("Could not save", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record training</DialogTitle>
          <DialogDescription>
            {target
              ? `${target.courseTitle} for ${target.staffName}.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="completedOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date completed</FormLabel>
                  <FormControl>
                    <Input type="date" max={today()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Any detail to log" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={record.isPending}>
                {record.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
