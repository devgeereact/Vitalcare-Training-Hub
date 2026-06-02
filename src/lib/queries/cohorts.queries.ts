import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Cohort } from "@/types/database.types"

export const cohortKeys = {
  all: ["cohorts"] as const,
  list: () => [...cohortKeys.all, "list"] as const,
  detail: (id: string) => [...cohortKeys.all, "detail", id] as const,
  members: (id: string) => [...cohortKeys.all, "members", id] as const,
}

export interface CohortRow extends Cohort {
  memberCount: number
}

export function useCohorts() {
  return useQuery({
    queryKey: cohortKeys.list(),
    queryFn: async (): Promise<CohortRow[]> => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useCohorts]", error)
        throw error
      }
      const rows = (data ?? []) as Cohort[]
      if (!rows.length) return []
      const { data: members } = await supabase
        .from("cohort_members")
        .select("cohort_id")
        .in(
          "cohort_id",
          rows.map((r) => r.id),
        )
      const counts = new Map<string, number>()
      for (const m of members ?? [])
        counts.set(m.cohort_id, (counts.get(m.cohort_id) ?? 0) + 1)
      return rows.map((r) => ({ ...r, memberCount: counts.get(r.id) ?? 0 }))
    },
  })
}

export function useCohort(id: string) {
  return useQuery({
    queryKey: cohortKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<Cohort> => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*")
        .eq("id", id)
        .single()
      if (error) {
        console.error("[useCohort]", error)
        throw error
      }
      return data as Cohort
    },
  })
}

export interface CohortMemberRow {
  memberId: string
  learnerId: string
  name: string
  email: string
}

export function useCohortMembers(id: string) {
  return useQuery({
    queryKey: cohortKeys.members(id),
    enabled: !!id,
    queryFn: async (): Promise<CohortMemberRow[]> => {
      const { data, error } = await supabase
        .from("cohort_members")
        .select("id, learner_id")
        .eq("cohort_id", id)
      if (error) {
        console.error("[useCohortMembers]", error)
        throw error
      }
      const rows = data ?? []
      if (!rows.length) return []
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, email")
        .in(
          "id",
          rows.map((r) => r.learner_id),
        )
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
      return rows.map((r) => {
        const p = byId.get(r.learner_id)
        return {
          memberId: r.id,
          learnerId: r.learner_id,
          name:
            p?.full_name ||
            [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
            "Unnamed learner",
          email: p?.email ?? "",
        }
      })
    },
  })
}

export function useCreateCohort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      description: string
      organisationId: string | null
      createdBy: string
    }) => {
      const { data, error } = await supabase
        .from("cohorts")
        .insert({
          name: input.name.trim(),
          description: input.description.trim() || null,
          organisation_id: input.organisationId,
          created_by: input.createdBy,
        })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateCohort]", error)
        throw error
      }
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cohortKeys.list() }),
  })
}

export function useDeleteCohort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cohortId: string) => {
      const { error } = await supabase
        .from("cohorts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", cohortId)
      if (error) {
        console.error("[useDeleteCohort]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cohortKeys.list() }),
  })
}

export function useCohortMemberMutations(cohortId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: cohortKeys.members(cohortId) })
    qc.invalidateQueries({ queryKey: cohortKeys.list() })
  }
  const addMember = useMutation({
    mutationFn: async (learnerId: string) => {
      const { error } = await supabase
        .from("cohort_members")
        .insert({ cohort_id: cohortId, learner_id: learnerId })
      if (error) {
        console.error("[addMember]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("cohort_members")
        .delete()
        .eq("id", memberId)
      if (error) {
        console.error("[removeMember]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })
  return { addMember, removeMember }
}

export interface BulkEnrolResult {
  enrolled: number
  skipped: number
}

/** Enrol every cohort member on a course, skipping anyone already enrolled. */
export function useBulkEnrol(cohortId: string) {
  return useMutation({
    mutationFn: async (courseId: string): Promise<BulkEnrolResult> => {
      const { data: members } = await supabase
        .from("cohort_members")
        .select("learner_id")
        .eq("cohort_id", cohortId)
      const learnerIds = (members ?? []).map((m) => m.learner_id)
      if (!learnerIds.length) return { enrolled: 0, skipped: 0 }

      const { data: existing } = await supabase
        .from("enrollments")
        .select("learner_id")
        .eq("course_id", courseId)
        .in("learner_id", learnerIds)
        .is("deleted_at", null)
      const already = new Set((existing ?? []).map((e) => e.learner_id))
      const toEnrol = learnerIds.filter((id) => !already.has(id))
      if (toEnrol.length) {
        const { error } = await supabase.from("enrollments").insert(
          toEnrol.map((learner_id) => ({
            learner_id,
            course_id: courseId,
            status: "not_started" as const,
          })),
        )
        if (error) {
          console.error("[useBulkEnrol]", error)
          throw error
        }
      }
      return { enrolled: toEnrol.length, skipped: already.size }
    },
  })
}
