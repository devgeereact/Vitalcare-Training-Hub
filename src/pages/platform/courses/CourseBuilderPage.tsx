import { useEffect, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, GraduationCap, ListTree, Eye } from "lucide-react"

import CoursePreviewDialog from "@/components/courses/CoursePreviewDialog"

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

import AuthoringHeader from "@/components/authoring/AuthoringHeader"
import RichTextEditor from "@/components/courses/RichTextEditor"
import { markdownToHtml, looksLikeMarkdown } from "@/components/courses/markdown"
import AiAssistButton from "@/components/ai/AiAssistButton"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import CurriculumBuilder from "@/components/courses/CurriculumBuilder"
import MediaUpload from "@/components/courses/MediaUpload"
import CourseExtrasEditor from "@/components/courses/CourseExtrasEditor"
import CourseMaterialsEditor from "@/components/courses/CourseMaterialsEditor"
import SaveToDriveButton from "@/components/courses/SaveToDriveButton"
import ImportCurriculumDialog from "@/components/courses/ImportCurriculumDialog"
import {
  courseFormSchema,
  type CourseFormValues,
} from "@/lib/validations/course.schema"
import {
  useCategories,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useCurriculum,
} from "@/lib/queries/courses.queries"
import { curriculumReadiness } from "@/lib/courses/readiness"

const EMPTY: CourseFormValues = {
  title: "",
  summary: "",
  description: "",
  category_id: "",
  is_cstf_aligned: false,
  cpd_hours: 0,
  duration_mins: 0,
  is_published: false,
  thumbnail_url: "",
}

export default function CourseBuilderPage() {
  const params = useParams()
  const id = params.id && params.id !== "new" ? params.id : undefined
  const isEdit = !!id
  const navigate = useNavigate()

  const categories = useCategories()
  const course = useCourse(id ?? "")
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse(id ?? "")

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as Resolver<CourseFormValues>,
    defaultValues: EMPTY,
  })
  const [previewOpen, setPreviewOpen] = useState(false)

  // Readiness drives publish-gating: a course with empty modules or lessons
  // missing content cannot be flipped to published.
  const curriculum = useCurriculum(id ?? "")
  const readiness = curriculumReadiness(curriculum.data ?? [])
  const wantsPublish = form.watch("is_published")

  useEffect(() => {
    if (isEdit && course.data) {
      form.reset({
        title: course.data.title,
        summary: course.data.summary ?? "",
        description: course.data.description ?? "",
        category_id: course.data.category_id ?? "",
        is_cstf_aligned: course.data.is_cstf_aligned,
        cpd_hours: course.data.cpd_hours,
        duration_mins: course.data.duration_mins,
        is_published: course.data.is_published,
        thumbnail_url: course.data.thumbnail_url ?? "",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.data, isEdit])

  async function onSubmit(values: CourseFormValues) {
    // Block publishing a course whose curriculum is not ready.
    if (isEdit && values.is_published && !readiness.ready) {
      toast.error("Cannot publish yet", {
        description: readiness.parts.join(", ") || "Add curriculum content first.",
      })
      return
    }
    try {
      if (isEdit) {
        await updateCourse.mutateAsync(values)
        toast.success("Course saved")
      } else {
        const newId = await createCourse.mutateAsync(values)
        toast.success("Course created", { description: "Now add your curriculum." })
        navigate(`/platform/courses/builder/${newId}`)
      }
    } catch {
      toast.error("Could not save course")
    }
  }

  const saving = createCourse.isPending || updateCourse.isPending

  if (isEdit && course.isLoading) {
    return (
      <div className="space-y-6">
        <AuthoringHeader />
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }
  if (isEdit && course.isError) {
    return (
      <div className="space-y-6">
        <AuthoringHeader />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load this course.</p>
          <Button variant="outline" size="sm" onClick={() => course.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <AuthoringHeader />
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/platform/courses/manage">
              <ArrowLeft className="mr-1.5 size-4" /> Back to courses
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isEdit && <SaveToDriveButton courseId={id!} />}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="mr-1.5 size-4" /> Preview
            </Button>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <GraduationCap className="size-6 text-brand-navy" />
            {isEdit ? "Edit course" : "New course"}
          </CardTitle>
          <CardDescription>
            CSTF-aligned, CPD-accredited training content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex justify-end">
                <AiFieldsButton
                  subject="a healthcare training course"
                  context={`Working title: ${form.getValues("title") || "(none)"}`}
                  fields={[
                    { key: "title", label: "Title", format: "text" },
                    { key: "summary", label: "Summary", format: "text" },
                    // Keep as raw text so we can parse Markdown (headings,
                    // lists, bold) into formatted editor blocks ourselves.
                    { key: "description", label: "Description", format: "text" },
                  ]}
                  onApply={(v) => {
                    if (v.title) form.setValue("title", v.title.slice(0, 120))
                    if (v.summary) form.setValue("summary", v.summary.slice(0, 300))
                    if (v.description) form.setValue("description", markdownToHtml(v.description))
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
                      <Input placeholder="Moving and Handling" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="thumbnail_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured image</FormLabel>
                    <FormControl>
                      <MediaUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        variant="image"
                        accept="image/*"
                        folder="courses"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="One-line overview" {...field} />
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
                        task="a course description"
                        context={`Course title: ${form.getValues("title")}\nSummary: ${form.getValues("summary")}`}
                        onInsert={(text) =>
                          field.onChange(
                            looksLikeMarkdown(text)
                              ? markdownToHtml(text)
                              : text
                                  .split(/\n{2,}/)
                                  .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
                                  .join(""),
                          )
                        }
                      />
                    </div>
                    <FormControl>
                      <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(categories.data ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
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
                  name="cpd_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPD hours</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration_mins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (mins)</FormLabel>
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
                  name="is_cstf_aligned"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>CSTF aligned</FormLabel>
                        <FormDescription>Maps to the NHS framework</FormDescription>
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
                        <FormDescription>Visible to learners</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {isEdit && wantsPublish && !readiness.ready && (
                <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Curriculum is not ready: {readiness.parts.join(", ")}. Fix these below before publishing.</span>
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button asChild variant="outline" type="button">
                  <Link to="/platform/courses/manage">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : isEdit ? "Save course" : "Create course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <ListTree className="size-5 text-brand-navy" />
                  Curriculum
                </CardTitle>
                <CardDescription>
                  Drag to reorder modules and lessons. Changes save automatically.
                </CardDescription>
              </div>
              <ImportCurriculumDialog courseId={id!} />
            </div>
          </CardHeader>
          <CardContent>
            <CurriculumBuilder courseId={id!} />
          </CardContent>
        </Card>
      )}

        {isEdit && <CourseMaterialsEditor courseId={id!} />}

        {isEdit && <CourseExtrasEditor courseId={id!} />}
      </div>

      <CoursePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        courseId={id}
        values={{
          title: form.watch("title"),
          summary: form.watch("summary") ?? "",
          description: form.watch("description") ?? "",
          cpdHours: form.watch("cpd_hours") ?? 0,
          durationMins: form.watch("duration_mins") ?? 0,
          cstf: form.watch("is_cstf_aligned") ?? false,
          thumbnailUrl: form.watch("thumbnail_url") ?? "",
        }}
      />
    </div>
  )
}
