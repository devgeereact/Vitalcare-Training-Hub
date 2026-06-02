import { useEffect, useState } from "react"
import { format } from "date-fns"
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
  Forward,
  Megaphone,
  Sparkles,
  Check,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import MailListRow from "@/components/email/MailListRow"
import MailListToolbar from "@/components/email/MailListToolbar"
import MailBody from "@/components/email/MailBody"
import { mailPlainText, parseMailBody } from "@/lib/email/mime"
import { sendChat } from "@/lib/queries/ai.queries"

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

/** Parse a timestamp safely. Returns null for missing or invalid values so the
 *  UI never renders "Invalid Date" or throws inside date-fns. */
function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Look up category styling, guarding against legacy/unknown labels. */
function categoryMeta(category: string | null): { label: string; dot: string } | null {
  if (!category) return null
  return CATEGORY_META[category as MailCategory] ?? null
}

/** Prefill payload handed to the compose dialog for reply/forward. */
interface ComposePrefill {
  to: string
  subject: string
  body: string
}

/** Build a quoted-original block ("On <date>, <from> wrote:" + quoted text). */
function quoteOriginal(mail: MailRow): string {
  const original = mailPlainText(parseMailBody(mail.body_html ?? mail.body_text ?? mail.snippet))
  const quoted = original
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
  const who = mail.from_name || mail.from_addr || "the sender"
  const received = safeDate(mail.received_at)
  const when = received ? format(received, "EEE d MMM yyyy, HH:mm") : "an earlier date"
  return `\n\nOn ${when}, ${who} wrote:\n${quoted}`
}

function buildReplyPrefill(mail: MailRow): ComposePrefill {
  const subject = mail.subject || "(no subject)"
  return {
    to: mail.from_addr ?? "",
    subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
    body: quoteOriginal(mail),
  }
}

function buildForwardPrefill(mail: MailRow): ComposePrefill {
  const subject = mail.subject || "(no subject)"
  return {
    to: "",
    subject: /^fwd:/i.test(subject) ? subject : `Fwd: ${subject}`,
    body: quoteOriginal(mail),
  }
}

/** Reply prefill where the body starts with an AI draft, then the quoted original. */
function buildAiReplyPrefill(mail: MailRow, draft: string): ComposePrefill {
  const base = buildReplyPrefill(mail)
  return { ...base, body: `${draft.trim()}${base.body}` }
}

/* Vitalcare brand voice for an email reply: authoritative, approachable,
 * evidence-led, human. UK English. No em-dashes. No banned words. */
const EMAIL_TONE = [
  "You draft email replies for Vitalcare Training Hub, a UK healthcare training provider.",
  "Voice: authoritative, approachable, evidence-led, human. Write in UK English.",
  "Rules: never use em-dashes; use commas, colons or brackets instead.",
  "Avoid these words: delve, tapestry, seamless, leverage, holistic, comprehensive, bespoke, streamline, facilitate, empower, world-class.",
  "Be concise and practical. No preamble, no subject line, no quoted original. Return only the reply body.",
].join(" ")

/** Build the AI prompt to draft a reply to a received message. */
function buildAiReplyPrompt(mail: MailRow, instruction: string): string {
  const original = mailPlainText(parseMailBody(mail.body_html ?? mail.body_text ?? mail.snippet))
  const who = mail.from_name || mail.from_addr || "the sender"
  return [
    EMAIL_TONE,
    `You are replying to ${who}.`,
    mail.subject ? `Subject: ${mail.subject}` : "",
    original ? `Their message:\n${original.slice(0, 4000)}` : "",
    instruction.trim() ? `What we want to say: ${instruction.trim()}` : "",
    "Write the reply now.",
  ]
    .filter(Boolean)
    .join("\n\n")
}

