import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase/client"
import type {
  Department,
  Enrollment,
  LearnerCertificate,
  Profile,
  TrainingSession,
  UserRole,
} from "@/types/database.types"

/**
 * The standalone profile header needs two columns that are not yet present in
 * the generated `database.types.ts` (which we must not edit): `banner_url` and
 * `job_title`. We surface them through this thin extension type and read them
 * from the existing `select("*")` payload, casting once, with justification,
 * rather than reaching for `any`.
 */
export interface ProfileExtras {
  banner_url: string | null
  job_title: string | null
}

export type FullProfile = Profile & ProfileExtras

/** Read the banner/job-title extras off a profile loaded via `select("*")`. */
export function readProfileExtras(profile: Profile | null): ProfileExtras {
  // The row already contains these columns at runtime; the generated type just
  // does not list them. A single narrow cast keeps the rest of the app typed.
  const row = (profile ?? {}) as Partial<ProfileExtras>
  return {
    banner_url: row.banner_url ?? null,
    job_title: row.job_title ?? null,
  }
}

export interface ProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  about?: string | null
  job_title?: string | null
  avatar_url?: string | null
  banner_url?: string | null
}

/**
 * Update the signed-in user's own profile. Accepts the extra columns by routing
 * the payload through a typed-but-loosened builder so we never pass `any` and
 * never write to the generated `full_name` column.
 */
export async function updateOwnProfile(
  id: string,
  patch: ProfileUpdate,
): Promise<void> {
  // `patch` is a known, closed shape. `banner_url` and `job_title` exist on the
  // table at runtime but not in the generated `Profile` type (which we must not
  // edit), so we cast the payload to `Partial<Profile>` to satisfy the typed
  // client without resorting to `any`.
  const payload = patch as Partial<Profile>
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
  if (error) {
    console.error("[updateOwnProfile]", error)
    throw error
  }
}

export function useUpdateOwnProfile(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => {
      if (!id) throw new Error("No profile id")
      return updateOwnProfile(id, patch)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

/** Organisation name for the profile header, resolved from the org id. */
export function useOrganisationName(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["organisation", "name", orgId ?? "none"],
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", orgId as string)
        .maybeSingle()
      if (error) {
        console.error("[useOrganisationName]", error)
        throw error
      }
      return data?.name ?? null
    },
  })
}

// ─── Role-based profile metrics ──────────────────────────────────────────────

export interface ProfileMetric {
  key: string
  label: string
  value: number
  suffix?: string
}

/**
 * Learner profile metrics: courses enrolled, courses completed, certificates
 * earned, and attendance rate across sessions that have been marked.
 */
async function getLearnerProfileMetrics(
  learnerId: string,
): Promise<ProfileMetric[]> {
  const [enrolled, completed, certificates, attendance] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", learnerId)
      .is("deleted_at", null),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", learnerId)
      .eq("status", "completed")
      .is("deleted_at", null),
    supabase
      .from("learner_certificates")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", learnerId)
      .is("deleted_at", null),
    supabase
      .from("attendance_records")
      .select("status")
      .eq("learner_id", learnerId)
      .is("deleted_at", null),
  ])

  const firstError =
    enrolled.error || completed.error || certificates.error || attendance.error
  if (firstError) {
    console.error("[getLearnerProfileMetrics]", firstError)
    throw firstError
  }

  const records = attendance.data ?? []
  const present = records.filter(
    (r) => r.status === "present" || r.status === "late" || r.status === "excused",
  ).length
  const attendancePct =
    records.length > 0 ? Math.round((present / records.length) * 100) : 0

  return [
    { key: "enrolled", label: "Courses enrolled", value: enrolled.count ?? 0 },
    { key: "completed", label: "Courses completed", value: completed.count ?? 0 },
    { key: "certificates", label: "Certificates", value: certificates.count ?? 0 },
    {
      key: "attendance",
      label: "Attendance",
      value: attendancePct,
      suffix: "%",
    },
  ]
}

/**
 * Trainer profile metrics: sessions delivered (completed), distinct learners
 * taught, and courses authored.
 */
