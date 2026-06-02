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
      const endIso = new Date(new Date(input.scheduledAt).getTime() + 30 * 60000).toISOString()

      const { data: row, error } = await supabase
        .from("one_to_one_requests")
        .update({
          status: "approved",
          trainer_id: input.trainerId,
          scheduled_at: startIso,
          decided_by: deciderId,
          decided_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("learner_id")
        .single()
      if (error) throw error

      // Calendar events for trainer + learner.
      await supabase.from("calendar_events").insert(
        [input.trainerId, row.learner_id].map((uid) => ({
          title: `1:1 — ${input.title}`,
          description: "One-to-one tutoring session.",
          starts_at: startIso,
          ends_at: endIso,
          all_day: false,
          color: "#7c3aed",
          created_by: uid,
          link: "/platform/one-to-one",
        })),
      )
      // Notifications (fire push) for trainer + learner.
      await supabase.from("notifications").insert(
        [input.trainerId, row.learner_id].map((uid) => ({
          user_id: uid,
          type: "session" as const,
          title: "1:1 session scheduled",
          body: `${input.title} — ${new Date(startIso).toLocaleString("en-GB")}`,
          link: "/platform/one-to-one",
        })),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: o2oKeys.all }),
  })
}
