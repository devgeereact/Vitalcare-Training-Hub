import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  MessageSquare,
  AlertCircle,
  Send,
  ArrowLeft,
  Video,
  Loader2,
  Search,
  ShieldCheck,
  Paperclip,
  X,
  FileText,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase/client"
import { useCreateSession } from "@/lib/queries/sessions.queries"
import { useVerifiedUserIds } from "@/lib/queries/verification.queries"
import { VerifiedTick } from "@/components/platform/Verification"
import {
  useThreads,
  useAdminContacts,
  useSearchContacts,
  useThread,
  useSendMessage,
  useMarkThreadRead,
} from "@/lib/queries/communication.queries"
import EmojiPicker from "@/components/communication/EmojiPicker"
import AiReplyButton from "@/components/communication/AiReplyButton"
import { ChatMessageList } from "@/components/communication/ChatMessages"

const CHAT_BUCKET = "course-media"

interface PendingAttachment {
  url: string
  name: string
  type: string
}

function isImage(type: string | null): boolean {
  return !!type && type.startsWith("image/")
}

/** Relative time label, safe against missing/invalid timestamps. */
function relativeLabel(value: string | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "" : formatDistanceToNow(d, { addSuffix: true })
}

function ThreadView({
  userId,
  otherId,
  otherName,
  onBack,
}: {
  userId: string
  otherId: string
  otherName: string
  onBack: () => void
}) {
  const { data, isLoading, isError, refetch } = useThread(userId, otherId)
  const send = useSendMessage(userId)
  const markRead = useMarkThreadRead(userId)
  const verifiedIds = useVerifiedUserIds()
  const qc = useQueryClient()
  const [draft, setDraft] = useState("")
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum size is 10 MB." })
      return
    }
    setUploading(true)
    try {
      const path = `chat/${userId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`
      const { error } = await supabase.storage
        .from(CHAT_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: pub } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(path)
      setAttachment({ url: pub.publicUrl, name: file.name, type: file.type })
    } catch (err) {
      console.error("[chat upload]", err)
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  function insertEmoji(emoji: string) {
    setDraft((d) => d + emoji)
    inputRef.current?.focus()
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.length])

  // Mark incoming messages read whenever the thread updates.
  useEffect(() => {
    if (userId && (data ?? []).some((m) => m.sender_id === otherId && !m.read_at)) {
      markRead.mutate(otherId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, otherId, userId])

  // Realtime: live new messages + read receipts for this conversation.
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`messages:${userId}:${otherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            sender_id?: string
            recipient_id?: string
          }
          const involved =
            (row.sender_id === userId && row.recipient_id === otherId) ||
            (row.sender_id === otherId && row.recipient_id === userId)
          if (involved) {
            refetch()
            qc.invalidateQueries({ queryKey: ["messages", "threads", userId] })
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, otherId])

  function submit() {
    const body = draft.trim()
    if (!body && !attachment) return
    const pending = attachment
    setDraft("")
    setAttachment(null)
    send
      .mutateAsync({
        recipientId: otherId,
        body,
        attachment: pending ?? undefined,
      })
      .catch(() => {
        toast.error("Could not send. Please try again.")
        setDraft(body)
        setAttachment(pending)
      })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
          {otherName.slice(0, 1).toUpperCase()}
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{otherName}</span>
            {/* Always present so recipients can confirm who they are chatting with. */}
            <VerifiedTick verified={!!verifiedIds.data?.has(otherId)} />
          </p>
          <p className="text-xs text-success">Online</p>
        </div>
        <ScheduleMeetingButton
          otherName={otherName}
          onScheduled={(body) => send.mutateAsync({ recipientId: otherId, body })}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-10 w-2/3", i % 2 === 0 ? "ml-auto" : "")}
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load messages.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello to start the conversation.
            </p>
          </div>
        ) : (
          <ChatMessageList
            messages={data ?? []}
            userId={userId}
            otherName={otherName}
          />
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
            {isImage(attachment.type) ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="size-8 rounded object-cover"
              />
            ) : (
              <FileText className="size-4 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Attach a file"
            className="shrink-0 text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-gold"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Paperclip className="size-5" />
            )}
          </Button>
          <EmojiPicker onSelect={insertEmoji} />
          <AiReplyButton
            history={(data ?? []).map((m) => ({ mine: m.sender_id === userId, body: m.body }))}
            otherName={otherName}
            onDraft={(text) => setDraft(text)}
          />
          <Input
            ref={inputRef}
            placeholder="Write a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={(!draft.trim() && !attachment) || send.isPending || uploading}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScheduleMeetingButton({
  otherName,
  onScheduled,
}: {
  otherName: string
  onScheduled: (body: string) => Promise<unknown>
}) {
  const { isAdmin } = useUser()
  const createSession = useCreateSession()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(`Meeting with ${otherName}`)
  const [when, setWhen] = useState("")
  const [busy, setBusy] = useState(false)

  if (!isAdmin) return null

  async function schedule() {
    if (!when) {
      toast.error("Choose a date and time.")
      return
    }
    setBusy(true)
    try {
      const start = new Date(when)
      const end = new Date(start.getTime() + 30 * 60000)
      const id = await createSession.mutateAsync({
        title,
        description: "",
        course_id: "",
        trainer_id: "",
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        venue: "",
        capacity: 0,
        is_virtual: true,
        is_public: false,
        meeting_provider: "google_meet",
      })
      const { data: s } = await supabase
        .from("training_sessions")
        .select("meet_url, zoom_join_url")
        .eq("id", id)
        .single()
      const link = s?.meet_url || s?.zoom_join_url
      const body = link
        ? `📅 Meeting scheduled: ${title} on ${start.toLocaleString("en-GB")}\nJoin: ${link}`
        : `📅 Meeting scheduled: ${title} on ${start.toLocaleString("en-GB")} (link to follow).`
      await onScheduled(body)
      toast.success("Meeting scheduled and shared")
      setOpen(false)
      setWhen("")
    } catch {
      toast.error("Could not schedule the meeting.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Video className="mr-1.5 size-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a virtual meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Date &amp; time</Label>
            <DateTimePicker value={when} onChange={setWhen} />
          </div>
          <p className="text-xs text-muted-foreground">
            Creates a Google Meet (Zoom backup) and shares the link in this chat.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={schedule} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MessagesPage() {
  const { user, profile } = useAuth()
  const { data, isLoading, isError, refetch } = useThreads(user?.id)
  const adminContactsQ = useAdminContacts(user?.id)
  const verifiedIds = useVerifiedUserIds()
  const myName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "You"
  const [active, setActive] = useState<{ id: string; name: string } | null>(null)
  const [q, setQ] = useState("")
  const contactSearch = useSearchContacts(q)
  const [params, setParams] = useSearchParams()
  const threads = (data ?? []).filter((t) =>
    t.otherName.toLowerCase().includes(q.toLowerCase()),
  )
  // Contacts a learner can start a fresh chat with. With no search, show admins
  // for quick support. While searching, hit the server (search_contacts) so any
  // staff member is findable by name or email even though profiles RLS hides
  // them. Existing threads are excluded so they are not listed twice.
  const threadIds = new Set((data ?? []).map((t) => t.otherId))
  const searching = q.trim().length >= 2
  // While searching, show every match (clicking opens an existing thread or a
  // new one). In the default view, show admins without an existing thread.
  const adminContacts = searching
    ? contactSearch.data ?? []
    : (adminContactsQ.data ?? []).filter((a) => !threadIds.has(a.id))

  // Open a thread directly from a contact (Message button -> ?to=&name=).
  useEffect(() => {
    const to = params.get("to")
    if (!to) return
    setActive({ id: to, name: params.get("name") || "Contact" })
    params.delete("to")
    params.delete("name")
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Direct conversations with learners, trainers and staff.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid h-[calc(100svh-17rem)] min-h-[28rem] lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Thread list */}
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-col border-r border-border lg:overflow-hidden",
              active ? "hidden lg:flex" : "flex",
            )}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-border p-3">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                {myName.slice(0, 1).toUpperCase()}
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-success" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                  <span className="truncate">{myName}</span>
                  <VerifiedTick verified={!!profile?.is_verified} className="[&_svg]:size-3.5" />
                </p>
                <p className="text-xs text-success">Online</p>
              </div>
            </div>
            <div className="shrink-0 border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chat or admin email…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="rounded-full pl-9"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <AlertCircle className="size-7 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Could not load conversations.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : threads.length === 0 && adminContacts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <MessageSquare className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {searching
                    ? "No contacts match your search."
                    : "No conversations yet. Messages you send or receive will appear here."}
                </p>
              </div>
            ) : (
              <>
                {threads.length > 0 && (
                  <ul className="divide-y divide-border">
                    {threads.map((t) => (
                      <li key={t.otherId}>
                        <button
                          type="button"
                          onClick={() => setActive({ id: t.otherId, name: t.otherName })}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                            active?.id === t.otherId && "bg-muted",
                          )}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                            {t.otherName.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-1 text-sm font-medium">
                                <span className="truncate">{t.otherName}</span>
                                <VerifiedTick
                                  verified={!!verifiedIds.data?.has(t.otherId)}
                                  className="[&_svg]:size-3.5"
                                />
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {relativeLabel(t.lastAt)}
                              </span>
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {t.lastBody}
                            </span>
                          </span>
                          {t.unread > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-navy">
                              {t.unread}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {adminContacts.length > 0 && (
                  <div>
                    <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {searching ? "Search results" : "Message an admin"}
                    </p>
                    <ul className="divide-y divide-border">
                      {adminContacts.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => setActive({ id: a.id, name: a.name })}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                              active?.id === a.id && "bg-muted",
                            )}
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-brand-navy">
                              <ShieldCheck className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {a.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {a.email}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {a.role === "super_admin" ? "Administrator" : "Admin"} · tap to start a chat
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            </div>
          </div>

          {/* Conversation */}
          <div className={cn("min-h-0 min-w-0", active ? "block" : "hidden lg:block")}>
            {active && user?.id ? (
              <ThreadView
                userId={user.id}
                otherId={active.id}
                otherName={active.name}
                onBack={() => setActive(null)}
              />
            ) : (
              <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start reading.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
