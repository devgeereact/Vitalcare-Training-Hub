import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export const certsKeys = {
  all: ["certificates"] as const,
  list: () => [...certsKeys.all, "list"] as const,
}

export interface CertRow {
  id: string
  learnerId: string
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  expiresAt: string | null
  verificationUuid: string
}

export async function getCertificates(): Promise<CertRow[]> {
  const { data, error } = await supabase
    .from("learner_certificates")
    .select("id, learner_id, course_id, cpd_hours, issued_at, expires_at, verification_uuid")
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .limit(500)
  if (error) {
    console.error("[getCertificates]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const learnerIds = [...new Set(data.map((d) => d.learner_id))]
  const courseIds = [...new Set(data.map((d) => d.course_id).filter(Boolean))]
  const [profiles, courses] = await Promise.all([
    supabase.from("profiles").select("id, full_name, first_name, last_name").in("id", learnerIds),
    courseIds.length
      ? supabase.from("courses").select("id, title").in("id", courseIds as string[])
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const nameById = new Map(
    (profiles.data ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
    ]),
  )
  const titleById = new Map((courses.data ?? []).map((c) => [c.id, c.title]))

  return data.map((d) => ({
    id: d.id,
    learnerId: d.learner_id,
    learnerName: nameById.get(d.learner_id) ?? "Unknown",
    courseTitle: d.course_id ? titleById.get(d.course_id) ?? "—" : "Standalone",
    cpdHours: d.cpd_hours,
    issuedAt: d.issued_at,
    expiresAt: d.expires_at,
    verificationUuid: d.verification_uuid,
  }))
}

export function useCertificates() {
  return useQuery({ queryKey: certsKeys.list(), queryFn: getCertificates })
}

export interface IssueCertInput {
  learnerId: string
  courseId: string | null
  cpdHours: number
  expiresAt: string | null
}

export function useIssueCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: IssueCertInput) => {
      const { error } = await supabase.from("learner_certificates").insert({
        learner_id: input.learnerId,
        course_id: input.courseId,
        cpd_hours: input.cpdHours,
        expires_at: input.expiresAt,
      })
      if (error) {
        console.error("[useIssueCertificate]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: certsKeys.list() }),
  })
}