async function getTrainerProfileMetrics(
  trainerId: string,
): Promise<ProfileMetric[]> {
  const [delivered, allSessions, courses] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .eq("status", "completed")
      .is("deleted_at", null),
    supabase
      .from("training_sessions")
      .select("id")
      .eq("trainer_id", trainerId)
      .is("deleted_at", null),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("created_by", trainerId)
      .is("deleted_at", null),
  ])

  const firstError = delivered.error || allSessions.error || courses.error
  if (firstError) {
    console.error("[getTrainerProfileMetrics]", firstError)
    throw firstError
  }

  const sessionIds = (allSessions.data ?? []).map((s) => s.id)
  let learners = 0
  if (sessionIds.length) {
    const { data: bookings, error } = await supabase
      .from("session_bookings")
      .select("learner_id")
      .in("session_id", sessionIds)
    if (error) {
      console.error("[getTrainerProfileMetrics:bookings]", error)
      throw error
    }
    learners = new Set((bookings ?? []).map((b) => b.learner_id)).size
  }

  return [
    { key: "delivered", label: "Sessions delivered", value: delivered.count ?? 0 },
    { key: "learners", label: "Learners taught", value: learners },
    { key: "courses", label: "Courses authored", value: courses.count ?? 0 },
  ]
}

/**
 * Admin profile metrics: organisation-wide totals (learners, published courses,
 * certificates issued, upcoming sessions).
 */
async function getAdminProfileMetrics(): Promise<ProfileMetric[]> {
  const nowISO = new Date().toISOString()
  const [learners, courses, certificates, upcoming] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "learner")
      .is("deleted_at", null),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .is("deleted_at", null),
    supabase
      .from("learner_certificates")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", nowISO)
      .neq("status", "cancelled")
      .is("deleted_at", null),
  ])

  const firstError =
    learners.error || courses.error || certificates.error || upcoming.error
  if (firstError) {
    console.error("[getAdminProfileMetrics]", firstError)
    throw firstError
  }

  return [
    { key: "learners", label: "Total learners", value: learners.count ?? 0 },
    { key: "courses", label: "Active courses", value: courses.count ?? 0 },
    {
      key: "certificates",
      label: "Certificates issued",
      value: certificates.count ?? 0,
    },
    { key: "upcoming", label: "Upcoming sessions", value: upcoming.count ?? 0 },
  ]
}

/** Pick the right metric set for the signed-in user's role. */
export function useProfileMetrics(id: string | undefined, role: UserRole | null) {
  return useQuery({
    queryKey: ["profile", "metrics", role ?? "none", id ?? "none"],
    enabled: !!id && !!role,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProfileMetric[]> => {
      const uid = id as string
      if (role === "learner") return getLearnerProfileMetrics(uid)
      if (role === "trainer" || role === "content_editor")
        return getTrainerProfileMetrics(uid)
      // admin, super_admin, manager and any other staff see org totals.
      return getAdminProfileMetrics()
    },
  })
}

// ─── Departments the user belongs to ─────────────────────────────────────────

/**
 * `department_members` lands in migration 040 and is not present in the
 * generated `database.types.ts` (which is read-only here). We read it through a
 * single narrow cast on the table name, then map the rows back to typed
 * `Department` records, so the rest of the call stays strict.
 */
interface DepartmentMemberRow {
  department_id: string
}

export function useProfileDepartments(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", "departments", userId ?? "none"],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Department[]> => {
      const memberQuery = await supabase
        .from("department_members" as never)
        .select("department_id")
        .eq("user_id", userId as string)
      if (memberQuery.error) {
        console.error("[useProfileDepartments:members]", memberQuery.error)
        throw memberQuery.error
      }
      const rows = (memberQuery.data ?? []) as unknown as DepartmentMemberRow[]
      const ids = Array.from(new Set(rows.map((r) => r.department_id)))
      if (ids.length === 0) return []

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .in("id", ids)
        .is("deleted_at", null)
        .order("name", { ascending: true })
      if (error) {
        console.error("[useProfileDepartments:departments]", error)
        throw error
      }
      return (data ?? []) as Department[]
    },
  })
}

// ─── Recent activity timeline ────────────────────────────────────────────────

export type ProfileActivityKind =
  | "enrolment"
  | "completion"
  | "certificate"
  | "session"

export interface ProfileActivityItem {
  id: string
  kind: ProfileActivityKind
  title: string
  /** ISO timestamp the row is sorted by. */
  at: string
}

