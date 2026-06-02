import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Inbox, AlertCircle, RefreshCw, Loader2, Mail, PenSquare, Send, Paperclip } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import MailSidebar from "@/components/email/MailSidebar"
import type { MailMessage } from "@/types/database.types"

export default function InboxPage() {
  const qc = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [compose, setCompose] = useState(false)
  const [cTo, setCTo] = useState("")
  const [cSubject, setCSubject] = useState("")
  const [cBody, setCBody] = useState("")
  const [sending, setSending] = useState(false)

  async function sendMail() {
    if (!cTo.trim() || !cSubject.trim() || !cBody.trim()) {
      toast.error("Fill in recipient, subject and message.")
      return
    }
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke("user-mail", {
        body: { action: "send", to: cTo.trim(), subject: cSubject, message: cBody },
      })
      if (error || data?.ok === false) {
        throw new Error(data?.error || "send failed")
      }
      toast.success("Email sent")
      setCompose(false)
      setCTo("")
      setCSubject("")
      setCBody("")
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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mail", "inbox"],
    queryFn: async (): Promise<MailMessage[]> => {
      const { data, error } = await supabase
        .from("mail_messages")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as MailMessage[]
    },
  })

  async function syncNow() {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke("imap-sync", { body: {} })
      if (error) throw error
      toast.success(`Synced — ${data?.stored ?? 0} message(s)`)
      qc.invalidateQueries({ queryKey: ["mail", "inbox"] })
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Check IMAP settings.",
      })
    } finally {
      setSyncing(false)
    }
  }

  const unread = data?.filter((m) => !m.seen).length ?? 0

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <MailSidebar active="inbox" inboxCount={unread} />

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">Inbox</h1>
            <p className="mt-1 text-muted-foreground">
              Your received mail. Use Sync now to pull the latest from your mailbox.
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
            <Button onClick={() => setCompose(true)}>
              <PenSquare className="mr-2 size-4" /> Compose
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load the inbox.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Inbox empty. Click “Sync now” to pull your latest mail.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/platform/inbox/${m.id}`}
                    className={cn(
                      "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                      !m.seen && "bg-muted/40",
                    )}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
                      <Mail className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", !m.seen && "font-semibold")}>
                          {m.from_name || m.from_addr || "Unknown sender"}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {m.received_at
                            ? formatDistanceToNow(new Date(m.received_at), { addSuffix: true })
                            : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 truncate text-sm">
                        {m.has_attachments && (
                          <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        {m.subject}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.snippet}
                      </span>
                    </span>
                    {!m.seen && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose (sends from your own account) */}
      <Dialog open={compose} onOpenChange={setCompose}>
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
                value={cTo}
                onChange={(e) => setCTo(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Subject</Label>
              <Input value={cSubject} onChange={(e) => setCSubject(e.target.value)} />
            </div>
            <Textarea
              rows={8}
              value={cBody}
              onChange={(e) => setCBody(e.target.value)}
              placeholder="Write your message…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompose(false)}>
              Cancel
            </Button>
            <Button onClick={sendMail} disabled={sending}>
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
    </div>
  )
}
