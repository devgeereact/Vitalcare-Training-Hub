import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type {
  EnrollmentStatus,
  Profile,
} from "@/types/database.types"
import type {
  LearnerCreateValues,
  LearnerEditValues,
  LearnerImportRow,
} from "@/lib/validations/learner.schema"

export const learnersKeys = {
  all: ["learners"] as const,
  list: () => [...learnersKeys.all, "list"] as const,
  detail: (id: string) => [...learnersKeys.all, "detail", id] as const,
  enrolments: (id: string) => [...learnersKeys.all, "enrolments", id] as const,
  certificates: (id: string) =>
    [...learnersKeys.all, "certificates", id] as const,
  exams: (id: string) => [...learnersKeys.all, "exams", id] as const,
}

export interface LearnerRow {
  id: string
  name: string
  email: string
  phone: string
  organisation: string | null
  joined: string
  status: "Active"
}

export async function getLearners(): Promise<LearnerRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, full_name, phone, organisation_id, created_at",
    )
    .eq("role", "learner")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getLearners]", error)
    throw error
  }

  // Resolve organisation names in one batch.
  const orgIds = [
    ...new Set((data ?? []).map((p) => p.organisation_id).filter(Boolean)),
  ] as string[]
  const orgById = new Map<string, string>()
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name")
      .in("id", orgIds)
    for (const o of orgs ?? []) orgById.set(o.id, o.name)
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    name:
      p.full_name ||
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      "Unnamed learner",
    email: p.email,
    phone: p.phone ?? "",
    organisation: p.organisation_id
      ? orgById.get(p.organisation_id) ?? null
      : null,
    joined: p.created_at,
    status: "Active" as const,
  }))
}

export function useLearners() {
  return useQuery({ queryKey: learnersKeys.list(), queryFn: getLearners })
}

export async function getLearner(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[getLearner]", error)
    throw error
  }
  return data as Profile
}

export function useLearner(id: string) {
  return useQuery({
    queryKey: learnersKeys.detail(id),
    queryFn: () => getLearner(id),
    enabled: !!id,
  })
}

export interface LearnerEnrolment {
  id: string
  courseTitle: string
  status: EnrollmentStatus
  progressPct: number
  enrolledAt: string
}

export async function getLearnerEnrolments(
  learnerId: string,
): Promise<LearnerEnrolment[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, course_id, status, progress_pct, enrolled_at")
    .eq("learner_id", learnerId)
    .is("deleted_at", null)
    .order("enrolled_at", { ascending: false })

  if (error) {
    console.error("[getLearnerEnrolments]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const courseIds = [...new Set(data.map((d) => d.course_id))]
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds)
  const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))

  return data.map((d) => ({
    id: d.id,
    courseTitle: titleById.get(d.course_id) ?? "Untitled course",
    status: d.status,
    progressPct: d.progress_pct,
    enrolledAt: d.enrolled_at,
  }))
}

export function useLearnerEnrolments(id: string) {
  return useQuery({
    queryKey: learnersKeys.enrolments(id),
    queryFn: () => getLearnerEnrolments(id),
    enabled: !!id,
  })
}

export interface LearnerCertificate {
  id: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  expiresAt: string | null
  verificationUuid: string
}

export async function getLearnerCertificates(
  learnerId: string,
): Promise<LearnerCertificate[]> {
  const { data, error } = await supabase
    .from("learner_certificates")
    .select("id, course_id, cpd_hours, issued_at, expires_at, verification_uuid")
    .eq("learner_id", learnerId)
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })

  if (error) {
    console.error("[getLearnerCertificates]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const courseIds = [...new Set(data.map((d) => d.course_id).filter(Boolean))]
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds.length ? (courseIds as string[]) : ["none"])
  const titleById = new Map((courses ?? []).map((c) => [c.id, c.title]))

  return data.map((d) => ({
    id: d.id,
    courseTitle: d.course_id
      ? titleById.get(d.course_id) ?? "Untitled course"
      : "Standalone",
    cpdHours: d.cpd_hours,
    issuedAt: d.issued_at,
    expiresAt: d.expires_at,
    verificationUuid: d.verification_uuid,
  }))
}

export function useLearnerCertificates(id: string) {
  return useQuery({
    queryKey: learnersKeys.certificates(id),
    queryFn: () => getLearnerCertificates(id),
    enabled: !!id,
  })
}

export interface LearnerExamResult {
  id: string
  assessmentTitle: string
  score: number
  passed: boolean
  completedAt: string | null
}

export async function getLearnerExamResults(
  learnerId: string,
): Promise<LearnerExamResult[]> {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("id, assessment_id, score, passed, completed_at")
    .eq("learner_id", learnerId)
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("[getLearnerExamResults]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const assessmentIds = [...new Set(data.map((d) => d.assessment_id))]
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, title")
    .in("id", assessmentIds)
  const titleById = new Map((assessments ?? []).map((a) => [a.id, a.title]))

  return data.map((d) => ({
    id: d.id,
    assessmentTitle: titleById.get(d.assessment_id) ?? "-",
    score: d.score,
    passed: d.passed,
    completedAt: d.completed_at,
  }))
}

export function useLearnerExamResults(id: string) {
  return useQuery({
    queryKey: learnersKeys.exams(id),
    queryFn: () => getLearnerExamResults(id),
    enabled: !!id,
  })
}

export function useUpdateLearner(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: LearnerEditValues) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
        })
        .eq("id", id)
      if (error) {
        console.error("[useUpdateLearner]", error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: learnersKeys.detail(id) })
      qc.invalidateQueries({ queryKey: learnersKeys.list() })
    },
  })
}

export function useDeleteLearner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("[useDeleteLearner]", error)
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: learnersKeys.list() })
    },
  })
}

export interface CreateLearnersResult {
  created: number
  errors: { email: string; error: string }[]
}

/** Create learners via the admin-create-learners Edge Function (service role). */
export async function createLearners(
  learners: (LearnerCreateValues | LearnerImportRow)[],
): Promise<CreateLearnersResult> {
  const { data, error } = await supabase.functions.invoke(
    "admin-create-learners",
    { body: { learners } },
  )
  if (error) {
    console.error("[createLearners]", error)
    throw new Error(
      "Learner service is unavailable. Deploy the admin-create-learners Edge Function, then try again.",
    )
  }
  return data as CreateLearnersResult
}

export function useCreateLearners() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createLearners,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: learnersKeys.list() })
    },
  })
}
