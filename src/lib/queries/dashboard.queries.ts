import { useQuery } from "@tanstack/react-query"
import {
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  format,
} from "date-fns"
import { supabase } from "@/lib/supabase/client"
import type {
  AttendanceStatus,
  EnrollmentStatus,
  SessionStatus,
} from "@/types/database.types"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  completionTrend: () => [...dashboardKeys.all, "completion-trend"] as const,
  attendance: () => [...dashboardKeys.all, "attendance"] as const,
  recentEnrolments: () => [...dashboardKeys.all, "recent-enrolments"] as const,
  upcomingSessions: () => [...dashboardKeys.all, "upcoming-sessions"] as const,
  revenue: () => [...dashboardKeys.all, "revenue"] as const,
  topLearners: () => [...dashboardKeys.all, "top-learners"] as const,
  trainerStats: (id: string) =>
    [...dashboardKeys.all, "trainer-stats", id] as const,
  trainerSessions: (id: string) =>
    [...dashboardKeys.all, "trainer-sessions", id] as const,
  learnerStats: (id: string) =>
    [...dashboardKeys.all, "learner-stats", id] as const,
  learnerSessions: (id: string) =>
    [...dashboardKeys.all, "learner-sessions", id] as const,
}

export interface DashboardStats {
  totalLearners: number
  activeCourses: number
  completionsThisMonth: number
  sessionsThisWeek: number
  upcomingSessions: number
  certificatesIssued: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

  const nowISO = now.toISOString()

  const [learners, courses, completions, sessions, upcoming, certificates] =
    await Promise.all([
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
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", monthStart),
      supabase
        .from("training_sessions")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", weekStart)
        .lte("starts_at", weekEnd)
        .is("deleted_at", null),
      supabase
        .from("training_sessions")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", nowISO)
        .neq("status", "cancelled")
        .is("deleted_at", null),
      supabase
        .from("learner_certificates")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
    ])

  const firstError =
    learners.error ||
    courses.error ||
    completions.error ||
    sessions.error ||
    upcoming.error ||
    certificates.error
  if (firstError) {
    console.error("[getDashboardStats]", firstError)
    throw firstError
  }

  return {
    totalLearners: learners.count ?? 0,
    activeCourses: courses.count ?? 0,
    completionsThisMonth: completions.count ?? 0,
    sessionsThisWeek: sessions.count ?? 0,
    upcomingSessions: upcoming.count ?? 0,
    certificatesIssued: certificates.count ?? 0,
  }
}

export interface CompletionTrend {
  categories: string[]
  data: number[]
}

export async function getCompletionTrend(): Promise<CompletionTrend> {
  const now = new Date()
  const since = startOfMonth(subMonths(now, 5)).toISOString()

  const { data, error } = await supabase
    .from("enrollments")
    .select("completed_at")
    .eq("status", "completed")
    .gte("completed_at", since)

  if (error) {
    console.error("[getCompletionTrend]", error)
    throw error
  }

  // Build last-6-months buckets, default 0.
  const buckets: { key: string; label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    buckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM"), count: 0 })
  }
  for (const row of data ?? []) {
    if (!row.completed_at) continue
    const key = format(new Date(row.completed_at), "yyyy-MM")
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.count += 1
  }

  return {
    categories: buckets.map((b) => b.label),
    data: buckets.map((b) => b.count),
  }
}

export interface AttendanceBreakdown {
  labels: string[]
  series: number[]
  total: number
}

export async function getAttendanceBreakdown(): Promise<AttendanceBreakdown> {
  const statuses: { key: AttendanceStatus; label: string }[] = [
    { key: "present", label: "Present" },
    { key: "late", label: "Late" },
    { key: "excused", label: "Excused" },
    { key: "absent", label: "Absent" },
  ]

  const results = await Promise.all(
    statuses.map((s) =>
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("status", s.key),
    ),
  )

  const errored = results.find((r) => r.error)
  if (errored?.error) {
    console.error("[getAttendanceBreakdown]", errored.error)
    throw errored.error
  }

  const series = results.map((r) => r.count ?? 0)
  return {
    labels: statuses.map((s) => s.label),
    series,
    total: series.reduce((a, b) => a + b, 0),
  }
}

export interface RecentEnrolment {
  id: string
  learnerName: string
  courseTitle: string
  status: EnrollmentStatus
  progressPct: number
  enrolledAt: string
}

