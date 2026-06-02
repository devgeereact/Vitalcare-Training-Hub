import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PostgrestQueryBuilder } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import type { Department, UserRole } from "@/types/database.types"

/* ---------------------------------------------------------- typed tables ---
 * department_members and department_tasks are created in migration 040 and are
 * not yet in the generated database.types.ts (which is read-only here). We
 * declare their shapes locally and expose typed query builders so the calls
 * stay strict — no `any`.
 */
interface DepartmentMemberDb {
  id: string
  department_id: string
  user_id: string
  created_at: string
}
interface DepartmentTaskDb {
  id: string
  department_id: string
  title: string
  description: string | null
  assignee_id: string | null
  status: DepartmentTaskStatus
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// The builder constraint needs Row to be index-signature compatible.
type TableDef<Row> = {
  Row: Row & Record<string, unknown>
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

// Typed builders for the two new tables. The runtime call is identical; only
// the static row/insert/update types differ, supplied locally.
function deptMembers(): PostgrestQueryBuilder<
  { PostgrestVersion: "12" },
  { Tables: Record<string, never>; Views: Record<string, never>; Functions: Record<string, never> },
  TableDef<DepartmentMemberDb>,
  "department_members"
> {
  return supabase.from(
    "department_members" as never,
  ) as unknown as ReturnType<typeof deptMembers>
}

function deptTasks(): PostgrestQueryBuilder<
  { PostgrestVersion: "12" },
  { Tables: Record<string, never>; Views: Record<string, never>; Functions: Record<string, never> },
  TableDef<DepartmentTaskDb>,
  "department_tasks"
> {
  return supabase.from(
    "department_tasks" as never,
  ) as unknown as ReturnType<typeof deptTasks>
}

/* ------------------------------------------------------------ departments - */

export const orgKeys = {
  departments: () => ["departments", "list"] as const,
  staff: () => ["staff", "list"] as const,
  members: (deptId: string) => ["departments", "members", deptId] as const,
  tasks: (deptId: string) => ["departments", "tasks", deptId] as const,
}

export type DepartmentTaskStatus = "todo" | "doing" | "done"

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
      const rows = (data ?? []) as Department[]
      if (!rows.length) return []
      const { data: members } = await deptMembers()
        .select("department_id")
        .in(
          "department_id",
          rows.map((r) => r.id),
        )
      const counts = new Map<string, number>()
      for (const m of members ?? [])
        counts.set(m.department_id, (counts.get(m.department_id) ?? 0) + 1)
      return rows.map((d) => ({ ...d, memberCount: counts.get(d.id) ?? 0 }))
    },
  })
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: [...orgKeys.departments(), "detail", id] as const,
    enabled: !!id,
    queryFn: async (): Promise<Department> => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", id)
        .single()
      if (error) {
        console.error("[useDepartment]", error)
        throw error
      }
      return data as Department
    },
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      organisationId: string
      description?: string
    }) => {
      const { error } = await supabase.from("departments").insert({
        name: input.name.trim(),
        organisation_id: input.organisationId,
        description: input.description?.trim() || null,
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

/* ------------------------------------------------ department members ------- */

export interface DepartmentMemberRow {
  memberId: string
  userId: string
  name: string
  email: string
  role: UserRole
}

export function useDepartmentMembers(departmentId: string) {
  return useQuery({
    queryKey: orgKeys.members(departmentId),
    enabled: !!departmentId,
    queryFn: async (): Promise<DepartmentMemberRow[]> => {
      const { data, error } = await deptMembers()
        .select("id, user_id")
        .eq("department_id", departmentId)
      if (error) {
        console.error("[useDepartmentMembers]", error)
        throw error
      }
      const rows = data ?? []
      if (!rows.length) return []
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, email, role")
        .in(
          "id",
          rows.map((r) => r.user_id),
        )
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
      return rows.map((r) => {
        const p = byId.get(r.user_id)
        return {
          memberId: r.id,
          userId: r.user_id,
          name:
            p?.full_name ||
            [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
            "Unnamed",
          email: p?.email ?? "",
          role: (p?.role ?? "learner") as UserRole,
        }
      })
    },
  })
}

export function useDepartmentMemberMutations(departmentId: string) {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: orgKeys.members(departmentId) })
    qc.invalidateQueries({ queryKey: orgKeys.departments() })
  }
  const addMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await deptMembers()
        .insert({ department_id: departmentId, user_id: userId })
      if (error) {
        console.error("[addDepartmentMember]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await deptMembers()
        .delete()
        .eq("id", memberId)
      if (error) {
        console.error("[removeDepartmentMember]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })
  return { addMember, removeMember }
}

export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase
        .from("departments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", departmentId)
      if (error) {
        console.error("[useDeleteDepartment]", error)
        throw error
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: orgKeys.departments() }),
  })
}

/* -------------------------------------------------- department tasks ------- */

export interface DepartmentTaskRow {
  id: string
  departmentId: string
  title: string
  description: string | null
  assigneeId: string | null
  assigneeName: string | null
  status: DepartmentTaskStatus
  dueDate: string | null
}

export function useDepartmentTasks(departmentId: string) {
  return useQuery({
    queryKey: orgKeys.tasks(departmentId),
    enabled: !!departmentId,
    queryFn: async (): Promise<DepartmentTaskRow[]> => {
      const { data, error } = await deptTasks()
        .select(
          "id, department_id, title, description, assignee_id, status, due_date",
        )
        .eq("department_id", departmentId)
        .order("created_at", { ascending: true })
      if (error) {
        console.error("[useDepartmentTasks]", error)
        throw error
      }
      const rows = data ?? []
      const ids = [...new Set(rows.map((r) => r.assignee_id).filter(Boolean))] as string[]
      const names = new Map<string, string>()
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", ids)
        for (const p of profiles ?? [])
          names.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Unnamed",
          )
      }
      return rows.map((r) => ({
        id: r.id,
        departmentId: r.department_id,
        title: r.title,
        description: r.description,
        assigneeId: r.assignee_id,
        assigneeName: r.assignee_id ? names.get(r.assignee_id) ?? null : null,
        status: r.status,
        dueDate: r.due_date,
      }))
    },
  })
}

