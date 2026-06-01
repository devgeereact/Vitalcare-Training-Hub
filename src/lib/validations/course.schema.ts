import { z } from "zod"

export const courseFormSchema = z.object({
  title: z.string().trim().min(3, "Enter a course title"),
  summary: z.string().trim().max(300, "Keep the summary under 300 characters").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string().trim().min(1, "Choose a category"),
  is_cstf_aligned: z.boolean(),
  cpd_hours: z.coerce.number().min(0, "Cannot be negative").max(999),
  duration_mins: z.coerce.number().min(0, "Cannot be negative").max(100000),
  is_published: z.boolean(),
})

export const moduleFormSchema = z.object({
  title: z.string().trim().min(2, "Enter a module title"),
})

export const lessonFormSchema = z.object({
  title: z.string().trim().min(2, "Enter a lesson title"),
  type: z.enum(["text", "video", "scorm", "h5p", "document"]),
  content: z.string().optional().or(z.literal("")),
  video_url: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  scorm_url: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  document_url: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  duration_mins: z.coerce.number().min(0).max(100000),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
export type ModuleFormValues = z.infer<typeof moduleFormSchema>
export type LessonFormValues = z.infer<typeof lessonFormSchema>
