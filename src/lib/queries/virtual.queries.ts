import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { TrainingSession } from "@/types/database.types"

export function useVirtualSessions() {
  return useQuery({
    queryKey: ["virtual", "sessions"],
    queryFn: async (): Promise<TrainingSession[]> => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("is_virtual", true)
        .is("deleted_at", null)
        .order("starts_at", { ascending: true })
        .limit(200)
      if (error) {
        console.error("[useVirtualSessions]", error)
        throw error
      }
      return (data ?? []) as TrainingSession[]
    },
  })
}

/* ---------------------------------------------------- join requests ------- */
// session_join_requests is added in migration 076 and is not in the generated
// database types, so it is reached through a narrow loose-typed builder.

type SjrRow = Record<string, unknown>
interface SjrFilter
  extends PromiseLike<{ data: SjrRow[] | null; error: { message: string } | null }> {
  eq(c: string, v: unknown): SjrFilter
  in(c: string, v: unknown[]): SjrFilter
  order(c: string, o: { ascending: boolean }): SjrFilter
}
interface SjrUpdate {
  eq(c: string, v: unknown): PromiseLike<{ error: { message: string } | null }>
}
interface SjrTable {
  select(cols: string): SjrFilter
  insert(v: SjrRow): PromiseLike<{ error: { message: string } | null }>
  upsert(
    v: SjrRow,
    opts: { onConflict: string },
  ): PromiseLike<{ error: { message: string } | null }>
  update(v: SjrRow): SjrUpdate
}
function sjr(): SjrTable {
  return supabase.from("session_join_requests" as never) as unknown as SjrTable
}

export type JoinStatus = "pending" | "approved" | "declined"
export const virtualKeys = {
  myRequests: (userId: string) => ["virtual", "join", "mine", userId] as const,
  pending: () => ["virtual", "join", "pending"] as const,
}

/** Map of session_id -> this learner's join request status. */
export function useMyJoinRequests(userId: string | undefined) {
  return useQuery({
    queryKey: virtualKeys.myRequests(userId ?? "anon"),
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Record<string, JoinStatus>> => {
      const { data, error } = await sjr()
        .select("session_id, status")
        .eq("learner_id", userId!)
      if (error) {
        console.error("[useMyJoinRequests]", error)
        return {}
      }
      const out: Record<string, JoinStatus> = {}
      for (const r of data ?? []) {
        out[String(r.session_id)] = r.status as JoinStatus
      }
      return out
    },
  })
}

export interface PendingJoinRequest {
  id: string
  sessionId: string
  learnerId: string
  learnerName: string
}

/** Pending join requests across sessions, for admins to approve. */
export function usePendingJoinRequests(enabled: boolean) {
  return useQuery({
    queryKey: virtualKeys.pending(),
    enabled,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<PendingJoinRequest[]> => {
      const { data, error } = await sjr()
        .select("id, session_id, learner_id, status")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
      if (error) {
        console.error("[usePendingJoinRequests]", error)
        return []
      }
      const rows = data ?? []
      const learnerIds = [...new Set(rows.map((r) => String(r.learner_id)))]
      const nameById = new Map<string, string>()
      if (learnerIds.length) {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", learnerIds)
        for (const p of people ?? [])
          nameById.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Learner",
          )
      }
      return rows.map((r) => ({
        id: String(r.id),
        sessionId: String(r.session_id),
        learnerId: String(r.learner_id),
        learnerName: nameById.get(String(r.learner_id)) ?? "Learner",
      }))
    },
  })
}

/** Learner raises a request to join a virtual session. */
export function useRequestJoin(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!userId) throw new Error("Sign in to request a place")
      // Upsert so a learner can re-request (for example after a decline)
      // without hitting the unique-constraint error. Resets the row to pending.
      const { error } = await sjr().upsert(
        {
          session_id: sessionId,
          learner_id: userId,
          status: "pending",
          decided_by: null,
          decided_at: null,
        },
        { onConflict: "session_id,learner_id" },
      )
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: virtualKeys.myRequests(userId) })
    },
  })
}

/** Admin approves or declines a join request, and notifies the learner. */
export function useDecideJoin(deciderId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      learnerId: string
      approve: boolean
    }) => {
      const { error } = await sjr()
        .update({
          status: input.approve ? "approved" : "declined",
          decided_by: deciderId ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq("id", input.id)
      if (error) throw new Error(error.message)

      await supabase.from("notifications").insert({
        user_id: input.learnerId,
        type: "session" as const,
        title: input.approve ? "Join request approved" : "Join request declined",
        body: input.approve
          ? "You can now join the virtual session from the Virtual training page."
          : "Your request to join a virtual session was not approved.",
        link: "/platform/virtual",
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: virtualKeys.pending() })
      qc.invalidateQueries({ queryKey: ["virtual", "join", "mine"] })
    },
  })
}

/** Fetch a session's join link, gated server-side to approved learners/staff. */
export async function getSessionJoinLink(
  sessionId: string,
): Promise<{ meet_url: string | null; zoom_join_url: string | null } | null> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{
    data: { meet_url: string | null; zoom_join_url: string | null }[] | null
    error: { message: string } | null
  }>
  const { data, error } = await rpc("get_session_join_link", { p_session_id: sessionId })
  if (error) {
    console.error("[getSessionJoinLink]", error)
    return null
  }
  return data?.[0] ?? null
}
