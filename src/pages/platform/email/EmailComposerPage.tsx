import { useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Mail, Loader2, Send, Clock, X, CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import {
  useCampaigns,
  useScheduleCampaign,
  useCancelCampaign,
} from "@/lib/queries/email.queries"
import type { EmailCampaignStatus } from "@/types/database.types"
import AiAssistButton from "@/components/ai/AiAssistButton"

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

export default function EmailComposerPage() {
  const { profile } = useUser()
  const [audience, setAudience] = useState<string>("all_learners")
  const [singleEmail, setSingleEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [when, setWhen] = useState<"now" | "later">("now")
  const [scheduledAt, setScheduledAt] = useState("")

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
      if (!profile?.id) return
      schedule
        .mutateAsync({ subject, message, audience, scheduledAt, createdBy: profile.id })
        .then(() => {
          toast.success("Email scheduled")
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
      toast.success("Email sent", {
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Email</h1>
        <p className="mt-1 text-muted-foreground">
          Send an email to a group via Resend. Recipients are resolved securely on
          the server.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
          <CardDescription>
            Send now, or schedule for later. Scheduled emails are processed every
            minute by the drip job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="max-w-xs">
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
                className="max-w-xs"
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
              <AiAssistButton
                task="a clear, professional email to healthcare training learners"
                context={subject ? `Subject: ${subject}` : undefined}
                onInsert={(text) => setMessage(text)}
              />
            </div>
            <Textarea
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
            />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
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
            <Button onClick={send} disabled={sending || schedule.isPending}>
              {sending || schedule.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : when === "later" ? (
                <Clock className="mr-2 size-4" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              {when === "later" ? "Schedule email" : "Send email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled &amp; sent</CardTitle>
          <CardDescription>Recent and upcoming email campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (campaigns.data?.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No campaigns yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {campaigns.data!.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.audience.replace("all_", "All ")} ·{" "}
                      {c.status === "sent"
                        ? `Sent ${format(new Date(c.sent_at ?? c.scheduled_at), "d MMM, HH:mm")} to ${c.sent_count}`
                        : `For ${format(new Date(c.scheduled_at), "d MMM yyyy, HH:mm")}`}
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
                      className="size-8 text-muted-foreground"
                      onClick={() =>
                        cancel
                          .mutateAsync(c.id)
                          .then(() => toast.success("Campaign cancelled"))
                          .catch(() => toast.error("Could not cancel"))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="size-3.5" /> Sent from info@vitalcare.uk · Resend free tier
        allows 3,000 emails per month.
      </p>
    </div>
  )
}