export interface DepartmentTaskInput {
  title: string
  description?: string
  assigneeId?: string | null
  status?: DepartmentTaskStatus
  dueDate?: string | null
}

export function useDepartmentTaskMutations(departmentId: string) {
  const qc = useQueryClient()
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: orgKeys.tasks(departmentId) })

  const createTask = useMutation({
    mutationFn: async (
      input: DepartmentTaskInput & { createdBy: string | null },
    ) => {
      const { error } = await deptTasks().insert({
        department_id: departmentId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        assignee_id: input.assigneeId || null,
        status: input.status ?? "todo",
        due_date: input.dueDate || null,
        created_by: input.createdBy,
      })
      if (error) {
        console.error("[createDepartmentTask]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const updateTask = useMutation({
    mutationFn: async (
      input: { id: string } & Partial<DepartmentTaskInput>,
    ) => {
      const patch: Partial<DepartmentTaskDb> = {}
      if (input.title !== undefined) patch.title = input.title.trim()
      if (input.description !== undefined)
        patch.description = input.description?.trim() || null
      if (input.assigneeId !== undefined) patch.assignee_id = input.assigneeId || null
      if (input.status !== undefined) patch.status = input.status
      if (input.dueDate !== undefined) patch.due_date = input.dueDate || null
      const { error } = await deptTasks()
        .update(patch)
        .eq("id", input.id)
      if (error) {
        console.error("[updateDepartmentTask]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deptTasks()
        .delete()
        .eq("id", id)
      if (error) {
        console.error("[deleteDepartmentTask]", error)
        throw error
      }
    },
    onSuccess: invalidate,
  })

  return { createTask, updateTask, deleteTask }
}
