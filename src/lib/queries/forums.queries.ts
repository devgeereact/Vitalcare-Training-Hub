import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { ForumPost, ForumThread, ForumThreadKind } from "@/types/database.types"

export const forumKeys = {
  threads: (kind: ForumThreadKind, courseId?: string) =>
    ["forum", "threads", kind, courseId ?? "all"] as const,
  thread: (id: string) => ["forum", "thread", id] as const,
}

export interface ThreadRow extends ForumThread {
  authorName: string
  replyCount: number
}

async function resolveNames(ids: (string | null)[]): Promise<Map<string, string>> {
  const clean = [...new Set(ids.filter(Boolean))] as string[]
  const map = new Map<string, string>()
  if (!clean.length) return map
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name")
    .in("id", clean)
  for (const p of data ?? [])
    map.set(
      p.id,
      p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        "Unknown",
    )
  return map
}

export function useThreads(kind: ForumThreadKind, courseId?: string) {
  return useQuery({
    queryKey: forumKeys.threads(kind, courseId),
    queryFn: async (): Promise<ThreadRow[]> => {
      let q = supabase
        .from("forum_threads")
        .select("*")
        .eq("kind", kind)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (courseId) q = q.eq("course_id", courseId)
      const { data, error } = await q
      if (error) {
        console.error("[useThreads]", error)
        throw error
      }
      const threads = (data ?? []) as ForumThread[]
      if (!threads.length) return []
      const names = await resolveNames(threads.map((t) => t.created_by))
      const { data: counts } = await supabase
        .from("forum_posts")
        .select("thread_id")
        .in(
          "thread_id",
          threads.map((t) => t.id),
        )
        .is("deleted_at", null)
      const byThread = new Map<string, number>()
      for (const c of counts ?? [])
        byThread.set(c.thread_id, (byThread.get(c.thread_id) ?? 0) + 1)
      return threads.map((t) => ({
        ...t,
        authorName: t.created_by ? names.get(t.created_by) ?? "Unknown" : "Unknown",
        replyCount: byThread.get(t.id) ?? 0,
      }))
    },
  })
}

export interface ThreadDetail {
  thread: ForumThread
  posts: (ForumPost & { authorName: string })[]
}

export function useThreadDetail(id: string) {
  return useQuery({
    queryKey: forumKeys.thread(id),
    enabled: !!id,
    queryFn: async (): Promise<ThreadDetail> => {
      const { data: thread, error } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("id", id)
        .single()
      if (error) {
        console.error("[useThreadDetail]", error)
        throw error
      }
      const { data: posts } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("thread_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
      const list = (posts ?? []) as ForumPost[]
      const names = await resolveNames(list.map((p) => p.author_id))
      return {
        thread: thread as ForumThread,
        posts: list.map((p) => ({
          ...p,
          authorName: p.author_id ? names.get(p.author_id) ?? "Unknown" : "Unknown",
        })),
      }
    },
  })
}

export function useCreateThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      kind: ForumThreadKind
      title: string
      body: string
      courseId?: string
      authorId: string
    }) => {
      const { data: thread, error } = await supabase
        .from("forum_threads")
        .insert({
          kind: input.kind,
          title: input.title.trim(),
          course_id: input.courseId || null,
          created_by: input.authorId,
        })
        .select("id")
        .single()
      if (error) {
        console.error("[useCreateThread]", error)
        throw error
      }
      if (input.body.trim()) {
        await supabase.from("forum_posts").insert({
          thread_id: thread.id,
          author_id: input.authorId,
          body: input.body.trim(),
        })
      }
      return thread.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forum", "threads"] }),
  })
}

export function useReply(threadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { body: string; authorId: string; isAnswer?: boolean }) => {
      const { error } = await supabase.from("forum_posts").insert({
        thread_id: threadId,
        author_id: input.authorId,
        body: input.body.trim(),
        is_answer: input.isAnswer ?? false,
      })
      if (error) {
        console.error("[useReply]", error)
        throw error
      }
      if (input.isAnswer) {
        await supabase
          .from("forum_threads")
          .update({ is_resolved: true })
          .eq("id", threadId)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) })
      qc.invalidateQueries({ queryKey: ["forum", "threads"] })
    },
  })
}