/** Recent enrolments, completions and certificates for a learner. */
async function getLearnerActivity(
  learnerId: string,
): Promise<ProfileActivityItem[]> {
  const [enrolments, certificates] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, course_id, status, enrolled_at, completed_at")
      .eq("learner_id", learnerId)
      .is("deleted_at", null)
      .order("enrolled_at", { ascending: false })
      .limit(8),
    supabase
      .from("learner_certificates")
      .select("id, course_id, issued_at")
      .eq("learner_id", learnerId)
      .is("deleted_at", null)
      .order("issued_at", { ascending: false })
      .limit(8),
  ])

  const firstError = enrolments.error || certificates.error
  if (firstError) {
    console.error("[getLearnerActivity]", firstError)
    throw firstError
  }

  const enrolRows = (enrolments.data ?? []) as Pick<
    Enrollment,
    "id" | "course_id" | "status" | "enrolled_at" | "completed_at"
  >[]
  const certRows = (certificates.data ?? []) as Pick<
    LearnerCertificate,
    "id" | "course_id" | "issued_at"
  >[]

  const courseIds = Array.from(
    new Set([
      ...enrolRows.map((r) => r.course_id),
      ...certRows.map((r) => r.course_id).filter((c): c is string => !!c),
    ]),
  )
  const titles = await getCourseTitles(courseIds)

  const items: ProfileActivityItem[] = []
  for (const r of enrolRows) {
    const courseName = titles.get(r.course_id) ?? "a course"
    if (r.status === "completed" && r.completed_at) {
      items.push({
        id: `enr-done-${r.id}`,
        kind: "completion",
        title: `Completed ${courseName}`,
        at: r.completed_at,
      })
    } else {
      items.push({
        id: `enr-${r.id}`,
        kind: "enrolment",
        title: `Enrolled on ${courseName}`,
        at: r.enrolled_at,
      })
    }
  }
  for (const r of certRows) {
    const courseName = r.course_id ? titles.get(r.course_id) : null
    items.push({
      id: `cert-${r.id}`,
      kind: "certificate",
      title: courseName
        ? `Earned certificate for ${courseName}`
        : "Earned a certificate",
      at: r.issued_at,
    })
  }

  return items
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8)
}

/** Recent sessions led by a trainer. */
async function getTrainerActivity(
  trainerId: string,
): Promise<ProfileActivityItem[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, starts_at, status")
    .eq("trainer_id", trainerId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(8)
  if (error) {
    console.error("[getTrainerActivity]", error)
    throw error
  }
  const rows = (data ?? []) as Pick<
    TrainingSession,
    "id" | "title" | "starts_at" | "status"
  >[]
  return rows.map((s) => ({
    id: `sess-${s.id}`,
    kind: "session" as const,
    title:
      s.status === "completed"
        ? `Delivered ${s.title}`
        : `Scheduled ${s.title}`,
    at: s.starts_at,
  }))
}

/** Most recently issued certificates across the organisation, for staff. */
async function getAdminActivity(): Promise<ProfileActivityItem[]> {
  const { data, error } = await supabase
    .from("learner_certificates")
    .select("id, course_id, issued_at")
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .limit(8)
  if (error) {
    console.error("[getAdminActivity]", error)
    throw error
  }
  const rows = (data ?? []) as Pick<
    LearnerCertificate,
    "id" | "course_id" | "issued_at"
  >[]
  const titles = await getCourseTitles(
    rows.map((r) => r.course_id).filter((c): c is string => !!c),
  )
  return rows.map((r) => ({
    id: `cert-${r.id}`,
    kind: "certificate" as const,
    title: r.course_id
      ? `Certificate issued for ${titles.get(r.course_id) ?? "a course"}`
      : "Certificate issued",
    at: r.issued_at,
  }))
}

/** Resolve a set of course ids to their titles in one round trip. */
async function getCourseTitles(
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (ids.length === 0) return map
  const { data, error } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", ids)
  if (error) {
    console.error("[getCourseTitles]", error)
    return map
  }
  for (const c of (data ?? []) as { id: string; title: string }[]) {
    map.set(c.id, c.title)
  }
  return map
}

/** Role-aware recent activity for the profile timeline. */
export function useProfileActivity(
  id: string | undefined,
  role: UserRole | null,
) {
  return useQuery({
    queryKey: ["profile", "activity", role ?? "none", id ?? "none"],
    enabled: !!id && !!role,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProfileActivityItem[]> => {
      const uid = id as string
      if (role === "learner") return getLearnerActivity(uid)
      if (role === "trainer" || role === "content_editor")
        return getTrainerActivity(uid)
      return getAdminActivity()
    },
  })
}
