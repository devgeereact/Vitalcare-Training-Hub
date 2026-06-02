import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { notifyAllUsers } from "@/lib/queries/communication.queries"
import type { ForumPost, ForumThread, ForumThreadKind } from "@/types/database.types"

export const forumKeys = {
  threads: (kind: ForumThreadKind, courseId?: string) =>
    ["forum", "threads", kind, courseId ?? "all"] as const,
  thread: (id: string) => ["forum", "thread", id] as const,
}

/* forum_post_likes (migration 038) is not in the generated Database type, so
 * reach it through a small typed builder. Single escape hatch for this table. */
interface LikeRow {
  post_id: string
  user_id: string
}
interface LikeSelect extends PromiseLike<{ data: LikeRow[] | null; error: unknown }> {
  in(column: "post_id", values: string[]): LikeSelect
}
interface LikeWrite extends PromiseLike<{ error: { code?: string } | null }> {
  eq(column: "post_id" | "user_id", value: string): LikeWrite
}
interface LikesBuilder {
  select(cols: string): LikeSelect
  insert(values: LikeRow): LikeWrite
  delete(): LikeWrite
}
function likesTable(): LikesBuilder {
  return (supabase.from as unknown as (t: string) => LikesBuilder)("forum_post_likes")
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

export interface ForumPostRow extends ForumPost {
  authorName: string
  authorAvatar: string | null
  likeCount: number
  likedByMe: boolean
}

export interface ThreadDetail {
  thread: ForumThread
  posts: ForumPostRow[]
}

export function useThreadDetail(id: string, viewerId?: string) {
  return useQuery({
    queryKey: [...forumKeys.thread(id), viewerId ?? "anon"],
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

      // Resolve author names + avatars.
      const ids = [...new Set(list.map((p) => p.author_id).filter(Boolean))] as string[]
      const nameById = new Map<string, string>()
      const avatarById = new Map<string, string | null>()
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, avatar_url")
          .in("id", ids)
        for (const p of profiles ?? []) {
          nameById.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Unknown",
          )
          avatarById.set(p.id, p.avatar_url ?? null)
        }
      }

      // Like counts + which posts the viewer has liked.
      const postIds = list.map((p) => p.id)
      const likeCounts = new Map<string, number>()
      const likedByMe = new Set<string>()
      if (postIds.length) {
        const { data: likes } = await likesTable()
          .select("post_id, user_id")
          .in("post_id", postIds)
        for (const l of likes ?? []) {
          likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1)
          if (viewerId && l.user_id === viewerId) likedByMe.add(l.post_id)
        }
      }

      return {
        thread: thread as ForumThread,
        posts: list.map((p) => ({
          ...p,
          authorName: p.author_id ? nameById.get(p.author_id) ?? "Unknown" : "Unknown",
          authorAvatar: p.author_id ? avatarById.get(p.author_id) ?? null : null,
          likeCount: likeCounts.get(p.id) ?? 0,
          likedByMe: likedByMe.has(p.id),
        })),
      }
    },
  })
}

/** Toggle the current user's like on a forum post. */
export function useTogglePostLike(threadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { postId: string; userId: string; liked: boolean }) => {
      if (input.liked) {
        const { error } = await likesTable()
          .delete()
          .eq("post_id", input.postId)
          .eq("user_id", input.userId)
        if (error) {
          console.error("[useTogglePostLike:delete]", error)
          throw error
        }
      } else {
        const { error } = await likesTable()
          .insert({ post_id: input.postId, user_id: input.userId })
        if (error && error.code !== "23505") {
          console.error("[useTogglePostLike:insert]", error)
          throw error
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: forumKeys.thread(threadId) }),
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
      /** When true, every user gets a notification about the new topic. */
      notifyEveryone?: boolean
      basePath?: string
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
      if (input.notifyEveryone) {
        const base = input.basePath ?? "/platform/forums"
        try {
          await notifyAllUsers({
            title: "New forum topic",
            body: input.title.trim(),
            link: `${base}/${thread.id}`,
            exceptUserId: input.authorId,
            type: "info",
          })
        } catch (err) {
          // Notification failure must not roll back the thread.
          console.error("[useCreateThread:notify]", err)
        }
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
