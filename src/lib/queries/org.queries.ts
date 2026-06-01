import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Department, UserRole } from "@/types/database.types"

/* ------------------------------------------------------------ departments - */

export const orgKeys = {
  departments: () => ["departments", "list"] as const,
  staff: () => ["staff", "list"] as const,
}

export interface DepartmentRow extends Department {
  memberCount: number
}

export function useDepartments() {
  return useQuery({
    queryKey: orgKeys.departments(),
    queryFn: async (): Promise<DepartmentRow[]> => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true })
      if (error) {
        console.error("[useDepartments]", error)
        throw error
      }
      return ((data ?? []) as Department[]).map((d) => ({ ...d, memberCount: 0 }))
    },
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; organisationId: string }) => {
      const { error } = await supabase.from("departments").insert({
        name: input.name.trim(),
        organisation_id: input.organisationId,
      })
      if (error) {
        console.error("[useCreateDepartment]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.departments() }),
  })
}

/* ------------------------------------------------------------------ staff - */

export interface StaffRow {
  id: string
  name: string
  email: string
  role: UserRole
}

const STAFF_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "manager",
  "trainer",
  "content_editor",
]

export function useStaff() {
  return useQuery({
    queryKey: orgKeys.staff(),
    queryFn: async (): Promise<StaffRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, full_name, role")
        .in("role", STAFF_ROLES)
        .is("deleted_at", null)
        .order("role", { ascending: true })
      if (error) {
        console.error("[useStaff]", error)
        throw error
      }
      return (data ?? []).map((p) => ({
        id: p.id,
        name:
          p.full_name ||
          [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          "Unnamed",
        email: p.email,
        role: p.role,
      }))
    },
  })
}
