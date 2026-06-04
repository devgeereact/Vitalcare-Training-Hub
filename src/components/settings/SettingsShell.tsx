import type { ReactNode } from "react"

interface SettingsShellProps {
  /** Optional override for the page description shown under the title. */
  description?: string
  children: ReactNode
}

/**
 * Shared header shell for standalone Settings sub-pages (e.g. the Google Drive
 * OAuth callback landing at /platform/settings/integrations). The main Settings
 * page provides its own in-page tabs; this only renders a consistent heading.
 */
export default function SettingsShell({
  description = "Manage your account, integrations and how the platform looks.",
  children,
}: SettingsShellProps): ReactNode {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </header>

      <div className="space-y-6">{children}</div>
    </div>
  )
}
