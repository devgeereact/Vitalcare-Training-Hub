import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Send, Loader2, Reply, Forward, Paperclip } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import AiFieldsButton from "@/components/ai/AiFieldsButton"
import MailSidebar from "@/components/email/MailSidebar"
import type { MailMessage } from "@/types/database.types"

/** Two-letter initials from a sender name or address, for the avatar. */
function initials(name: string | null, addr: string | null): string {
  const source = (name || addr || "?").trim()
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Best-effort clean text from a stored raw body. */
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

export default function MailDetailPage() {
  const { id = "" } = useParams()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mail", "detail", id],
    enabled: !!id,
    queryFn: async (): Promise<MailMessage | null> => {
      const { data, error } = await supabase
        .from("mail_messages")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      return (data as MailMessage) ?? null
    },
  })

  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [showReply, setShowReply] = useState(false)

  useEffect(() => {
    if (data) {
      setTo(data.from_addr ?? "")
      setSubject(data.subject?.startsWith("Re:") ? data.subject : `Re: ${data.subject ?? ""}`)
    }
  }, [data])

  // Mark seen on open.
  useEffect(() => {
    if (data && !data.seen) {
      supabase.from("mail_messages").update({ seen: true }).eq("id", data.id).then(() => {})
    }
  }, [data])

  function startForward() {
    if (!data) return
    setTo("")
    setSubject(data.subject?.startsWith("Fwd:") ? data.subject : `Fwd: ${data.subject ?? ""}`)
    const original = data.body_text || cleanBody(data.body_html || data.snippet || "")
    setReply(
      `\n\n---------- Forwarded message ----------\nFrom: ${data.from_name || data.from_addr || "Unknown sender"}\nSubject: ${data.subject ?? ""}\n\n${original}`,
    )
    setShowReply(true)
  }

  async function send() {
    if (!to.trim() || !reply.trim()) {
      toast.error("Add a recipient and a message.")
      return
    }
    setSending(true)
    try {
      const { data: r, error } = await supabase.functions.invoke("user-mail", {
        body: { action: "send", to: to.trim(), subject, message: reply },
      })
      if (error || r?.ok === false) throw new Error(r?.error || "send failed")
      toast.success("Reply sent")
      setReply("")
      setShowReply(false)
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <MailSidebar active="inbox" />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <MailSidebar active="inbox" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load this message.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <MailSidebar active="inbox" />

      <div className="min-w-0 flex-1 space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/inbox">
          <ArrowLeft className="mr-1.5 size-4" /> Back to inbox
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                {initials(data.from_name, data.from_addr)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="font-display text-xl">
                {data.subject || "(no subject)"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.from_name ? `${data.from_name} · ` : ""}
                {data.from_addr}
                {data.received_at
                  ? ` · ${format(new Date(data.received_at), "EEE d MMM yyyy, HH:mm")}`
                  : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap break-words text-sm text-foreground">
            {data.body_text || cleanBody(data.body_html || data.snippet || "")}
          </div>

          {data.attachments?.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Attachments ({data.attachments.length})
              </p>
              {data.attachments.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Paperclip className="size-3.5" /> {a.name}
                  {a.size ? (
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(a.size / 1024)} KB)
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          )}

          {!showReply ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowReply(true)}>
                <Reply className="mr-2 size-4" /> Reply
              </Button>
              <Button variant="outline" onClick={startForward}>
                <Forward className="mr-2 size-4" /> Forward
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div>
                <Label className="mb-1.5 block text-xs">To</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <AiFieldsButton
                  subject="a professional email reply"
                  context={`Replying to: ${data.subject}\nFrom: ${data.from_name || data.from_addr}\nTheir message:\n${(data.body_text || data.snippet || "").slice(0, 800)}`}
                  fields={[
                    { key: "subject", label: "Subject", format: "text" },
                    { key: "message", label: "Reply", format: "text" },
                  ]}
                  onApply={(v) => {
                    if (v.subject) setSubject(v.subject)
                    if (v.message) setReply(v.message)
                  }}
                />
              </div>
              <Textarea
                rows={8}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write your reply…"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReply(false)}>
                  Cancel
                </Button>
                <Button onClick={send} disabled={sending}>
                  {sending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
                  Send reply
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
