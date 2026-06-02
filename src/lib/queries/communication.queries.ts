import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type {
  Announcement,
  Message,
  Notification,
} from "@/types/database.types"

/* ---------------------------------------------------------------- keys ---- */

export const commKeys = {
  notifications: (userId: string) => ["notifications", userId] as const,
  threads: (userId: string) => ["messages", "threads", userId] as const,
  thread: (userId: string, otherId: string) =>
    ["messages", "thread", userId, otherId] as const,
  announcements: () => ["announcements", "list"] as const,
}

/* --------------------------------------------------------- notifications -- */

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: commKeys.notifications(userId ?? "anon"),
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) {
        console.error("[useNotifications]", error)
        throw error
      }
      return (data ?? []) as Notification[]
    },
  })
}

export function useMarkNotification(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id?: string; all?: boolean }) => {
      const now = new Date().toISOString()
      let q = supabase.from("notifications").update({ read_at: now })
      q = input.all
        ? q.eq("user_id", userId!).is("read_at", null)
        : q.eq("id", input.id!)
      const { error } = await q
      if (error) {
        console.error("[useMarkNotification]", error)
        throw error
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: commKeys.notifications(userId ?? "anon") }),
  })
}

/* -------------------------------------------------------------- messages -- */

export interface MessageThread {
  otherId: string
  otherName: string
  lastBody: string
  lastAt: string
  unread: number
}

/** Group flat messages into per-correspondent threads for the inbox list. */
export function useThreads(userId: string | undefined) {
  return useQuery({
    queryKey: commKeys.threads(userId ?? "anon"),
    enabled: !!userId,
    queryFn: async (): Promise<MessageThread[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500)
      if (error) {
        console.error("[useThreads]", error)
        throw error
      }
      const rows = (data ?? []) as Message[]
      const byOther = new Map<string, MessageThread>()
      for (const m of rows) {
        const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id
        const existing = byOther.get(otherId)
        const incomingUnread =
          m.recipient_id === userId && !m.read_at ? 1 : 0
        if (!existing) {
          byOther.set(otherId, {
            otherId,
            otherName: otherId,
            lastBody: m.body,
            lastAt: m.created_at,
            unread: incomingUnread,
          })
        } else {
          existing.unread += incomingUnread
        }
      }
      const threads = [...byOther.values()]
      const ids = threads.map((t) => t.otherId)
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", ids)
        const nameById = new Map(
          (profiles ?? []).map((p) => [
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Unknown",
          ]),
        )
        for (const t of threads) t.otherName = nameById.get(t.otherId) ?? "Unknown"
      }
      return threads
    },
  })
}

