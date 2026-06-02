import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  Mail,
  Loader2,
  Send,
  Clock,
  X,
  CheckCircle2,
  Paperclip,
  Star,
  Trash2,
  RotateCcw,
  Tag,
  AlertCircle,
  Inbox as InboxIcon,
  RefreshCw,
  Reply,
  Megaphone,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import {
  useCampaigns,
  useScheduleCampaign,
  useCancelCampaign,
  useMailList,
  useMailCounts,
  useToggleImportant,
  useSetCategory,
  useTrashMail,
  useRestoreMail,
  useDeleteMailForever,
  useMarkMailSeen,
  useSaveDraft,
  useRecordSent,
  type MailFolder,
  type MailCategory,
  type MailRow,
} from "@/lib/queries/email.queries"
import type { EmailCampaignStatus } from "@/types/database.types"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import MailSidebar from "@/components/email/MailSidebar"

const AUDIENCES = [
  { value: "all_learners", label: "All learners" },
  { value: "all_trainers", label: "All trainers" },
  { value: "all_staff", label: "All staff" },
  { value: "single", label: "One person" },
] as const

const STATUS_STYLE: Record<EmailCampaignStatus, string> = {
  scheduled: "bg-primary/10 text-primary",
  sending: "bg-warning/15 text-warning",
  sent: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
}

const CATEGORY_META: Record<MailCategory, { label: string; dot: string }> = {
  work: { label: "Work", dot: "bg-destructive" },
  private: { label: "Private", dot: "bg-primary" },
  support: { label: "Support", dot: "bg-success" },
  social: { label: "Social", dot: "bg-teal-500" },
}
const CATEGORY_KEYS = Object.keys(CATEGORY_META) as MailCategory[]

const FOLDER_TITLE: Record<MailFolder, string> = {
  inbox: "Inbox",
  sent: "Sent",
  important: "Important",
  draft: "Drafts",
  trash: "Trash",
}

