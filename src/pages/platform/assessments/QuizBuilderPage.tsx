import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import AuthoringHeader from "@/components/authoring/AuthoringHeader"
import QuestionDialog from "@/components/assessments/QuestionDialog"
import AiAssistButton from "@/components/ai/AiAssistButton"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import {
  assessmentFormSchema,
  type AssessmentFormValues,
  type QuestionFormValues,
} from "@/lib/validations/assessment.schema"
import {
  useAssessment,
  useCreateAssessment,
  useUpdateAssessment,
  useQuestions,
  useQuestionMutations,
  type QuestionWithOptions,
} from "@/lib/queries/assessments.queries"
import { useCourses } from "@/lib/queries/courses.queries"

const EMPTY: AssessmentFormValues = {
  title: "",
  description: "",
  course_id: "",
  pass_mark: 70,
  time_limit_mins: 0,
  max_attempts: 0,
  randomise: false,
  is_published: false,
}

export default function QuizBuilderPage() {
  const params = useParams()
  const id = params.id && params.id !== "new" ? params.id : undefined
  const isEdit = !!id
  const navigate = useNavigate()

  const courses = useCourses()
  const assessment = useAssessment(id ?? "")
  const create = useCreateAssessment()
  const update = useUpdateAssessment(id ?? "")
  const questions = useQuestions(id ?? "")
  const qMut = useQuestionMutations(id ?? "")

  const [dialog, setDialog] = useState<{ q: QuestionWithOptions | null } | null>(null)

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema) as Resolver<AssessmentFormValues>,
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (isEdit && assessment.data) {
      form.reset({
        title: assessment.data.title,
        description: assessment.data.description ?? "",
        course_id: assessment.data.course_id ?? "",
        pass_mark: assessment.data.pass_mark,
        time_limit_mins: assessment.data.time_limit_mins ?? 0,
        max_attempts: assessment.data.max_attempts ?? 0,
        randomise: assessment.data.randomise,
        is_published: assessment.data.is_published,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.data, isEdit])

  async function onSubmit(values: AssessmentFormValues) {
    try {
      if (isEdit) {
        await update.mutateAsync(values)
        toast.success("Assessment saved")
      } else {
        const newId = await create.mutateAsync(values)
        toast.success("Assessment created", { description: "Now add questions." })
        navigate(`/platform/assessments/builder/${newId}`)
      }
    } catch {
      toast.error("Could not save assessment")
    }
  }

  function handleQuestionSubmit(values: QuestionFormValues) {
    qMut.saveQuestion
      .mutateAsync({
        id: dialog?.q?.id,
        values,
        position: questions.data?.length ?? 0,
      })
      .then(() => {
        toast.success(dialog?.q ? "Question updated" : "Question added")
        setDialog(null)
      })
      .catch(() => toast.error("Could not save question"))
  }

  const saving = create.isPending || update.isPending

  function questionToForm(q: QuestionWithOptions): QuestionFormValues {
    return {
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      options: q.options.map((o) => ({ label: o.label, is_correct: o.is_correct })),
    }
  }

  if (isEdit && assessment.isLoading) {
    return (
      <div className="space-y-6">
        <AuthoringHeader />
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AuthoringHeader />
      <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/assessments/builder">
          <ArrowLeft className="mr-1.5 size-4" /> Back to assessments
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">
            {isEdit ? "Edit assessment" : "New assessment"}
          </CardTitle>
          <CardDescription>Quiz settings and pass criteria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex justify-end">
                <AiFieldsButton
                  subject="a healthcare training assessment"
                  context={`Working title: ${form.getValues("title") || "(none)"}`}
                  fields={[
                    { key: "title", label: "Title", format: "text" },
                    { key: "description", label: "Description", format: "text" },
                  ]}
                  onApply={(v) => {
                    if (v.title) form.setValue("title", v.title.slice(0, 120))
                    if (v.description) form.setValue("description", v.description)
                  }}
                />
              </div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Moving and Handling — knowledge check" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional instructions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="course_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linked course (optional)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Standalone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Standalone</SelectItem>
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
                  name="pass_mark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pass mark (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time_limit_mins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time limit (mins, 0 = none)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max attempts (0 = unlimited)</FormLabel>
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
                  name="randomise"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Randomise questions</FormLabel>
                        <FormDescription>Shuffle order per attempt</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Published</FormLabel>
                        <FormDescription>Available to learners</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button asChild variant="outline" type="button">
                  <Link to="/platform/assessments/builder">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Save" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Build the question bank.</CardDescription>
            </div>
            <div className="flex gap-2">
              <AiAssistButton
                task="quiz questions for this assessment"
                context={`Assessment: ${form.getValues("title")}`}
                label="Suggest questions"
              />
              <Button size="sm" onClick={() => setDialog({ q: null })}>
                <Plus className="mr-1.5 size-4" /> Add question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : questions.isError ? (
              <div className="py-6 text-center">
                <AlertCircle className="mx-auto size-7 text-destructive" />
                <p className="mt-2 text-sm text-muted-foreground">Could not load questions.</p>
              </div>
            ) : (questions.data?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No questions yet. Add your first question.
              </p>
            ) : (
              <ol className="space-y-2">
                {questions.data!.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3"
                  >
                    <span className="text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {q.type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{q.points} pts</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Edit question"
                        onClick={() => setDialog({ q })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label="Delete question"
                        onClick={() =>
                          qMut.deleteQuestion
                            .mutateAsync(q.id)
                            .then(() => toast.success("Question deleted"))
                            .catch(() => toast.error("Could not delete"))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {dialog && (
        <QuestionDialog
          key={dialog.q?.id ?? "new"}
          open
          onOpenChange={(v) => !v && setDialog(null)}
          initial={dialog.q ? questionToForm(dialog.q) : undefined}
          onSubmit={handleQuestionSubmit}
          saving={qMut.saveQuestion.isPending}
        />
      )}
      </div>
    </div>
  )
}
