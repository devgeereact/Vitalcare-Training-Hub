import type { ComponentType } from "react"

import { cn } from "@/lib/utils"

export interface SettingsTabItem {
  /** Stable id used in the ?tab= query param. */
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
}

interface SettingsTabsProps {
  items: SettingsTabItem[]
  active: string
  onChange: (id: string) => void
}

/**
 * Shared segmented tab bar for the Settings page. Mirrors the Communication
 * CommsNav pattern: navy active pill on a card, gold focus rings, and the bar
 * scrolls horizontally on narrow screens. Implemented as an accessible tablist
 * so content panels can switch in place without changing route.
 */
export default function SettingsTabs({
  items,
  active,
  onChange,
}: SettingsTabsProps): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`settings-tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`settings-panel-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2",
              isActive
                ? "bg-card text-brand-navy shadow-sm"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