function initials(name: string | null, addr: string | null): string {
  const source = (name || addr || "?").trim()
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function cleanBody(raw: string): string {
  return raw
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export default function EmailComposerPage() {
  const { profile, isSuperAdmin } = useUser()
  const ownerId = profile?.id ?? ""

  const [folder, setFolder] = useState<MailFolder>("inbox")
  const [category, setCategory] = useState<MailCategory | "all">("all")
  const [selected, setSelected] = useState<MailRow | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  const list = useMailList(folder, category)
  const counts = useMailCounts()
  const toggleImportant = useToggleImportant()
  const setCat = useSetCategory()
  const trash = useTrashMail()
  const restore = useRestoreMail()
  const deleteForever = useDeleteMailForever()
  const markSeen = useMarkMailSeen()

  function openMessage(m: MailRow) {
    setSelected(m)
    if (!m.seen && m.folder === "inbox") markSeen.mutate(m.id)
  }

  async function syncNow() {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke("imap-sync", { body: {} })
      if (error) throw error
      toast.success(`Synced. ${data?.stored ?? 0} new message(s).`)
      list.refetch()
      counts.refetch()
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Check your IMAP settings.",
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <MailSidebar
        active={folder}
        onSelectFolder={(f) => {
          setFolder(f)
          setSelected(null)
        }}
        category={category}
        onSelectCategory={(c) => setCategory(c)}
        counts={counts.data}
        onCompose={() => {
          setSelected(null)
          setComposeOpen(true)
        }}
      />

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {FOLDER_TITLE[folder]}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your mailbox. Folders and labels filter the list on the left.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncNow} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Sync now
            </Button>
            <Button variant="outline" onClick={() => setBroadcastOpen(true)}>
              <Megaphone className="mr-2 size-4" /> Broadcast
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,360px)_1fr]">
            {/* List pane */}
            <div className={cn("border-r border-border", selected && "hidden lg:block")}>
              {list.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : list.isError ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <AlertCircle className="size-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Could not load this folder.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => list.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : (list.data?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <InboxIcon className="size-6" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {folder === "inbox"
                      ? "Inbox empty. Click Sync now to pull your latest mail."
                      : folder === "draft"
                        ? "No drafts saved."
                        : `Nothing in ${FOLDER_TITLE[folder].toLowerCase()}.`}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {list.data!.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => openMessage(m)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                          !m.seen && m.folder === "inbox" && "bg-muted/40",
                          selected?.id === m.id && "bg-muted",
                        )}
                      >
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-xs font-semibold text-brand-navy">
                          {initials(m.from_name, m.from_addr || m.to_addr)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                !m.seen && m.folder === "inbox" && "font-semibold",
                              )}
                            >
                              {folder === "sent" || folder === "draft"
                                ? `To: ${m.to_addr || "(no recipient)"}`
                                : m.from_name || m.from_addr || "Unknown sender"}
                            </span>
                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              {m.important && (
                                <Star className="size-3 fill-brand-gold text-brand-gold" />
                              )}
                              {m.received_at
                                ? formatDistanceToNow(new Date(m.received_at), {
                                    addSuffix: true,
                                  })
                                : ""}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 truncate text-sm">
                            {m.has_attachments && (
                              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                            )}
                            {m.subject || "(no subject)"}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="block flex-1 truncate text-xs text-muted-foreground">
                              {m.snippet}
                            </span>
                            {m.category && (
                              <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                                <span
                                  className={cn(
                                    "size-2 rounded-full",
                                    CATEGORY_META[m.category].dot,
                                  )}
                                />
                                {CATEGORY_META[m.category].label}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Detail pane */}
            <div className={cn(selected ? "block" : "hidden lg:block")}>
              {selected ? (
                <MailDetail
                  key={selected.id}
                  mail={selected}
                  onBack={() => setSelected(null)}
                  onToggleImportant={() =>
                    toggleImportant.mutate(
                      { id: selected.id, important: !selected.important },
                      {
                        onSuccess: () =>
                          setSelected({ ...selected, important: !selected.important }),
                      },
                    )
                  }
                  onSetCategory={(c) =>
                    setCat.mutate(
                      { id: selected.id, category: c },
                      { onSuccess: () => setSelected({ ...selected, category: c }) },
                    )
                  }
                  onTrash={() =>
                    trash.mutate(selected.id, {
                      onSuccess: () => {
                        toast.success("Moved to Trash")
                        setSelected(null)
                      },
                    })
                  }
                  onRestore={() =>
                    restore.mutate(
                      { id: selected.id, isDraft: selected.is_draft },
                      {
                        onSuccess: () => {
                          toast.success("Restored")
                          setSelected(null)
                        },
                      },
                    )
                  }
                  onDeleteForever={() =>
                    deleteForever.mutate(selected.id, {
                      onSuccess: () => {
                        toast.success("Deleted permanently")
                        setSelected(null)
                      },
                    })
                  }
                />
              ) : (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-2 p-6 text-center">
                  <Mail className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a message to read it here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="size-3.5" /> Personal mail sends through your connected
          account. Broadcasts send via Resend (3,000 per month on the free tier).
        </p>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        ownerId={ownerId}
        onSent={() => {
          list.refetch()
          counts.refetch()
        }}
      />
      <BroadcastDialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        isSuperAdmin={isSuperAdmin}
        createdBy={ownerId}
      />
    </div>
  )
}

/* ----------------------------------------------------------- mail detail -- */

function MailDetail({
  mail,
  onBack,
  onToggleImportant,
  onSetCategory,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  mail: MailRow
  onBack: () => void
  onToggleImportant: () => void
  onSetCategory: (c: MailCategory | null) => void
  onTrash: () => void
  onRestore: () => void
  onDeleteForever: () => void
}) {
  const body = mail.body_text || cleanBody(mail.body_html || mail.snippet || "")
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="-ml-2 lg:hidden" onClick={onBack}>
          Back
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={mail.important ? "Remove from Important" : "Mark Important"}
            onClick={onToggleImportant}
            className="focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <Star
              className={cn(
                "size-4",
                mail.important ? "fill-brand-gold text-brand-gold" : "text-muted-foreground",
              )}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Label"
                className="focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                <Tag className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CATEGORY_KEYS.map((k) => (
                <DropdownMenuItem key={k} onClick={() => onSetCategory(k)}>
                  <span className={cn("mr-2 size-2.5 rounded-full", CATEGORY_META[k].dot)} />
                  {CATEGORY_META[k].label}
                  {mail.category === k && <CheckCircle2 className="ml-auto size-3.5" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSetCategory(null)}>
                Clear label
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {mail.folder === "trash" ? (
            <>
              <Button variant="ghost" size="icon" title="Restore" onClick={onRestore}>
                <RotateCcw className="size-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete permanently"
                onClick={onDeleteForever}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" title="Move to Trash" onClick={onTrash}>
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-brand-navy/10 text-sm font-semibold text-brand-navy">
            {initials(mail.from_name, mail.from_addr || mail.to_addr)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl text-foreground">
            {mail.subject || "(no subject)"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mail.from_name ? `${mail.from_name} · ` : ""}
            {mail.from_addr || (mail.to_addr ? `To: ${mail.to_addr}` : "")}
            {mail.received_at
              ? ` · ${format(new Date(mail.received_at), "EEE d MMM yyyy, HH:mm")}`
              : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {mail.is_draft && <Badge variant="secondary">Draft</Badge>}
            {mail.category && (
              <Badge variant="secondary" className="gap-1">
                <span className={cn("size-2 rounded-full", CATEGORY_META[mail.category].dot)} />
                {CATEGORY_META[mail.category].label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="whitespace-pre-wrap break-words text-sm text-foreground">
        {body || "(no content)"}
      </div>

      {mail.attachments?.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Attachments ({mail.attachments.length})
          </p>
          {mail.attachments.map((a, i) => (
            <a
              key={i}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Paperclip className="size-3.5" /> {a.name}
            </a>
          ))}
        </div>
      )}

      {mail.from_addr && mail.folder !== "trash" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Reply className="size-3.5" /> Use Compose to reply to {mail.from_addr}.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------ compose dialog ---- */

function ComposeDialog({
  open,
  onOpenChange,
  ownerId,
  onSent,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  ownerId: string
  onSent: () => void
}) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [draftId, setDraftId] = useState<string | undefined>()
  const [sending, setSending] = useState(false)
  const saveDraft = useSaveDraft()
  const recordSent = useRecordSent()

  function reset() {
    setTo("")
    setSubject("")
    setBody("")
    setDraftId(undefined)
  }

  async function onSaveDraft() {
    if (!ownerId) return
    try {
      const id = await saveDraft.mutateAsync({ id: draftId, ownerId, to, subject, body })
      setDraftId(id)
      toast.success("Draft saved")
      onSent()
    } catch {
      toast.error("Could not save the draft.")
    }
  }

  async function send() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error("Add a recipient, subject and message.")
      return
    }
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke("user-mail", {
        body: { action: "send", to: to.trim(), subject, message: body },
      })
      if (error || data?.ok === false) throw new Error(data?.error || "send failed")
      if (ownerId) {
        await recordSent.mutateAsync({ ownerId, to, subject, body, draftId })
      }
      toast.success("Email sent")
      reset()
      onOpenChange(false)
      onSent()
    } catch (err) {
      toast.error("Could not send", {
        description:
          err instanceof Error && err.message.includes("Connect")
            ? "Connect your mail account in Settings first."
            : "Check your mail settings.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compose</DialogTitle>
          <DialogDescription>Sends from your connected mail account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">To</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <AiFieldsButton
              subject="a clear, professional email reply"
              context={subject ? `Working subject: ${subject}` : undefined}
              fields={[
                { key: "subject", label: "Subject", format: "text" },
                { key: "message", label: "Message", format: "text" },
              ]}
              onApply={(v) => {
                if (v.subject) setSubject(v.subject)
                if (v.message) setBody(v.message)
              }}
            />
          </div>
          <Textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={saveDraft.isPending || (!to.trim() && !subject.trim() && !body.trim())}
          >
            {saveDraft.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Save draft
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------------------------- broadcast dialog ----- */

function BroadcastDialog({
  open,
  onOpenChange,
  isSuperAdmin,
  createdBy,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isSuperAdmin: boolean
  createdBy: string
}) {
  const [audience, setAudience] = useState<string>("all_learners")
  const [singleEmail, setSingleEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [when, setWhen] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")
  const [sending, setSending] = useState(false)

  const campaigns = useCampaigns()
  const schedule = useScheduleCampaign()
  const cancel = useCancelCampaign()

  function reset() {
    setSubject("")
    setMessage("")
    setScheduledAt("")
  }

  async function send() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Add a subject and a message.")
      return
    }
    if (audience === "single" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(singleEmail.trim())) {
      toast.error("Enter a valid recipient email.")
      return
    }
    if (when === "later" && audience !== "single") {
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        toast.error("Choose a future date and time.")
        return
      }
      if (!createdBy) return
      schedule
        .mutateAsync({ subject, message, audience, scheduledAt, createdBy })
        .then(() => {
          toast.success("Broadcast scheduled")
          reset()
        })
        .catch(() => toast.error("Could not schedule. Please try again."))
      return
    }
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body:
          audience === "single"
            ? { emails: [singleEmail.trim()], subject, message }
            : { audience, subject, message },
      })
      if (error) throw error
      toast.success("Broadcast sent", {
        description: `Delivered to ${data?.sent ?? 0} of ${data?.total ?? 0} recipients.`,
      })
      reset()
    } catch (err) {
      console.error("[send-email]", err)
      toast.error("Could not send", {
        description:
          err instanceof Error ? err.message : "Deploy the send-email function and retry.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Broadcast email</DialogTitle>
          <DialogDescription>
            Send to a group via Resend. Recipients are resolved on the server.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {audience === "single" && (
            <div>
              <Label className="mb-1.5 block">Recipient email</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Message</Label>
              <AiFieldsButton
                subject="a clear, professional email to healthcare training learners"
                context={subject ? `Working subject: ${subject}` : undefined}
                fields={[
                  { key: "subject", label: "Subject", format: "text" },
                  { key: "message", label: "Message", format: "text" },
                ]}
                onApply={(v) => {
                  if (v.subject) setSubject(v.subject)
                  if (v.message) setMessage(v.message)
                }}
              />
            </div>
            <Textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter text…"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="mb-1.5 block">Delivery</Label>
              <div className="flex rounded-lg border border-border p-0.5">
                {(["now", "later"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWhen(w)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      when === w
                        ? "bg-brand-navy text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {w === "now" ? "Send now" : "Schedule"}
                  </button>
                ))}
              </div>
            </div>
            {when === "later" && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="max-w-xs"
              />
            )}
            <Button
              className="ml-auto"
              onClick={send}
              disabled={sending || schedule.isPending}
            >
              {sending || schedule.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : when === "later" ? (
                <Clock className="mr-2 size-4" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              {when === "later" ? "Schedule" : "Send"}
            </Button>
          </div>

          {/* Recent campaigns */}
          <div className="rounded-lg border border-border">
            <p className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Scheduled and sent
            </p>
            {campaigns.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (campaigns.data?.length ?? 0) === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No broadcasts yet.
              </p>
            ) : (
              <ul className="max-h-40 divide-y divide-border overflow-y-auto">
                {campaigns.data!.slice(0, 10).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{c.subject}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.status === "sent"
                          ? `Sent to ${c.sent_count}`
                          : `For ${format(new Date(c.scheduled_at), "d MMM, HH:mm")}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className={STATUS_STYLE[c.status]}>
                      {c.status === "sent" && <CheckCircle2 className="mr-1 size-3" />}
                      {c.status}
                    </Badge>
                    {c.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        onClick={() =>
                          cancel
                            .mutateAsync(c.id)
                            .then(() => toast.success("Cancelled"))
                            .catch(() => toast.error("Could not cancel"))
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {isSuperAdmin && (
            <p className="text-[11px] text-muted-foreground">
              Sender is set on the server to info@vitalcare.uk.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
