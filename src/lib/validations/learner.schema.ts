import { z } from "zod"

const optionalString = z.string().trim().optional().or(z.literal(""))

/** Add a single learner (creates an auth user via Edge Function). */
export const learnerCreateSchema = z.object({
  first_name: z.string().trim().min(2, "Enter a first name"),
  last_name: z.string().trim().min(2, "Enter a last name"),
  email: z.string().trim().min(1, "Enter an email").email("Enter a valid email"),
  phone: optionalString,
})

/** Edit an existing learner profile (no email/auth change here). */
export const learnerEditSchema = z.object({
  first_name: z.string().trim().min(2, "Enter a first name"),
  last_name: z.string().trim().min(2, "Enter a last name"),
  phone: optionalString,
})

/** A single row from a CSV/XLSX import. */
export const learnerImportRowSchema = z.object({
  email: z.string().trim().min(1).email(),
  first_name: z.string().trim().optional().default(""),
  last_name: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
})

export type LearnerCreateValues = z.infer<typeof learnerCreateSchema>
export type LearnerEditValues = z.infer<typeof learnerEditSchema>
export type LearnerImportRow = z.infer<typeof learnerImportRowSchema>