export async function getRecentEnrolments(): Promise<RecentEnrolment[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, learner_id, course_id, status, progress_pct, enrolled_at")
    .is("deleted_at", null)
    .order("enrolled_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("[getRecentEnrolments]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const learnerIds = [...new Set(data.map((d) => d.learner_id))]
  const courseIds = [...new Set(data.map((d) => d.course_id))]

  const [learners, courses] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name")
      .in("id", learnerIds),
    supabase.from("courses").select("id, title").in("id", courseIds),
  ])

  const nameById = new Map(
    (learners.data ?? []).map((p) => [
      p.id,
      p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        "Unknown learner",
    ]),
  )
  const titleById = new Map(
    (courses.data ?? []).map((c) => [c.id, c.title]),
  )

  return data.map((d) => ({
    id: d.id,
    learnerName: nameById.get(d.learner_id) ?? "Unknown learner",
    courseTitle: titleById.get(d.course_id) ?? "Untitled course",
    status: d.status,
    progressPct: d.progress_pct,
    enrolledAt: d.enrolled_at,
  }))
}

export interface UpcomingSession {
  id: string
  title: string
  startsAt: string
  isVirtual: boolean
  status: SessionStatus
}

export async function getUpcomingSessions(): Promise<UpcomingSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, starts_at, is_virtual, status")
    .gte("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(5)

  if (error) {
    console.error("[getUpcomingSessions]", error)
    throw error
  }

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.starts_at,
    isVirtual: s.is_virtual,
    status: s.status,
  }))
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCompletionTrend() {
  return useQuery({
    queryKey: dashboardKeys.completionTrend(),
    queryFn: getCompletionTrend,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAttendanceBreakdown() {
  return useQuery({
    queryKey: dashboardKeys.attendance(),
    queryFn: getAttendanceBreakdown,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecentEnrolments() {
  return useQuery({
    queryKey: dashboardKeys.recentEnrolments(),
    queryFn: getRecentEnrolments,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpcomingSessions() {
  return useQuery({
    queryKey: dashboardKeys.upcomingSessions(),
    queryFn: getUpcomingSessions,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Revenue overview (admin) ────────────────────────────────────────────────
export interface RevenueOverview {
  /** Total invoiced (sent + paid), in pence. */
  billedPence: number
  /** Total collected (paid), in pence. */
  paidPence: number
  /** Outstanding (sent, not yet paid), in pence. */
  outstandingPence: number
  invoiceCount: number
  paidCount: number
}

export async function getRevenueOverview(): Promise<RevenueOverview> {
  const { data, error } = await supabase
    .from("invoices")
    .select("total_pence, status")
  if (error) {
    console.error("[getRevenueOverview]", error)
    throw error
  }
  let billedPence = 0
  let paidPence = 0
  let invoiceCount = 0
  let paidCount = 0
  for (const row of data ?? []) {
    if (row.status === "void" || row.status === "draft") continue
    billedPence += row.total_pence
    invoiceCount += 1
    if (row.status === "paid") {
      paidPence += row.total_pence
      paidCount += 1
    }
  }
  return {
    billedPence,
    paidPence,
    outstandingPence: billedPence - paidPence,
    invoiceCount,
    paidCount,
  }
}

export function useRevenueOverview() {
  return useQuery({
    queryKey: dashboardKeys.revenue(),
    queryFn: getRevenueOverview,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Top learners (admin) ────────────────────────────────────────────────────
export interface TopLearner {
  id: string
  name: string
  completed: number
}

export async function getTopLearners(): Promise<TopLearner[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("learner_id")
    .eq("status", "completed")
    .is("deleted_at", null)
    .limit(2000)
  if (error) {
    console.error("[getTopLearners]", error)
    throw error
  }
  if (!data || data.length === 0) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    counts.set(row.learner_id, (counts.get(row.learner_id) ?? 0) + 1)
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const ids = top.map(([id]) => id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .in("id", ids)
  const nameById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        "Unknown learner",
    ]),
  )

  return top.map(([id, completed]) => ({
    id,
    name: nameById.get(id) ?? "Unknown learner",
    completed,
  }))
}

export function useTopLearners() {
  return useQuery({
    queryKey: dashboardKeys.topLearners(),
    queryFn: getTopLearners,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Trainer dashboard ───────────────────────────────────────────────────────
export interface TrainerStats {
  upcomingSessions: number
  myLearners: number
  myCourses: number
}

export async function getTrainerStats(
  trainerId: string,
): Promise<TrainerStats> {
  const nowISO = new Date().toISOString()

  // Sessions led by this trainer (upcoming) and all their session ids.
  const [upcoming, allSessions, courses] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainerId)
      .gte("starts_at", nowISO)
      .neq("status", "cancelled")
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

  const firstError = upcoming.error || allSessions.error || courses.error
  if (firstError) {
    console.error("[getTrainerStats]", firstError)
    throw firstError
  }

  // Distinct learners booked onto this trainer's sessions.
  const sessionIds = (allSessions.data ?? []).map((s) => s.id)
  let myLearners = 0
  if (sessionIds.length) {
    const { data: bookings, error: bErr } = await supabase
      .from("session_bookings")
      .select("learner_id")
      .in("session_id", sessionIds)
    if (bErr) {
      console.error("[getTrainerStats:bookings]", bErr)
      throw bErr
    }
    myLearners = new Set((bookings ?? []).map((b) => b.learner_id)).size
  }

  return {
    upcomingSessions: upcoming.count ?? 0,
    myLearners,
    myCourses: courses.count ?? 0,
  }
}

export function useTrainerStats(trainerId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.trainerStats(trainerId ?? "none"),
    queryFn: () => getTrainerStats(trainerId as string),
    enabled: !!trainerId,
    staleTime: 5 * 60 * 1000,
  })
}

export interface TrainerSession {
  id: string
  title: string
  startsAt: string
  endsAt: string
  venue: string
  isVirtual: boolean
  joinUrl: string | null
  status: SessionStatus
}

export async function getTrainerUpcomingSessions(
  trainerId: string,
): Promise<TrainerSession[]> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, title, starts_at, ends_at, venue, is_virtual, status, zoom_start_url, zoom_join_url, meet_url",
    )
    .eq("trainer_id", trainerId)
    .gte("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(6)
  if (error) {
    console.error("[getTrainerUpcomingSessions]", error)
    throw error
  }
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    venue: s.venue ?? "",
    isVirtual: s.is_virtual,
    // Trainers get the host start link where available.
    joinUrl: s.zoom_start_url ?? s.zoom_join_url ?? s.meet_url ?? null,
    status: s.status,
  }))
}

export function useTrainerUpcomingSessions(trainerId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.trainerSessions(trainerId ?? "none"),
    queryFn: () => getTrainerUpcomingSessions(trainerId as string),
    enabled: !!trainerId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Learner dashboard ───────────────────────────────────────────────────────
export interface LearnerStats {
  enrolledCourses: number
  completedCourses: number
  certificates: number
}

export async function getLearnerStats(
  learnerId: string,
): Promise<LearnerStats> {
  const [enrolled, completed, certificates] = await Promise.all([
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
  ])

  const firstError = enrolled.error || completed.error || certificates.error
  if (firstError) {
    console.error("[getLearnerStats]", firstError)
    throw firstError
  }

  return {
    enrolledCourses: enrolled.count ?? 0,
    completedCourses: completed.count ?? 0,
    certificates: certificates.count ?? 0,
  }
}

export function useLearnerStats(learnerId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.learnerStats(learnerId ?? "none"),
    queryFn: () => getLearnerStats(learnerId as string),
    enabled: !!learnerId,
    staleTime: 5 * 60 * 1000,
  })
}

export interface LearnerSession {
  id: string
  title: string
  startsAt: string
  isVirtual: boolean
  joinUrl: string | null
  status: SessionStatus
}

export async function getLearnerUpcomingSessions(
  learnerId: string,
): Promise<LearnerSession[]> {
  const { data: bookings, error: bErr } = await supabase
    .from("session_bookings")
    .select("session_id")
    .eq("learner_id", learnerId)
  if (bErr) {
    console.error("[getLearnerUpcomingSessions:bookings]", bErr)
    throw bErr
  }
  const sessionIds = [...new Set((bookings ?? []).map((b) => b.session_id))]
  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, starts_at, is_virtual, status, zoom_join_url, meet_url")
    .in("id", sessionIds)
    .gte("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(6)
  if (error) {
    console.error("[getLearnerUpcomingSessions]", error)
    throw error
  }
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.starts_at,
    isVirtual: s.is_virtual,
    joinUrl: s.zoom_join_url ?? s.meet_url ?? null,
    status: s.status,
  }))
}

export function useLearnerUpcomingSessions(learnerId: string | undefined) {
  return useQuery({
    queryKey: dashboardKeys.learnerSessions(learnerId ?? "none"),
    queryFn: () => getLearnerUpcomingSessions(learnerId as string),
    enabled: !!learnerId,
    staleTime: 5 * 60 * 1000,
  })
}
