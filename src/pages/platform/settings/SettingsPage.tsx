import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Video } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ProfileDetailsCard from "@/components/platform/ProfileDetailsCard"

const VITALCARE_THEMES = [
  { id: "vitalcare-default", label: "Vitalcare", preview: "bg-gradient-to-br from-[#1b2e6b] to-[#d4a843]" },
  { id: "dark-clinical", label: "Dark Clinical", preview: "bg-gradient-to-br from-slate-900 to-slate-700" },
  { id: "light-professional", label: "Light Pro", preview: "bg-gradient-to-br from-gray-50 to-gray-200" },
  { id: "navy-minimal", label: "Navy Minimal", preview: "bg-gradient-to-br from-[#1b2e6b] to-[#142054]" },
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

export default function SettingsPage() {
  const { theme, setTheme } = useUIThemeStore()
  const { profile, role, isAdmin } = useUser()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

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
    enabled: isAdmin,
  })

  useEffect(() => {
    const g = params.get("google")
    if (!g) return
    if (g === "connected") toast.success("Google connected", { description: "Calendar + Meet are linked." })
    else if (g === "norefresh")
      toast.error("Reconnect needed", { description: "Google did not return a refresh token. Try again." })
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, integrations and how the platform looks.
        </p>
      </div>

      {/* Integrations (admins) */}
      {isAdmin && (
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
                  <p className="text-sm font-medium">Google Calendar &amp; Meet</p>
                  {google.data?.connected_email ? (
                    <p className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3.5" /> Connected as {google.data.connected_email}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              <Button variant={google.data ? "outline" : "default"} onClick={connectGoogle}>
                {google.data ? "Reconnect" : "Connect Google"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sessions sync to your Google Calendar; virtual sessions get a Google
              Meet link (Zoom is the automatic backup).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose a theme. Saved on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {VITALCARE_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={`relative h-24 rounded-lg cursor-pointer overflow-hidden transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 ${
                  theme === t.id ? "ring-2 ring-[#d4a843] scale-[1.03]" : "ring-1 ring-border"
                } ${t.preview}`}
              >
                <span className="absolute bottom-1.5 left-2 rounded bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ProfileDetailsCard />

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your profile details.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Name</Label>
            <p className="mt-1 text-sm font-medium">
              {profile?.full_name ||
                [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
                "—"}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="mt-1 text-sm font-medium">{profile?.email ?? "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Role</Label>
            <p className="mt-1 text-sm font-medium capitalize">
              {role?.replace("_", " ") ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
