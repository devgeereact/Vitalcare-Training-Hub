import { useUIThemeStore } from "@/store/ui-theme.store"
import { useUser } from "@/hooks/use-user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const VITALCARE_THEMES = [
  { id: "vitalcare-default", label: "Vitalcare", preview: "bg-gradient-to-br from-[#1b2e6b] to-[#d4a843]" },
  { id: "dark-clinical", label: "Dark Clinical", preview: "bg-gradient-to-br from-slate-900 to-slate-700" },
  { id: "light-professional", label: "Light Pro", preview: "bg-gradient-to-br from-gray-50 to-gray-200" },
  { id: "navy-minimal", label: "Navy Minimal", preview: "bg-gradient-to-br from-[#1b2e6b] to-[#142054]" },
]

export default function SettingsPage() {
  const { theme, setTheme } = useUIThemeStore()
  const { profile, role } = useUser()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and how the platform looks.
        </p>
      </div>

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
