import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle, Send, Loader2, Reply } from "lucide-react"

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
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { MailMessage } from "@/types/database.types"

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
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load this message.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/platform/inbox">
          <ArrowLeft className="mr-1.5 size-4" /> Back to inbox
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {data.subject || "(no subject)"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.from_name ? `${data.from_name} · ` : ""}
            {data.from_addr}
            {data.received_at
              ? ` · ${format(new Date(data.received_at), "EEE d MMM yyyy, HH:mm")}`
              : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap break-words text-sm text-foreground">
            {cleanBody(data.body_html || data.snippet || "")}
          </div>

          {!showReply ? (
            <Button onClick={() => setShowReply(true)}>
              <Reply className="mr-2 size-4" /> Reply
            </Button>
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
  )
}
