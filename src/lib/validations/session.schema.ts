import { z } from "zod"

export const sessionFormSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a session title"),
    description: z.string().trim().optional().or(z.literal("")),
    course_id: z.string().trim().optional().or(z.literal("")),
    trainer_id: z.string().trim().optional().or(z.literal("")),
    starts_at: z.string().min(1, "Choose a start time"),
    ends_at: z.string().min(1, "Choose an end time"),
    venue: z.string().trim().optional().or(z.literal("")),
    capacity: z.coerce.number().min(0).max(100000).optional(),
    is_virtual: z.boolean(),
    is_public: z.boolean(),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: "End must be after start",
    path: ["ends_at"],
  })

export type SessionFormValues = z.infer<typeof sessionFormSchema>
