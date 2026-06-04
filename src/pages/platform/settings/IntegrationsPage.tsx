import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import SettingsShell from "@/components/settings/SettingsShell"
import IntegrationsManager from "@/components/settings/IntegrationsManager"

/**
 * Super-admin integrations page. Manage external service API keys through the
 * IntegrationsManager (status cards plus a per-integration dialog). Also handles
 * the Google Drive OAuth callback toasts.
 */
export default function IntegrationsPage() {
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const d = params.get("drive")
    if (!d) return
    if (d === "connected") toast.success("Google Drive connected")
    else if (d === "norefresh") toast.error("Reconnect needed, no refresh token returned")
    else if (d === "noclient") toast.error("Set Drive client ID and secret first")
    else if (d === "error") toast.error("Google Drive connection failed")
    params.delete("drive")
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SettingsShell description="Connect external services by adding their API keys and secrets.">
      <IntegrationsManager />
    </SettingsShell>
  )
}
