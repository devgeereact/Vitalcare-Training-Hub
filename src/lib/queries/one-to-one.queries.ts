import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { OneToOneRequest } from "@/types/database.types"

export const o2oKeys = {
  all: ["one-to-one"] as const,
  list: (scope: string) => [...o2oKeys.all, scope] as const,
}

export interface O2ORow extends OneToOneRequest {
  learnerName: string
  trainerName: string | null
  courseTitle: string | null
}

async function decorate(rows: OneToOneRequest[]): Promise<O2ORow[]> {
  if (!rows.length) return []
  const personIds = [
    ...new Set(rows.flatMap((r) => [r.learner_id, r.trainer_id]).filter(Boolean)),
  ] as string[]
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))] as string[]
  const [{ data: people }, { data: courses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name")
      .in("id", personIds.length ? personIds : ["none"]),
    supabase.from("courses").select("id, title").in("id", courseIds.length ? courseIds : ["none"]),
  ])
  const name = new Map(
    (people ?? []).map((p) => [
      p.id,
      p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "User",
    ]),
  )
  const title = new Map((courses ?? []).map((c) => [c.id, c.title]))
  return rows.map((r) => ({
    ...r,
    learnerName: name.get(r.learner_id) ?? "Learner",
    trainerName: r.trainer_id ? name.get(r.trainer_id) ?? "Trainer" : null,
    courseTitle: r.course_id ? title.get(r.course_id) ?? "Course" : null,
  }))
}

/** Role-aware list: learners see their own, trainers theirs, staff all. */
export function useOneToOnes(userId: string | undefined, isStaff: boolean) {
  return useQuery({
    queryKey: o2oKeys.list(isStaff ? "all" : userId ?? "none"),
    enabled: !!userId,
    queryFn: async (): Promise<O2ORow[]> => {
      let q = supabase
        .from("one_to_one_requests")
        .select("*")
        .order("created_at", { ascending: false })
      if (!isStaff) q = q.or(`learner_id.eq.${userId},trainer_id.eq.${userId}`)
      const { data, error } = await q
      if (error) {
        console.error("[useOneToOnes]", error)
        throw error
      }
      return decorate((data ?? []) as OneToOneRequest[])
    },
  })
}

// ─── 1:1 eligibility gate ─────────────────────────────────────────────────────
// A learner may request 1:1 help on a course only once they have ATTEMPTED it
// and are struggling. "Struggling" means the learner is enrolled AND any of:
//   - has an assessment attempt on the course that did not pass, or
//   - has started but not finished (0 < progress < 100), or
//   - explicitly flags that they are having issues (handled in the UI by
//     allowing a request whenever the learner has started the course).
export interface O2OEligibility {
  enrolled: boolean
  started: boolean
  progressPct: number
  failedAttempt: boolean
  stalled: boolean
  /** True when the learner may open a 1:1 request for this course. */
  eligible: boolean
  reason: "not-enrolled" | "not-started" | "completed" | "struggling"
}

export function o2oEligibilityKey(courseId: string, userId: string | undefined) {
  return [...o2oKeys.all, "eligibility", courseId, userId ?? "none"] as const
}

export async function getO2OEligibility(
  courseId: string,
  userId: string,
): Promise<O2OEligibility> {
  // Enrolment + progress.
  const { data: enrol, error: enrolErr } = await supabase
    .from("enrollments")
    .select("progress_pct, status")
    .eq("course_id", courseId)
    .eq("learner_id", userId)
    .is("deleted_at", null)
    .maybeSingle()
  if (enrolErr) {
    console.error("[getO2OEligibility:enrol]", enrolErr)
    throw enrolErr
  }

  const enrolled = !!enrol
  const progressPct = enrol?.progress_pct ?? 0
  const started = enrolled && (progressPct > 0 || enrol?.status === "in_progress")

  // Assessment attempts on this course's assessments.
  let failedAttempt = false
  if (enrolled) {
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id")
      .eq("course_id", courseId)
      .is("deleted_at", null)
    const assessmentIds = (assessments ?? []).map((a) => a.id)
    if (assessmentIds.length) {
      const { data: attempts } = await supabase
        .from("assessment_attempts")
        .select("passed")
        .eq("learner_id", userId)
        .in("assessment_id", assessmentIds)
        .is("deleted_at", null)
      const rows = attempts ?? []
      // Failed/low: at least one attempt and none has passed yet.
      failedAttempt = rows.length > 0 && !rows.some((a) => a.passed)
    }
  }

  const stalled = enrolled && progressPct > 0 && progressPct < 100
  const completed = enrolled && progressPct >= 100
  // Eligible when the learner has attempted the course (started it) and is
  // struggling: a failing attempt, or stalled progress short of completion.
  const eligible = enrolled && started && (failedAttempt || stalled)

  let reason: O2OEligibility["reason"]
  if (!enrolled) reason = "not-enrolled"
  else if (!started) reason = "not-started"
  else if (completed && !failedAttempt) reason = "completed"
  else reason = "struggling"

  return { enrolled, started, progressPct, failedAttempt, stalled, eligible, reason }
}

export function useO2OEligibility(courseId: string, userId: string | undefined) {
  return useQuery({
    queryKey: o2oEligibilityKey(courseId, userId),
    enabled: !!courseId && !!userId,
    queryFn: () => getO2OEligibility(courseId, userId as string),
  })
}

export function useCreateOneToOne(learnerId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { courseId: string | null; preferredAt: string; note: string }) => {
      if (!learnerId) throw new Error("Not signed in")
      const { error } = await supabase.from("one_to_one_requests").insert({
        learner_id: learnerId,
        course_id: input.courseId,
        preferred_at: input.preferredAt ? new Date(input.preferredAt).toISOString() : null,
        note: input.note.trim() || null,
      })
      if (error) {
        console.error("[useCreateOneToOne]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: o2oKeys.all }),
  })
}

/** Staff decide a request. Approve assigns a trainer + time, drops calendar
 *  events on the trainer and learner, and notifies both. */
export function useDecideOneToOne(deciderId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      approve: boolean
      trainerId?: string
      scheduledAt?: string
      title: string
    }) => {
      if (!input.approve) {
        const { error } = await supabase
          .from("one_to_one_requests")
          .update({ status: "declined", decided_by: deciderId, decided_at: new Date().toISOString() })
          .eq("id", input.id)
        if (error) throw error
        return
      }
      if (!input.trainerId || !input.scheduledAt) {
        throw new Error("Assign a trainer and time to approve.")
      }
      const startIso = new Date(input.scheduledAt).toISOString()

      // A ready-to-use meeting link (Jitsi needs no API/account). Deterministic
      // per request so both parties land in the same room.
      const meetUrl = `https://meet.jit.si/vitalcare-1to1-${input.id}`

      const { data: row, error } = await supabase
        .from("one_to_one_requests")
        .update({
          status: "approved",
          trainer_id: input.trainerId,
          scheduled_at: startIso,
          meet_url: meetUrl,
          decided_by: deciderId,
          decided_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("learner_id")
        .single()
      if (error) throw error

      // The approved 1:1 surfaces on each party's calendar live (read from
      // one_to_one_requests), so no static calendar_events row is needed.
      // Notify trainer + learner, with the meeting link in the notification.
      await supabase.from("notifications").insert(
        [input.trainerId, row.learner_id].map((uid) => ({
          user_id: uid,
          type: "session" as const,
          title: "1:1 session scheduled",
          body: `${input.title} · ${new Date(startIso).toLocaleString("en-GB")}`,
          link: "/platform/one-to-one",
        })),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: o2oKeys.all }),
  })
}
