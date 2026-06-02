import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, Mail, CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"

interface Account {
  email: string
  from_name: string | null
  smtp_host: string
  smtp_port: number
  imap_host: string | null
  imap_port: number
}

export default function MailSettingsCard() {
  const [email, setEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("465")
  const [smtpPass, setSmtpPass] = useState("")
  const [imapHost, setImapHost] = useState("")
  const [imapPort, setImapPort] = useState("993")
  const [configured, setConfigured] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.functions
      .invoke("user-mail", { body: { action: "get" } })
      .then(({ data }) => {
        const a: Account | null = data?.account ?? null
        if (a) {
          setConfigured(true)
          setEmail(a.email)
          setFromName(a.from_name ?? "")
          setSmtpHost(a.smtp_host)
          setSmtpPort(String(a.smtp_port))
          setImapHost(a.imap_host ?? "")
          setImapPort(String(a.imap_port))
        }
      })
      .catch(() => {})
  }, [])

  async function save() {
    if (!email.trim() || !smtpHost.trim() || !smtpPass.trim()) {
      toast.error("Email, SMTP host and password are required.")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.functions.invoke("user-mail", {
        body: {
          action: "set",
          email,
          fromName,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpPass,
          imapHost: imapHost || smtpHost,
          imapPort: Number(imapPort),
        },
      })
      if (error) throw error
      setConfigured(true)
      setSmtpPass("")
      toast.success("Mail account connected")
    } catch {
      toast.error("Could not save mail account")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5 text-brand-navy" /> My email account
          {configured && (
            <span className="flex items-center gap-1 text-xs font-normal text-success">
              <CheckCircle2 className="size-3.5" /> Connected
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Connect your own mailbox to send and receive email on your account
          (Inbox). Password is stored securely and never shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs">Email address</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@vitalcare.uk" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Display name</Label>
          <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">SMTP host</Label>
          <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="mail.host.com" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">SMTP port</Label>
          <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">IMAP host (for inbox)</Label>
          <Input value={imapHost} onChange={(e) => setImapHost(e.target.value)} placeholder="same as SMTP" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">IMAP port</Label>
          <Input value={imapPort} onChange={(e) => setImapPort(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs">Password / app password</Label>
          <Input
            type="password"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            placeholder="Mailbox password"
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            {configured ? "Update" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
