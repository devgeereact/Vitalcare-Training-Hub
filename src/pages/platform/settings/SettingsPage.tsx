import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Bell, KeyRound, Palette, Plug, UserRound } from "lucide-react"

import { useUser } from "@/hooks/use-user"
import MailSettingsCard from "@/components/platform/MailSettingsCard"
import AccountSettingsCard from "@/components/settings/AccountSettingsCard"
import PasswordCard from "@/components/settings/PasswordCard"
import AppearanceSettingsCard from "@/components/settings/AppearanceSettingsCard"
import NotificationSettingsCard from "@/components/settings/NotificationSettingsCard"
import GoogleIntegrationCard from "@/components/settings/GoogleIntegrationCard"
import IntegrationsManager from "@/components/settings/IntegrationsManager"
import SettingsTabs, {
  type SettingsTabItem,
} from "@/components/settings/SettingsTabs"

type TabId =
  | "account"
  | "appearance"
  | "notifications"
  | "integrations"
  | "password"

export default function SettingsPage(): React.ReactElement {
  const { isSuperAdmin } = useUser()
  const [params, setParams] = useSearchParams()

  const tabs = useMemo<SettingsTabItem[]>(() => {
    const base: SettingsTabItem[] = [
      { id: "account", label: "Account", icon: UserRound },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "notifications", label: "Notifications", icon: Bell },
    ]
    if (isSuperAdmin) {
      base.push({ id: "integrations", label: "Integrations", icon: Plug })
    }
    base.push({ id: "password", label: "Password", icon: KeyRound })
    return base
  }, [isSuperAdmin])

  const requested = params.get("tab")
  const active: TabId = tabs.some((t) => t.id === requested)
    ? (requested as TabId)
    : "account"

  function selectTab(id: string): void {
    const next = new URLSearchParams(params)
    next.set("tab", id)
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, how the platform looks and what you hear about.
        </p>
      </header>

      <SettingsTabs items={tabs} active={active} onChange={selectTab} />

      <div
        role="tabpanel"
        id={`settings-panel-${active}`}
        aria-labelledby={`settings-tab-${active}`}
        className="space-y-6"
      >
        {active === "account" && (
          <>
            <AccountSettingsCard />
            <MailSettingsCard />
          </>
        )}

        {active === "appearance" && <AppearanceSettingsCard />}

        {active === "notifications" && <NotificationSettingsCard />}

        {active === "integrations" && isSuperAdmin && (
          <div className="space-y-6">
            <IntegrationsManager />
            <GoogleIntegrationCard />
          </div>
        )}

        {active === "password" && <PasswordCard />}
      </div>
    </div>
  )
}
