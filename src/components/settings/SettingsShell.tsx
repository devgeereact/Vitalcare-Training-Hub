import type { ReactNode } from "react"

interface SettingsShellProps {
  /** Optional override for the page description shown under the title. */
  description?: string
  children: ReactNode
}

/**
 * Shared shell for every Settings sub-page. Renders a consistent header; the
 * General / Integrations / Password sub-navigation is provided by SectionTabs
 * in the app layout.
 */
export default function SettingsShell({
  description = "Manage your account, integrations and how the platform looks.",
  children,
}: SettingsShellProps): ReactNode {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </header>

      <div className="space-y-6">{children}</div>
    </div>
  )
}
