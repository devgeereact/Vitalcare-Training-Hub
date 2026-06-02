import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bell, CheckCircle2, Video } from "lucide-react"

import { useUIThemeStore } from "@/store/ui-theme.store"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import MailSettingsCard from "@/components/platform/MailSettingsCard"
import AccountSettingsCard from "@/components/settings/AccountSettingsCard"
import PasswordCard from "@/components/settings/PasswordCard"

const VITALCARE_THEMES = [
  {
    id: "vitalcare-default",
    label: "Vitalcare",
    preview: "bg-gradient-to-br from-[#1b2e6b] to-[#d4a843]",
  },
  {
    id: "dark-clinical",
    label: "Dark Clinical",
    preview: "bg-gradient-to-br from-slate-900 to-slate-700",
  },
  {
    id: "navy-minimal",
    label: "Navy Minimal",
    preview: "bg-gradient-to-br from-[#1b2e6b] to-[#142054]",
  },
]

// Dedicated OAuth client for Calendar/Meet (separate from the sign-in client).
const GOOGLE_CLIENT_ID =
  "100759784690-hdbfkuuuiftq9fcemcvkplfgd5j7qcv0.apps.googleusercontent.com"
const OAUTH_REDIRECT =
  "https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-oauth-callback"
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ")

// Device-level notification preferences. Stored locally until a server-side
// preferences table exists.
const NOTIF_KEYS = {
  sessionReminders: "vc-notif-session-reminders",
  certificateAlerts: "vc-notif-certificate-alerts",
  announcements: "vc-notif-announcements",
} as const

function readPref(key: string): boolean {
  // Default on: opting out is the deliberate action.
  return localStorage.getItem(key) !== "off"
}

export default function SettingsPage(): React.ReactElement {
  const { theme, setTheme } = useUIThemeStore()
  const { isSuperAdmin } = useUser()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  const [sessionReminders, setSessionReminders] = useState(() =>
    readPref(NOTIF_KEYS.sessionReminders),
  )
  const [certificateAlerts, setCertificateAlerts] = useState(() =>
    readPref(NOTIF_KEYS.certificateAlerts),
  )
  const [announcements, setAnnouncements] = useState(() =>
    readPref(NOTIF_KEYS.announcements),
  )

  function setPref(key: string, value: boolean, apply: (v: boolean) => void) {
    localStorage.setItem(key, value ? "on" : "off")
    apply(value)
  }

  const google = useQuery({
    queryKey: ["google-oauth-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("google_oauth_tokens")
        .select("connected_email, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    const g = params.get("google")
    if (!g) return
    if (g === "connected")
      toast.success("Google connected", {
        description: "Calendar and Meet are linked.",
      })
    else if (g === "norefresh")
      toast.error("Reconnect needed", {
        description: "Google did not return a refresh token. Try again.",
      })
    else if (g === "error") toast.error("Google connection failed")
    params.delete("google")
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function connectGoogle() {
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT,
        response_type: "code",
        scope: OAUTH_SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: user?.id ?? "",
      }).toString()
    window.location.href = url
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, how the platform looks and what you hear about.
        </p>
      </header>

      {/* Account / profile editing */}
      <AccountSettingsCard />

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose a theme. Saved on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VITALCARE_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={`relative h-24 cursor-pointer overflow-hidden rounded-lg transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 ${
                  theme === t.id
                    ? "scale-[1.03] ring-2 ring-[#d4a843]"
                    : "ring-1 ring-border"
                } ${t.preview}`}
              >
                <span className="absolute bottom-1.5 left-2 rounded bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white">
                  {t.label}
                </span>
                {theme === t.id && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-white text-brand-navy">
                    <CheckCircle2 className="size-4" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-brand-navy" /> Notifications
          </CardTitle>
          <CardDescription>
            Choose what you hear about. Saved on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <NotifRow
            id="notif-sessions"
            title="Session reminders"
            description="Get a nudge before sessions you are booked onto."
            checked={sessionReminders}
            onChange={(v) =>
              setPref(NOTIF_KEYS.sessionReminders, v, setSessionReminders)
            }
          />
          <NotifRow
            id="notif-certs"
            title="Certificate alerts"
            description="Tell me when a certificate is issued or due to expire."
            checked={certificateAlerts}
            onChange={(v) =>
              setPref(NOTIF_KEYS.certificateAlerts, v, setCertificateAlerts)
            }
          />
          <NotifRow
            id="notif-announcements"
            title="Announcements"
            description="Show pop-up announcements from your organisation."
            checked={announcements}
            onChange={(v) =>
              setPref(NOTIF_KEYS.announcements, v, setAnnouncements)
            }
          />
        </CardContent>
      </Card>

      {/* Integrations (super admins only) */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Connect Google for automatic Calendar sync and Google Meet links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Video className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    Google Calendar and Meet
                  </p>
                  {google.data?.connected_email ? (
                    <p className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3.5" /> Connected as{" "}
                      {google.data.connected_email}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not connected
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant={google.data ? "outline" : "default"}
                onClick={connectGoogle}
              >
                {google.data ? "Reconnect" : "Connect Google"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sessions sync to your Google Calendar; virtual sessions get a
              Google Meet link (Zoom is the automatic backup).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Password */}
      <PasswordCard />

      <MailSettingsCard />
    </div>
  )
}

interface NotifRowProps {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}

function NotifRow({ id, title, description, checked, onChange }: NotifRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {title}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
