import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { EmailCampaign, MailMessage } from "@/types/database.types"

/* The generated Database type predates the 036 webmail columns (folder,
 * category, important, trashed_at, to_addr, is_draft). We cannot edit
 * database.types.ts, so the mail_messages table is reached through a small
 * hand-written builder interface keyed to MailRow. This is the single typed
 * escape hatch; everything downstream stays strongly typed via MailRow. */
interface MailResult {
  data: MailRow[] | null
  error: { message: string } | null
}
interface MailSingleResult {
  data: { id: string } | null
  error: { message: string } | null
}
type MailColumn = keyof MailRow
interface MailFilter extends PromiseLike<MailResult> {
  eq(column: MailColumn, value: unknown): MailFilter
  neq(column: MailColumn, value: unknown): MailFilter
  order(column: MailColumn | string, opts?: { ascending?: boolean; nullsFirst?: boolean }): MailFilter
  limit(n: number): MailFilter
}
interface MailWriteResult extends PromiseLike<{ error: { message: string } | null }> {
  eq(column: MailColumn, value: unknown): MailWriteResult
  select(cols: string): { single(): PromiseLike<MailSingleResult> }
}
interface MailBuilder {
  select(cols?: string): MailFilter
  insert(values: Partial<MailRow>): MailWriteResult
  update(values: Partial<MailRow>): MailWriteResult
  delete(): MailWriteResult
}

function mailTable(): MailBuilder {
  return supabase.from("mail_messages") as unknown as MailBuilder
}

/* ============================================================ campaigns === */

export function useCampaigns() {
  return useQuery({
    queryKey: ["email", "campaigns"],
    queryFn: async (): Promise<EmailCampaign[]> => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(100)
      if (error) {
        console.error("[useCampaigns]", error)
        throw error
      }
      return (data ?? []) as EmailCampaign[]
    },
  })
}

export function useScheduleCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      subject: string
      message: string
      audience: string
      scheduledAt: string
      createdBy: string
    }) => {
      const { error } = await supabase.from("email_campaigns").insert({
        subject: input.subject.trim(),
        message: input.message.trim(),
        audience: input.audience,
        scheduled_at: new Date(input.scheduledAt).toISOString(),
        created_by: input.createdBy,
      })
      if (error) {
        console.error("[useScheduleCampaign]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email", "campaigns"] }),
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("status", "scheduled")
      if (error) {
        console.error("[useCancelCampaign]", error)
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email", "campaigns"] }),
  })
}

/* ================================================================ webmail === */

export type MailFolder = "inbox" | "sent" | "important" | "draft" | "trash"
export type MailCategory = "work" | "private" | "support" | "social"

/** Row shape after the 036 migration (folder/label/draft columns). The base
 *  MailMessage type predates these columns, so we extend it here rather than
 *  editing database.types.ts. */
export interface MailRow extends MailMessage {
  folder: "inbox" | "sent" | "draft" | "trash"
  category: MailCategory | null
  important: boolean
  trashed_at: string | null
  to_addr: string | null
  is_draft: boolean
}

export const mailKeys = {
  list: (folder: MailFolder, category: MailCategory | "all") =>
    ["mail", "list", folder, category] as const,
  counts: () => ["mail", "counts"] as const,
  detail: (id: string) => ["mail", "detail", id] as const,
}

const KNOWN_CATEGORIES: ReadonlySet<string> = new Set([
  "work",
  "private",
  "support",
  "social",
])

/** Normalise a raw mail_messages row into a safe MailRow: attachments always
 *  an array, category constrained to the known set (legacy/unknown labels are
 *  dropped to null so rendering never indexes a missing map entry). */
function normaliseMailRow(raw: MailRow): MailRow {
  const attachments = Array.isArray(raw.attachments) ? raw.attachments : []
  const category =
    raw.category && KNOWN_CATEGORIES.has(raw.category) ? raw.category : null
  return { ...raw, attachments, category }
}

/** Messages for a folder, optionally filtered by a label/category. Trash is
 *  excluded everywhere except the Trash folder; "important" is a virtual
 *  folder across non-trashed mail flagged important. */
export function useMailList(folder: MailFolder, category: MailCategory | "all" = "all") {
  return useQuery({
    queryKey: mailKeys.list(folder, category),
    queryFn: async (): Promise<MailRow[]> => {
      let q = mailTable().select("*")

      // Each folder uses a single, unambiguous predicate. The Important view is
      // a virtual folder over all non-trashed mail flagged important, so it is
      // the only one that needs the extra "not trash" guard.
      if (folder === "important") {
        q = q.eq("important", true).neq("folder", "trash")
      } else {
        q = q.eq("folder", folder)
      }

      if (category !== "all") q = q.eq("category", category)

      const { data, error } = await q
        .order("received_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) {
        console.error("[useMailList]", error)
        throw error
      }
      return (Array.isArray(data) ? data : []).map(normaliseMailRow)
    },
  })
}

