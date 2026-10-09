import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { addCalendarMonthsIso } from "@/lib/dates"
import type { UserRole } from "@/types/database.types"

/** Roles treated as internal staff for compliance tracking (all non-learners). */
const STAFF_ROLES: UserRole[] = [
  "content_editor",
  "trainer",
  "manager",
  "admin",
  "super_admin",
]

const DAY_MS = 24 * 60 * 60 * 1000

export const complianceKeys = {
  all: ["compliance"] as const,
  mandatory: () => [...complianceKeys.all, "mandatory"] as const,
  matrix: () => [...complianceKeys.all, "matrix"] as const,
  summary: () => [...complianceKeys.all, "summary"] as const,
}

export type ComplianceStatus =
  | "current"
  | "due_soon"
  | "overdue"
  | "not_recorded"

/**
 * Derive compliance status and next-due date from the latest completion.
 *
 * The due date is a calendar-month addition that matches PostgreSQL, so the
 * matrix, the certificate and the reminder job all name the same day. See
 * `@/lib/dates`. A renewal period of zero months is treated as no renewal,
 * matching the database, where `coalesce(renewal_months, 0) > 0` gates expiry.
 */
export function complianceStatus(
  completedOn: string | null,
  renewalMonths: number | null,
): { status: ComplianceStatus; dueOn: string | null } {
  if (!completedOn) return { status: "not_recorded", dueOn: null }
  if (!renewalMonths || renewalMonths <= 0) {
    return { status: "current", dueOn: null }
  }
  const dueOn = addCalendarMonthsIso(completedOn, renewalMonths)
  if (!dueOn) return { status: "not_recorded", dueOn: null }
  // Compare whole days from the start of today, so a due date does not flip
  // between "due soon" and "overdue" as the clock passes midday.
  const due = new Date(`${dueOn}T00:00:00.000Z`)
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const days = Math.round((due.getTime() - today) / DAY_MS)
  if (days < 0) return { status: "overdue", dueOn }
  if (days <= 30) return { status: "due_soon", dueOn }
  return { status: "current", dueOn }
}

// ---------------------------------------------------------------------------
// Mandatory courses
// ---------------------------------------------------------------------------

export interface MandatoryCourse {
  courseId: string
  title: string
  renewalMonths: number | null
}

export async function getMandatoryCourses(): Promise<MandatoryCourse[]> {
  const { data: reqs, error } = await supabase
    .from("staff_training_requirements")
    .select("course_id")
    .is("deleted_at", null)
  if (error) {
    console.error("[getMandatoryCourses]", error)
    throw error
  }
  const courseIds = [...new Set((reqs ?? []).map((r) => r.course_id))]
  if (courseIds.length === 0) return []

  const { data: courses, error: cErr } = await supabase
    .from("courses")
    .select("id, title, renewal_months")
    .in("id", courseIds)
    .is("deleted_at", null)
    .order("title", { ascending: true })
  if (cErr) {
    console.error("[getMandatoryCourses:courses]", cErr)
    throw cErr
  }
  return (courses ?? []).map((c) => ({
    courseId: c.id,
    title: c.title,
    renewalMonths: c.renewal_months,
  }))
}

export function useMandatoryCourses() {
  return useQuery({
    queryKey: complianceKeys.mandatory(),
    queryFn: getMandatoryCourses,
  })
}

// ---------------------------------------------------------------------------
// Staff matrix
// ---------------------------------------------------------------------------

export interface MatrixCell {
  completedOn: string | null
  dueOn: string | null
  status: ComplianceStatus
}

export interface MatrixStaffRow {
  id: string
  name: string
  role: UserRole
  /** Keyed by course id. */
  cells: Record<string, MatrixCell>
}

export interface StaffMatrix {
  courses: MandatoryCourse[]
  staff: MatrixStaffRow[]
}

