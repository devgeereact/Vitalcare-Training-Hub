import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Video } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase/client"

// Dedicated OAuth client for Calendar/Meet (separate from the sign-in client).
const GOOGLE_CLIENT_ID =
  "100759784690-hdbfkuuuiftq9fcemcvkplfgd5j7qcv0.apps.googleusercontent.com"
const OAUTH_REDIRECT =
  "https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/google-oauth-callback"
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ")

/**
 * Google Calendar and Meet connection card. Super-admin only. Renders the OAuth
 * status and reconnect control, and surfaces the redirect result toast.
 */
export default function GoogleIntegrationCard(): React.ReactElement {
  const { user } = useAuth()
  const { isSuperAdmin } = useUser()
  const [params, setParams] = useSearchParams()

  const google = useQuery({
    queryKey: ["google-oauth-status"],
    queryFn: async () => {
      // Via an RPC, not the table. Migration 067 revoked all client access to
      // google_oauth_tokens so the refresh_token column can never be read over
      // REST; querying the table directly returns null forever and the card
      // reads "not connected" even when Google is connected. The RPC returns
      // only connected_email and created_at, and is admin-gated.
      const { data, error } = await supabase.rpc("google_oauth_status")
      if (error) {
        console.error("[GoogleIntegrationCard]", error)
        return null
      }
      return data?.[0] ?? null
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

  function connectGoogle(): void {
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
              <p className="text-sm font-medium">Google Calendar and Meet</p>
              {google.data?.connected_email ? (
                <p className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="size-3.5" /> Connected as{" "}
                  {google.data.connected_email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not connected</p>
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
          Sessions sync to your Google Calendar; virtual sessions get a Google
          Meet link (Zoom is the automatic backup).
        </p>
      </CardContent>
    </Card>
  )
}
