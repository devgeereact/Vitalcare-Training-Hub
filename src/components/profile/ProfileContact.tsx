import {
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  ShieldAlert,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Profile } from "@/types/database.types"

interface Props {
  profile: Profile
  organisationName: string | null
}

function Line({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null | undefined
}): React.ReactElement {
  const has = !!value?.trim()
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-navy">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">
          {has ? value : "Not set"}
        </p>
      </div>
    </div>
  )
}

/**
 * Read-only contact details and emergency contact. Mirrors the saved profile;
 * editing happens in Settings.
 */
export default function ProfileContact({
  profile,
  organisationName,
}: Props): React.ReactElement {
  const emergencySet =
    !!profile.emergency_contact_name?.trim() &&
    !!profile.emergency_contact_phone?.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact details</CardTitle>
        <CardDescription>How colleagues reach you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Line icon={Mail} label="Email" value={profile.email} />
        <Line icon={Phone} label="Phone" value={profile.phone} />
        <Line
          icon={Building2}
          label="Organisation"
          value={organisationName}
        />

        <div className="border-t border-border pt-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldAlert className="size-3.5" />
            Emergency contact
          </p>
          {emergencySet ? (
            <div className="space-y-0.5 text-sm">
              <p className="font-medium text-foreground">
                {profile.emergency_contact_name}
              </p>
              <p className="text-muted-foreground">
                {profile.emergency_contact_phone}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span className="text-foreground">
                No emergency contact on file. Add one in Settings.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
