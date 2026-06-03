import type React from "react"
import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { sessionFormSchema, type SessionFormValues } from "@/lib/validations/session.schema"
import { useCreateSession } from "@/lib/queries/sessions.queries"
import { useCourses } from "@/lib/queries/courses.queries"

interface AssignSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The trainer this session is assigned to. trainer_id is forced to this. */
  trainerId: string
  trainerName: string
  /** Pre-fill the start/end for this day (yyyy-MM-dd), e.g. a clicked cell. */
  defaultDate?: string
}

/** A sensible default start of 09:00 for a chosen day, end at 10:00. */
function defaultTimes(date?: string): { starts_at: string; ends_at: string } {
  if (!date) return { starts_at: "", ends_at: "" }
  return { starts_at: `${date}T09:00`, ends_at: `${date}T10:00` }
}

/**
 * Admin/manager dialog to assign a training session to a specific trainer.
 * Reuses the standard session create flow but locks the trainer to the one
 * whose timetable is being managed.
 */
export default function AssignSessionDialog({
  open,
  onOpenChange,
  trainerId,
  trainerName,
  defaultDate,
}: AssignSessionDialogProps): React.ReactElement {
  const courses = useCourses()
  const create = useCreateSession()

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema) as Resolver<SessionFormValues>,
    defaultValues: {
      title: "",
      description: "",
      course_id: "",
      trainer_id: trainerId,
      ...defaultTimes(defaultDate),
      venue: "",
      capacity: 0,
      is_virtual: false,
      is_public: false,
      meeting_provider: "google_meet",
    },
  })

  // Reset the form each time the dialog opens so the day and trainer are fresh.
  useEffect(() => {
    if (open) {
      const times = defaultTimes(defaultDate)
      form.reset({
        title: "",
        description: "",
        course_id: "",
        trainer_id: trainerId,
        starts_at: times.starts_at,
        ends_at: times.ends_at,
        venue: "",
        capacity: 0,
        is_virtual: false,
        is_public: false,
        meeting_provider: "google_meet",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, trainerId])

  async function onSubmit(values: SessionFormValues): Promise<void> {
    try {
      // Force the trainer to the timetable owner regardless of form state.
      await create.mutateAsync({ ...values, trainer_id: trainerId })
      toast.success("Added to timetable")
      onOpenChange(false)
    } catch {
      toast.error("Could not add the session. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Assign session</DialogTitle>
          <DialogDescription>
            Adds a session to {trainerName || "this trainer"}'s timetable. Meeting
            links are generated automatically for virtual sessions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Basic Life Support, practical" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course (optional)</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(courses.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        form.watch("is_virtual") ? "Online" : "Room 2, Training Centre"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (0 = unlimited)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_virtual"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel>Virtual</FormLabel>
                      <FormDescription>Runs online with a link</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("is_virtual") && (
              <FormField
                control={form.control}
                name="meeting_provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting provider</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="google_meet">Google Meet</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Any details for the trainer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Adding…" : "Add to timetable"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
