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
}

export interface DashboardStats {
  totalLearners: number
  activeCourses: number
  completionsThisMonth: number
  sessionsThisWeek: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

  const [learners, courses, completions, sessions] = await Promise.all([
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
  ])

  const firstError =
    learners.error || courses.error || completions.error || sessions.error
  if (firstError) {
    console.error("[getDashboardStats]", firstError)
    throw firstError
  }

  return {
    totalLearners: learners.count ?? 0,
    activeCourses: courses.count ?? 0,
    completionsThisMonth: completions.count ?? 0,
    sessionsThisWeek: sessions.count ?? 0,
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
