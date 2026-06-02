import { useState } from "react"
import { toast } from "sonner"
import { Mail, Loader2, Send } from "lucide-react"

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
import { supabase } from "@/lib/supabase/client"
import AiAssistButton from "@/components/ai/AiAssistButton"

const AUDIENCES = [
  { value: "all_learners", label: "All learners" },
  { value: "all_trainers", label: "All trainers" },
  { value: "all_staff", label: "All staff" },
] as const

export default function EmailComposerPage() {
  const [audience, setAudience] = useState<string>("all_learners")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    if (!subject.trim() || !message.trim()) {
      toast.error("Add a subject and a message.")
      return
    }
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { audience, subject, message },
      })
      if (error) throw error
      toast.success("Email sent", {
        description: `Delivered to ${data?.sent ?? 0} of ${data?.total ?? 0} recipients.`,
      })
      setSubject("")
      setMessage("")
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
            Drip campaigns and scheduling are planned; this sends immediately.
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
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Send email
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="size-3.5" /> Sent from info@vitalcare.uk · Resend free tier
        allows 3,000 emails per month.
      </p>
    </div>
  )
}
