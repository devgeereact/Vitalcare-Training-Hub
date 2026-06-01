import { z } from "zod"

export const assessmentFormSchema = z.object({
  title: z.string().trim().min(3, "Enter an assessment title"),
  description: z.string().trim().optional().or(z.literal("")),
  course_id: z.string().trim().optional().or(z.literal("")),
  pass_mark: z.coerce.number().min(0).max(100),
  time_limit_mins: z.coerce.number().min(0).max(100000).optional(),
  max_attempts: z.coerce.number().min(0).max(100).optional(),
  randomise: z.boolean(),
  is_published: z.boolean(),
})

export const questionOptionSchema = z.object({
  label: z.string().trim().min(1, "Enter option text"),
  is_correct: z.boolean(),
})

export const questionFormSchema = z
  .object({
    type: z.enum(["mcq", "true_false", "fill_blank", "free_text"]),
    prompt: z.string().trim().min(3, "Enter the question"),
    points: z.coerce.number().min(1).max(100),
    options: z.array(questionOptionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "mcq") {
      if (data.options.length < 2)
        ctx.addIssue({ code: "custom", message: "Add at least two options", path: ["options"] })
      if (!data.options.some((o) => o.is_correct))
        ctx.addIssue({ code: "custom", message: "Mark a correct option", path: ["options"] })
    }
    if (data.type === "fill_blank" && data.options.length < 1) {
      ctx.addIssue({ code: "custom", message: "Enter the accepted answer", path: ["options"] })
    }
  })

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>
export type QuestionFormValues = z.infer<typeof questionFormSchema>
