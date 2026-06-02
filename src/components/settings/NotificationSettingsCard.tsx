import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bell, BellRing, CheckCircle2, Loader2 } from "lucide-react"

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
import { useAuth } from "@/hooks/use-auth"
import { pushSupported, isPushEnabled, enablePush } from "@/lib/push"

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

interface NotifRowProps {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}

function NotifRow({
  id,
  title,
  description,
  checked,
  onChange,
}: NotifRowProps): React.ReactElement {
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

/**
 * Notification preferences. Combines the device-level topic toggles (stored in
 * localStorage) with the browser push enable control so every notification
 * setting lives in one place under the Notifications tab.
 */
export default function NotificationSettingsCard(): React.ReactElement {
  const { user } = useAuth()

  const [sessionReminders, setSessionReminders] = useState(() =>
    readPref(NOTIF_KEYS.sessionReminders),
  )
  const [certificateAlerts, setCertificateAlerts] = useState(() =>
    readPref(NOTIF_KEYS.certificateAlerts),
  )
  const [announcements, setAnnouncements] = useState(() =>
    readPref(NOTIF_KEYS.announcements),
  )

  function setPref(
    key: string,
    value: boolean,
    apply: (v: boolean) => void,
  ): void {
    localStorage.setItem(key, value ? "on" : "off")
    apply(value)
  }

  // Browser push state.
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const supported = pushSupported()

  useEffect(() => {
    if (!supported) return
    void isPushEnabled().then(setPushOn)
  }, [supported])

  function turnOnPush(): void {
    if (!user?.id) return
    setPushBusy(true)
    enablePush(user.id)
      .then(() => {
        setPushOn(true)
        toast.success("Push notifications enabled")
      })
      .catch((e: unknown) =>
        toast.error("Could not enable push", {
          description: e instanceof Error ? e.message : undefined,
        }),
      )
      .finally(() => setPushBusy(false))
  }

  return (
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

        {supported && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Browser push</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pushOn
                  ? "Push notifications are on for this browser."
                  : "Receive alerts even when this tab is closed."}
              </p>
            </div>
            {pushOn ? (
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="size-4" /> Enabled
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={pushBusy || !user?.id}
                onClick={turnOnPush}
                className="shrink-0"
              >
                {pushBusy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <BellRing className="mr-2 size-4" />
                )}
                Enable push
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