export function useThread(userId: string | undefined, otherId: string) {
  return useQuery({
    queryKey: commKeys.thread(userId ?? "anon", otherId),
    enabled: !!userId && !!otherId,
    queryFn: async (): Promise<ChatMessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`,
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
      if (error) {
        console.error("[useThread]", error)
        throw error
      }
      return (data ?? []) as unknown as ChatMessageRow[]
    },
  })
}

/** Mark all incoming messages from `otherId` as read. */
export function useMarkThreadRead(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (otherId: string) => {
      if (!userId) return
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("recipient_id", userId)
        .eq("sender_id", otherId)
        .is("read_at", null)
      if (error) {
        console.error("[useMarkThreadRead]", error)
        throw error
      }
    },
    onSuccess: (_d, otherId) => {
      qc.invalidateQueries({ queryKey: commKeys.thread(userId ?? "anon", otherId) })
      qc.invalidateQueries({ queryKey: commKeys.threads(userId ?? "anon") })
    },
  })
}

/** Chat message row including the 037 attachment columns (not yet in the
 *  generated Database type, so surfaced here). */
export interface ChatMessageRow extends Message {
  attachment_url: string | null
  attachment_name: string | null
  attachment_type: string | null
}

export interface SendMessageInput {
  recipientId: string
  body: string
  attachment?: { url: string; name: string; type: string }
}

export function useSendMessage(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const body = input.body.trim()
      if (!body && !input.attachment) throw new Error("Message is empty")
      // The attachment columns post-date database.types.ts; cast the payload.
      const payload: Record<string, unknown> = {
        sender_id: userId!,
        recipient_id: input.recipientId,
        body: body || (input.attachment ? `📎 ${input.attachment.name}` : ""),
      }
      if (input.attachment) {
        payload.attachment_url = input.attachment.url
        payload.attachment_name = input.attachment.name
        payload.attachment_type = input.attachment.type
      }
      const { error } = await supabase
        .from("messages")
        .insert(payload as never)
      if (error) {
        console.error("[useSendMessage]", error)
        throw error
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: commKeys.thread(userId ?? "anon", vars.recipientId),
      })
      qc.invalidateQueries({ queryKey: commKeys.threads(userId ?? "anon") })
    },
  })
}

/* --------------------------------------------------------- announcements -- */

export interface AnnouncementRow extends Announcement {
  authorName: string
}

export function useAnnouncements() {
  return useQuery({
    queryKey: commKeys.announcements(),
    queryFn: async (): Promise<AnnouncementRow[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) {
        console.error("[useAnnouncements]", error)
        throw error
      }
      const rows = (data ?? []) as Announcement[]
      const authorIds = [
        ...new Set(rows.map((r) => r.author_id).filter(Boolean)),
      ] as string[]
      const nameById = new Map<string, string>()
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", authorIds)
        for (const p of profiles ?? [])
          nameById.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Unknown",
          )
      }
      return rows.map((r) => ({
        ...r,
        authorName: r.author_id ? nameById.get(r.author_id) ?? "Team" : "Team",
      }))
    },
  })
}

export interface AnnouncementCreate {
  title: string
  body: string
  authorId: string
  actionAt?: string | null
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AnnouncementCreate) => {
      const { error } = await supabase.from("announcements").insert({
        title: input.title.trim(),
        body: input.body.trim(),
        author_id: input.authorId,
        published_at: new Date().toISOString(),
        action_at: input.actionAt ? new Date(input.actionAt).toISOString() : null,
      })
      if (error) {
        console.error("[useCreateAnnouncement]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commKeys.announcements() }),
  })
}

/* ----------------------------------------- acknowledgements + reminders --- */

export function useUnacknowledged(userId: string | undefined) {
  return useQuery({
    queryKey: ["announcements", "unacked", userId ?? "anon"],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AnnouncementRow[]> => {
      const { data: anns, error } = await supabase
        .from("announcements")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20)
      if (error) {
        console.error("[useUnacknowledged]", error)
        throw error
      }
      const { data: acks } = await supabase
        .from("announcement_acks")
        .select("announcement_id")
        .eq("user_id", userId!)
      const acked = new Set((acks ?? []).map((a) => a.announcement_id))
      const rows = ((anns ?? []) as Announcement[]).filter((a) => !acked.has(a.id))
      const authorIds = [...new Set(rows.map((r) => r.author_id).filter(Boolean))] as string[]
      const nameById = new Map<string, string>()
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", authorIds)
        for (const p of profiles ?? [])
          nameById.set(
            p.id,
            p.full_name ||
              [p.first_name, p.last_name].filter(Boolean).join(" ") ||
              "Team",
          )
      }
      return rows.map((r) => ({
        ...r,
        authorName: r.author_id ? nameById.get(r.author_id) ?? "Team" : "Team",
      }))
    },
  })
}

/** Acknowledge an announcement; if it has an action time, schedule a reminder
 *  sequence (1 day before, 2 hours before, at the time) for the user. */
export function useAcknowledge(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      announcementId: string
      title: string
      actionAt: string | null
      addReminders: boolean
    }) => {
      const { error } = await supabase.from("announcement_acks").insert({
        announcement_id: input.announcementId,
        user_id: userId!,
      })
      if (error && error.code !== "23505") {
        console.error("[useAcknowledge]", error)
        throw error
      }
      if (input.addReminders && input.actionAt && userId) {
        const at = new Date(input.actionAt).getTime()
        const now = Date.now()
        const schedule = [
          { offset: 24 * 60 * 60 * 1000, label: "tomorrow" },
          { offset: 2 * 60 * 60 * 1000, label: "in 2 hours" },
          { offset: 0, label: "now" },
        ]
        const rows = schedule
          .map((s) => ({ remind_at: new Date(at - s.offset), label: s.label }))
          .filter((s) => s.remind_at.getTime() > now)
          .map((s) => ({
            user_id: userId,
            title: `Reminder: ${input.title}`,
            body: `Action due ${new Date(input.actionAt!).toLocaleString("en-GB")}.`,
            link: "/platform/announcements",
            remind_at: s.remind_at.toISOString(),
          }))
        if (rows.length) await supabase.from("reminders").insert(rows)
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["announcements", "unacked", userId ?? "anon"] }),
  })
}

/* ----------------------------------------------------- notify all users --- */

/** Insert a notification row for every active profile. Used when an admin
 *  posts a forum topic or an announcement, so the whole hub is informed.
 *  Excludes the author and soft-deleted profiles. Returns the number queued. */
export async function notifyAllUsers(input: {
  title: string
  body: string
  link: string
  exceptUserId?: string
  type?: Notification["type"]
}): Promise<number> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .is("deleted_at", null)
  if (error) {
    console.error("[notifyAllUsers]", error)
    throw error
  }
  const rows = (profiles ?? [])
    .map((p) => p.id)
    .filter((id) => id !== input.exceptUserId)
    .map((id) => ({
      user_id: id,
      type: input.type ?? "info",
      title: input.title,
      body: input.body,
      link: input.link,
    }))
  if (!rows.length) return 0
  const { error: insErr } = await supabase.from("notifications").insert(rows)
  if (insErr) {
    console.error("[notifyAllUsers:insert]", insErr)
    throw insErr
  }
  return rows.length
}
