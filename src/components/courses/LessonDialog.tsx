import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import MediaUpload from "@/components/courses/MediaUpload"
import {
  lessonFormSchema,
  type LessonFormValues,
} from "@/lib/validations/course.schema"

const LESSON_TYPES = [
  { value: "text", label: "Text" },
  { value: "video", label: "Video URL" },
  { value: "document", label: "Document" },
  { value: "scorm", label: "SCORM" },
  { value: "h5p", label: "H5P" },
] as const

const EMPTY: LessonFormValues = {
  title: "",
  type: "text",
  content: "",
  video_url: "",
  scorm_url: "",
  document_url: "",
  duration_mins: 0,
}

export default function LessonDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultValues?: Partial<LessonFormValues>
  onSubmit: (values: LessonFormValues) => void
  saving?: boolean
}) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema) as Resolver<LessonFormValues>,
    defaultValues: { ...EMPTY, ...defaultValues },
  })

  useEffect(() => {
    if (open) form.reset({ ...EMPTY, ...defaultValues })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const type = form.watch("type")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {defaultValues?.title ? "Edit lesson" : "Add lesson"}
          </DialogTitle>
          <DialogDescription>Lesson content for this module.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Lesson title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LESSON_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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

            {type === "text" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Lesson text…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {type === "video" && (
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video</FormLabel>
                    <FormControl>
                      <Input placeholder="https://… (or upload below)" {...field} />
                    </FormControl>
                    <MediaUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      variant="file"
                      accept="video/*"
                      folder="lessons"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {type === "document" && (
              <FormField
                control={form.control}
                name="document_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document</FormLabel>
                    <FormControl>
                      <Input placeholder="https://… (or upload below)" {...field} />
                    </FormControl>
                    <MediaUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      variant="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      folder="lessons"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(type === "scorm" || type === "h5p") && (
              <FormField
                control={form.control}
                name="scorm_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{type.toUpperCase()} package</FormLabel>
                    <FormControl>
                      <Input placeholder="https://… (or upload a .zip below)" {...field} />
                    </FormControl>
                    <MediaUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      variant="file"
                      accept=".zip"
                      folder="lessons"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