export async function getStaffMatrix(): Promise<StaffMatrix> {
  const courses = await getMandatoryCourses()

  const { data: staff, error } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, role")
    .in("role", STAFF_ROLES)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
  if (error) {
    console.error("[getStaffMatrix:staff]", error)
    throw error
  }
  const staffList = staff ?? []
  if (staffList.length === 0 || courses.length === 0) {
    return { courses, staff: [] }
  }

  const renewalByCourse = new Map(
    courses.map((c) => [c.courseId, c.renewalMonths]),
  )
  const courseIds = courses.map((c) => c.courseId)
  const staffIds = staffList.map((s) => s.id)

  // `renewal_months` is read as well as `completed_on`. Each record stores the
  // renewal period that applied when the training was recorded, and that
  // snapshot is what the record means. Reading the course's current period
  // instead moved historical due dates every time somebody edited a course.
  const { data: records, error: rErr } = await supabase
    .from("staff_training_records")
    .select("staff_id, course_id, completed_on, renewal_months")
    .in("staff_id", staffIds)
    .in("course_id", courseIds)
    .is("deleted_at", null)
  if (rErr) {
    console.error("[getStaffMatrix:records]", rErr)
    throw rErr
  }

  // Latest completion per staff+course, with the period saved against it.
  const latest = new Map<string, { completedOn: string; renewalMonths: number | null }>()
  for (const rec of records ?? []) {
    const key = `${rec.staff_id}:${rec.course_id}`
    const prev = latest.get(key)
    if (!prev || rec.completed_on > prev.completedOn) {
      latest.set(key, {
        completedOn: rec.completed_on,
        renewalMonths: rec.renewal_months,
      })
    }
  }

  const rows: MatrixStaffRow[] = staffList.map((s) => {
    const cells: Record<string, MatrixCell> = {}
    for (const c of courses) {
      const record = latest.get(`${s.id}:${c.courseId}`) ?? null
      const completedOn = record?.completedOn ?? null
      // Older records predate the snapshot column and store null. Those fall
      // back to the course's current period, which is the only figure there is.
      const renewalMonths =
        record?.renewalMonths ?? renewalByCourse.get(c.courseId) ?? null
      const { status, dueOn } = complianceStatus(completedOn, renewalMonths)
      cells[c.courseId] = { completedOn, dueOn, status }
    }
    return {
      id: s.id,
      name:
        s.full_name ||
        [s.first_name, s.last_name].filter(Boolean).join(" ") ||
        "Unnamed",
      role: s.role,
      cells,
    }
  })

  return { courses, staff: rows }
}

export function useStaffMatrix() {
  return useQuery({ queryKey: complianceKeys.matrix(), queryFn: getStaffMatrix })
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface ComplianceSummaryRow {
  courseId: string
  title: string
  current: number
  dueSoon: number
  overdue: number
  notRecorded: number
  total: number
  compliancePct: number
}

export async function getComplianceSummary(): Promise<ComplianceSummaryRow[]> {
  const { courses, staff } = await getStaffMatrix()
  return courses.map((c) => {
    let current = 0
    let dueSoon = 0
    let overdue = 0
    let notRecorded = 0
    for (const row of staff) {
      const status = row.cells[c.courseId]?.status ?? "not_recorded"
      if (status === "current") current += 1
      else if (status === "due_soon") dueSoon += 1
      else if (status === "overdue") overdue += 1
      else notRecorded += 1
    }
    const total = staff.length
    const compliancePct = total > 0 ? Math.round((current / total) * 100) : 0
    return {
      courseId: c.courseId,
      title: c.title,
      current,
      dueSoon,
      overdue,
      notRecorded,
      total,
      compliancePct,
    }
  })
}

export function useComplianceSummary() {
  return useQuery({
    queryKey: complianceKeys.summary(),
    queryFn: getComplianceSummary,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface RecordTrainingInput {
  staffId: string
  courseId: string
  completedOn: string
  renewalMonths: number | null
  trainerId?: string | null
  notes?: string | null
}

export function useRecordTraining() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordTrainingInput) => {
      const { error } = await supabase.from("staff_training_records").insert({
        staff_id: input.staffId,
        course_id: input.courseId,
        completed_on: input.completedOn,
        renewal_months: input.renewalMonths,
        trainer_id: input.trainerId ?? null,
        notes: input.notes ?? null,
      })
      if (error) {
        console.error("[useRecordTraining]", error)
        throw error
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: complianceKeys.all }),
  })
}

export interface SetRequirementInput {
  courseId: string
  renewalMonths: number | null
}

/** Mark a course as mandatory (global) and set its renewal interval. */
export function useSetRequirement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SetRequirementInput) => {
      const { error: cErr } = await supabase
        .from("courses")
        .update({ renewal_months: input.renewalMonths })
        .eq("id", input.courseId)
      if (cErr) {
        console.error("[useSetRequirement:course]", cErr)
        throw cErr
      }
      const { error } = await supabase
        .from("staff_training_requirements")
        .upsert(
          { course_id: input.courseId, role: null, department_id: null },
          { onConflict: "course_id,role,department_id" },
        )
      if (error) {
        console.error("[useSetRequirement:req]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: complianceKeys.all }),
  })
}

export function useRemoveRequirement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("staff_training_requirements")
        .update({ deleted_at: new Date().toISOString() })
        .eq("course_id", courseId)
        .is("deleted_at", null)
      if (error) {
        console.error("[useRemoveRequirement]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: complianceKeys.all }),
  })
}