export default function EmailComposerPage() {
  const { profile, isSuperAdmin } = useUser()
  const ownerId = profile?.id ?? ""

  const [folder, setFolder] = useState<MailFolder>("inbox")
  const [category, setCategory] = useState<MailCategory | "all">("all")
  const [selected, setSelected] = useState<MailRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [prefill, setPrefill] = useState<ComposePrefill | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  function openCompose(next: ComposePrefill | null) {
    setPrefill(next)
    setComposeOpen(true)
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

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
          setSelectedIds(new Set())
        }}
        category={category}
        onSelectCategory={(c) => setCategory(c)}
        counts={counts.data}
        onCompose={() => {
          setSelected(null)
          openCompose(null)
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
          {list.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : list.isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load this folder.
              </p>
              <Button variant="outline" size="sm" onClick={() => list.refetch()}>
                Retry
              </Button>
            </div>
          ) : (list.data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
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
            <>
              <MailListToolbar
                folder={folder}
                rows={list.data!}
                selectedIds={selectedIds}
                onSelectAll={(checked) =>
                  setSelectedIds(
                    checked ? new Set(list.data!.map((m) => m.id)) : new Set(),
                  )
                }
                onBulkTrash={() => {
                  const ids = [...selectedIds]
                  ids.forEach((id) => trash.mutate(id))
                  setSelectedIds(new Set())
                  if (ids.length) toast.success(`Moved ${ids.length} to Trash`)
                }}
                onBulkRestore={() => {
                  const rows = list.data!.filter((m) => selectedIds.has(m.id))
                  rows.forEach((m) =>
                    restore.mutate({ id: m.id, isDraft: m.is_draft }),
                  )
                  setSelectedIds(new Set())
                  if (rows.length) toast.success(`Restored ${rows.length}`)
                }}
                onBulkMarkSeen={() => {
                  const ids = [...selectedIds]
                  ids.forEach((id) => markSeen.mutate(id))
                  setSelectedIds(new Set())
                }}
                onRefresh={() => list.refetch()}
                refreshing={list.isFetching}
              />
              <div className="divide-y divide-border">
                {list.data!.map((m) => (
                  <MailListRow
                    key={m.id}
                    mail={m}
                    folder={folder}
                    selected={selectedIds.has(m.id)}
                    onSelectedChange={(checked) => toggleSelected(m.id, checked)}
                    onOpen={() => openMessage(m)}
                    onToggleStar={() =>
                      toggleImportant.mutate({ id: m.id, important: !m.important })
                    }
                    onTrash={() =>
                      trash.mutate(m.id, {
                        onSuccess: () => toast.success("Moved to Trash"),
                      })
                    }
                    onRestore={() =>
                      restore.mutate(
                        { id: m.id, isDraft: m.is_draft },
                        { onSuccess: () => toast.success("Restored") },
                      )
                    }
                    onMarkSeen={() => markSeen.mutate(m.id)}
                  />
                ))}
              </div>
            </>
          )}
        </Card>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="size-3.5" /> Personal mail sends through your connected
          account. Broadcasts send via Resend (3,000 per month on the free tier).
        </p>
      </div>

      <MailReaderDialog
        mail={selected}
        onClose={() => setSelected(null)}
        onReply={(m) => {
          setSelected(null)
          openCompose(buildReplyPrefill(m))
        }}
        onForward={(m) => {
          setSelected(null)
          openCompose(buildForwardPrefill(m))
        }}
        onAiReply={(m, draft) => {
          setSelected(null)
          openCompose(buildAiReplyPrefill(m, draft))
        }}
        onToggleImportant={(m) =>
          toggleImportant.mutate(
            { id: m.id, important: !m.important },
            {
              onSuccess: () => setSelected({ ...m, important: !m.important }),
            },
          )
        }
        onSetCategory={(m, c) =>
          setCat.mutate(
            { id: m.id, category: c },
            { onSuccess: () => setSelected({ ...m, category: c }) },
          )
        }
        onTrash={(m) =>
          trash.mutate(m.id, {
            onSuccess: () => {
              toast.success("Moved to Trash")
              setSelected(null)
            },
          })
        }
        onRestore={(m) =>
          restore.mutate(
            { id: m.id, isDraft: m.is_draft },
            {
              onSuccess: () => {
                toast.success("Restored")
                setSelected(null)
              },
            },
          )
        }
        onDeleteForever={(m) =>
          deleteForever.mutate(m.id, {
            onSuccess: () => {
              toast.success("Deleted permanently")
              setSelected(null)
            },
          })
        }
      />

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        ownerId={ownerId}
        prefill={prefill}
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

/* ------------------------------------------------------ mail reader popup -- */

/** Inline popover that drafts an email reply in the Vitalcare tone, then hands
 *  the accepted draft up so the parent can open the compose dialog prefilled.
 *  Degrades gracefully with a toast if the ai-chat function is not deployed. */
function AiReplyPopover({
  mail,
  onUse,
}: {
  mail: MailRow
  onUse: (draft: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)

  async function generate(): Promise<void> {
    setLoading(true)
    setDraft("")
    try {
      const reply = await sendChat([
        { role: "user", content: buildAiReplyPrompt(mail, instruction) },
      ])
      setDraft(reply.trim())
    } catch (err) {
      toast.error("AI unavailable", {
        description: err instanceof Error ? err.message : "Try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Sparkles className="mr-2 size-4 text-brand-gold" /> AI reply
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] space-y-3">
        <div>
          <p className="text-sm font-medium">AI reply</p>
          <p className="text-xs text-muted-foreground">
            Drafts a reply in the Vitalcare tone. Review before sending.
          </p>
        </div>
        <Textarea
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional: what should the reply cover?"
        />
        <Button size="sm" onClick={generate} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : draft ? (
            <RefreshCw className="mr-1.5 size-4" />
          ) : (
            <Sparkles className="mr-1.5 size-4" />
          )}
          {loading ? "Drafting…" : draft ? "Regenerate" : "Draft reply"}
        </Button>

        {draft && (
          <div className="space-y-2">
            <Textarea
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onUse(draft)
                setOpen(false)
                setDraft("")
                setInstruction("")
              }}
            >
              <Check className="mr-1.5 size-4" /> Use this reply
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function MailReaderDialog({
  mail,
  onClose,
  onReply,
  onForward,
  onAiReply,
  onToggleImportant,
  onSetCategory,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  mail: MailRow | null
  onClose: () => void
  onReply: (m: MailRow) => void
  onForward: (m: MailRow) => void
  onAiReply: (m: MailRow, draft: string) => void
  onToggleImportant: (m: MailRow) => void
  onSetCategory: (m: MailRow, c: MailCategory | null) => void
  onTrash: (m: MailRow) => void
  onRestore: (m: MailRow) => void
  onDeleteForever: (m: MailRow) => void
}) {
  const receivedAt = mail ? safeDate(mail.received_at) : null
  const canReply = !!mail && !!mail.from_addr && mail.folder !== "trash"
  const detailCategory = mail ? categoryMeta(mail.category) : null
  const attachments = mail && Array.isArray(mail.attachments) ? mail.attachments : []

  return (
    <Dialog open={!!mail} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl lg:max-w-3xl">
        {mail && (
          <>
            <DialogHeader className="space-y-3 border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-start gap-2">
                <DialogTitle className="min-w-0 flex-1 pr-2 font-display text-xl leading-snug text-foreground sm:text-2xl">
                  {mail.subject || "(no subject)"}
                </DialogTitle>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={mail.important ? "Remove from Important" : "Mark Important"}
                    onClick={() => onToggleImportant(mail)}
                    className="focus-visible:ring-2 focus-visible:ring-brand-gold"
                  >
                    <Star
                      className={cn(
                        "size-4",
                        mail.important
                          ? "fill-brand-gold text-brand-gold"
                          : "text-muted-foreground",
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
                        <DropdownMenuItem key={k} onClick={() => onSetCategory(mail, k)}>
                          <span
                            className={cn("mr-2 size-2.5 rounded-full", CATEGORY_META[k].dot)}
                          />
                          {CATEGORY_META[k].label}
                          {mail.category === k && (
                            <CheckCircle2 className="ml-auto size-3.5" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onSetCategory(mail, null)}>
                        Clear label
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {mail.folder === "trash" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Restore"
                        onClick={() => onRestore(mail)}
                      >
                        <RotateCcw className="size-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete permanently"
                        onClick={() => onDeleteForever(mail)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move to Trash"
                      onClick={() => onTrash(mail)}
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <Avatar className="size-11 shrink-0">
                  <AvatarFallback className="bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                    {initials(mail.from_name, mail.from_addr || mail.to_addr)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {mail.from_name || mail.from_addr || "Unknown sender"}
                  </p>
                  <DialogDescription className="truncate text-xs text-muted-foreground">
                    {mail.from_addr || (mail.to_addr ? `To: ${mail.to_addr}` : "")}
                    {mail.to_addr && mail.from_addr ? ` · To: ${mail.to_addr}` : ""}
                  </DialogDescription>
                  {receivedAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(receivedAt, "EEE d MMM yyyy, HH:mm")}
                    </p>
                  )}
                  {(mail.is_draft || detailCategory) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {mail.is_draft && <Badge variant="secondary">Draft</Badge>}
                      {detailCategory && (
                        <Badge variant="secondary" className="gap-1">
                          <span
                            className={cn("size-2 rounded-full", detailCategory.dot)}
                          />
                          {detailCategory.label}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <MailBody raw={mail.body_html || mail.body_text || mail.snippet} />

              {attachments.length > 0 && (
                <div className="mt-4 space-y-1.5 rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Attachments ({attachments.length})
                  </p>
                  {attachments.map((a, i) => (
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
            </div>

            {mail.folder !== "trash" && (
              <DialogFooter className="flex-row flex-wrap gap-2 border-t border-border px-5 py-4 sm:justify-start sm:px-6">
                <Button
                  onClick={() => onReply(mail)}
                  disabled={!canReply}
                  className="bg-brand-navy text-white hover:bg-brand-navy-dark focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Reply className="mr-2 size-4" /> Reply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onForward(mail)}
                  className="focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Forward className="mr-2 size-4" /> Forward
                </Button>
                {canReply && (
                  <AiReplyPopover mail={mail} onUse={(draft) => onAiReply(mail, draft)} />
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------ compose dialog ---- */

function ComposeDialog({
  open,
  onOpenChange,
  ownerId,
  prefill,
  onSent,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  ownerId: string
  prefill: ComposePrefill | null
  onSent: () => void
}) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [draftId, setDraftId] = useState<string | undefined>()
  const [sending, setSending] = useState(false)
  const saveDraft = useSaveDraft()
  const recordSent = useRecordSent()

  // When the dialog opens, seed the fields from a reply/forward prefill (or
  // clear them for a fresh compose). Keyed on `open` so reopening re-seeds.
  useEffect(() => {
    if (!open) return
    setDraftId(undefined)
    if (prefill) {
      setTo(prefill.to)
      setSubject(prefill.subject)
      setBody(prefill.body)
    } else {
      setTo("")
      setSubject("")
      setBody("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
                          : safeDate(c.scheduled_at)
                            ? `For ${format(safeDate(c.scheduled_at)!, "d MMM, HH:mm")}`
                            : "Not scheduled"}
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