export interface MailCounts {
  inbox: number
  sent: number
  important: number
  draft: number
  trash: number
}

/** Per-folder counts for the sidebar. Inbox count is unread only. */
export function useMailCounts() {
  return useQuery({
    queryKey: mailKeys.counts(),
    staleTime: 30 * 1000,
    queryFn: async (): Promise<MailCounts> => {
      const { data, error } = await mailTable()
        .select("folder, important, seen")
        .limit(2000)
      if (error) {
        console.error("[useMailCounts]", error)
        throw error
      }
      const rows = (data ?? []) as Pick<MailRow, "folder" | "important" | "seen">[]
      const counts: MailCounts = { inbox: 0, sent: 0, important: 0, draft: 0, trash: 0 }
      for (const r of rows) {
        if (r.folder === "trash") {
          counts.trash += 1
          continue
        }
        if (r.folder === "inbox" && !r.seen) counts.inbox += 1
        if (r.folder === "sent") counts.sent += 1
        if (r.folder === "draft") counts.draft += 1
        if (r.important) counts.important += 1
      }
      return counts
    },
  })
}

function invalidateMail(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["mail"] })
}

/** Toggle the Important flag on a message. */
export function useToggleImportant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; important: boolean }) => {
      const { error } = await mailTable()
        .update({ important: input.important })
        .eq("id", input.id)
      if (error) {
        console.error("[useToggleImportant]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Set the category/label on a message. */
export function useSetCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; category: MailCategory | null }) => {
      const { error } = await mailTable()
        .update({ category: input.category })
        .eq("id", input.id)
      if (error) {
        console.error("[useSetCategory]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Move a message to Trash (soft delete via folder flag). */
export function useTrashMail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mailTable()
        .update({ folder: "trash", trashed_at: new Date().toISOString() })
        .eq("id", id)
      if (error) {
        console.error("[useTrashMail]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Restore a trashed message back to its natural folder. */
export function useRestoreMail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; isDraft: boolean }) => {
      const { error } = await mailTable()
        .update({
          folder: input.isDraft ? "draft" : "inbox",
          trashed_at: null,
        })
        .eq("id", input.id)
      if (error) {
        console.error("[useRestoreMail]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Permanently delete a single trashed message. */
export function useDeleteMailForever() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mailTable().delete().eq("id", id)
      if (error) {
        console.error("[useDeleteMailForever]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Mark a message read/seen. */
export function useMarkMailSeen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await mailTable()
        .update({ seen: true })
        .eq("id", id)
      if (error) {
        console.error("[useMarkMailSeen]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}

export interface DraftInput {
  id?: string
  ownerId: string
  to: string
  subject: string
  body: string
}

/** Save (insert or update) a draft. Drafts live in mail_messages with
 *  folder='draft'. Returns the row id. */
export function useSaveDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: DraftInput): Promise<string> => {
      const payload = {
        owner_id: input.ownerId,
        folder: "draft" as const,
        is_draft: true,
        seen: true,
        to_addr: input.to.trim() || null,
        subject: input.subject.trim() || "(no subject)",
        snippet: input.body.trim().slice(0, 140),
        body_text: input.body,
      }
      if (input.id) {
        const { error } = await mailTable()
          .update(payload)
          .eq("id", input.id)
        if (error) {
          console.error("[useSaveDraft:update]", error)
          throw error
        }
        return input.id
      }
      const { data, error } = await mailTable()
        .insert(payload)
        .select("id")
        .single()
      if (error || !data) {
        console.error("[useSaveDraft:insert]", error)
        throw error ?? new Error("Draft not saved")
      }
      return data.id
    },
    onSuccess: () => invalidateMail(qc),
  })
}

/** Record a locally-composed message as a Sent copy after the edge function
 *  has dispatched it. Keeps the Sent folder populated. */
export function useRecordSent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      ownerId: string
      to: string
      subject: string
      body: string
      draftId?: string
    }) => {
      // Promote a draft to sent, or insert a fresh sent record.
      const payload = {
        owner_id: input.ownerId,
        folder: "sent" as const,
        is_draft: false,
        seen: true,
        to_addr: input.to.trim() || null,
        from_addr: "info@vitalcare.uk",
        subject: input.subject.trim() || "(no subject)",
        snippet: input.body.trim().slice(0, 140),
        body_text: input.body,
        received_at: new Date().toISOString(),
      }
      if (input.draftId) {
        const { error } = await mailTable()
          .update(payload)
          .eq("id", input.draftId)
        if (error) {
          console.error("[useRecordSent:promote]", error)
          throw error
        }
        return
      }
      const { error } = await mailTable().insert(payload)
      if (error) {
        console.error("[useRecordSent:insert]", error)
        throw error
      }
    },
    onSuccess: () => invalidateMail(qc),
  })
}
