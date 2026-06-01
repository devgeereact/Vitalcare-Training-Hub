import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"

import AiAssistButton from "@/components/ai/AiAssistButton"
import { sessionFormSchema, type SessionFormValues } from "@/lib/validations/session.schema"
import {
  useSession,
  useCreateSession,
  useUpdateSession,
  useTrainers,
} from "@/lib/queries/sessions.queries"
import { useCourses } from "@/lib/queries/courses.queries"

function toLocal(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

const EMPTY: SessionFormValues = {
  title: "",
  description: "",
  course_id: "",
  trainer_id: "",
  starts_at: "",
  ends_at: "",
  venue: "",
  capacity: 0,
  is_virtual: false,
  is_public: false,
}

export default function SessionFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const courses = useCourses()
  const trainers = useTrainers()
  const session = useSession(id ?? "")
  const create = useCreateSession()
  const update = useUpdateSession(id ?? "")

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema) as Resolver<SessionFormValues>,
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (isEdit && session.data) {
      form.reset({
        title: session.data.title,
        description: session.data.description ?? "",
        course_id: session.data.course_id ?? "",
        trainer_id: session.data.trainer_id ?? "",
        starts_at: toLocal(session.data.starts_at),
        ends_at: toLocal(session.data.ends_at),
        venue: session.data.venue ?? "",
        capacity: session.data.capacity ?? 0,
        is_virtual: session.data.is_virtual,
        is_public: session.data.is_public,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.data, isEdit])

  async function onSubmit(values: SessionFormValues) {
    try {
      if (isEdit) {
        await update.mutateAsync(values)
        toast.success("Session saved")
        navigate(`/platform/sessions/${id}`)
      } else {
        const newId = await create.mutateAsync(values)
        toast.success("Session created")
        navigate(`/platform/sessions/${newId}`)
      }
    } catch {
      toast.error("Could not save session")
    }
  }

  const saving = create.isPending || update.isPending

  if (isEdit && session.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/sessions">
          <ArrowLeft className="mr-1.5 size-4" /> Back to sessions
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {isEdit ? "Edit session" : "New session"}
          </CardTitle>
          <CardDescription>
            Zoom and Google Calendar links are added automatically once those
            integrations are connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Basic Life Support — practical" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <AiAssistButton
                        task="a training session description"
                        context={`Session title: ${form.getValues("title")}`}
                        onInsert={(text) => field.onChange(text)}
                      />
                    </div>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                <FormField
                  control={form.control}
                  name="course_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course (optional)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
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
                <FormField
                  control={form.control}
                  name="trainer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer (optional)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(trainers.data ?? []).map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="Room 2 / Zoom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
              <div className="flex flex-wrap gap-6">
                <FormField
                  control={form.control}
                  name="is_virtual"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Virtual session</FormLabel>
                        <FormDescription>Runs online (Zoom)</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Public</FormLabel>
                        <FormDescription>Show on the public events page</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button asChild variant="outline" type="button">
                  <Link to="/platform/sessions">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Save session" : "Create session"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
