import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Profile, UserRole } from "@/types/database.types"

export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all, "list"] as const,
}

export function useProfileById(id: string | null) {
  return useQuery({
    queryKey: ["users", "detail", id ?? "none"],
    enabled: !!id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle()
      if (error) {
        console.error("[useProfileById]", error)
        throw error
      }
      return (data as Profile) ?? null
    },
  })
}

export function useAllUsers() {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useAllUsers]", error)
        throw error
      }
      return (data ?? []) as Profile[]
    },
  })
}

export function useUserMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: usersKeys.all })

  const setRole = useMutation({
    mutationFn: async (input: { id: string; role: UserRole }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: input.role })
        .eq("id", input.id)
      if (error) {
        console.error("[setRole]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("[removeUser]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const assignCourse = useMutation({
    mutationFn: async (input: { learnerId: string; courseId: string }) => {
      // Skip if already enrolled.
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("learner_id", input.learnerId)
        .eq("course_id", input.courseId)
        .is("deleted_at", null)
        .maybeSingle()
      if (existing) return { already: true }
      const { error } = await supabase.from("enrollments").insert({
        learner_id: input.learnerId,
        course_id: input.courseId,
        status: "not_started",
      })
      if (error) {
        console.error("[assignCourse]", error)
        throw error
      }
      return { already: false }
    },
  })

  return { setRole, remove, assignCourse }
}
