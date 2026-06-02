import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase/client"
import type { Profile, UserRole } from "@/types/database.types"

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
