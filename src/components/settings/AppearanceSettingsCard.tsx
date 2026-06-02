import { CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useUIThemeStore } from "@/store/ui-theme.store"

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
] as const

/**
 * Theme picker. Persists the chosen theme via the UI theme store (saved on this
 * device). Lives in its own card so it can sit cleanly under the Appearance tab.
 */
export default function AppearanceSettingsCard(): React.ReactElement {
  const { theme, setTheme } = useUIThemeStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose a theme. Saved on this device.</CardDescription>
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
  )
}
