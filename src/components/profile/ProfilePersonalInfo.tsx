import { format } from "date-fns"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Profile, UserRole } from "@/types/database.types"

interface Props {
  profile: Profile
  role: UserRole | null
  organisationName: string | null
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">
        <span className="mr-2 text-muted-foreground/60">:</span>
        {value?.trim() ? value : "Not set"}
      </span>
    </div>
  )
}

function memberSince(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : format(d, "MMMM yyyy")
}

/**
 * "About" panel: the saved bio followed by a Personal Information block built
 * entirely from real profile fields.
 */
export default function ProfilePersonalInfo({
  profile,
  role,
  organisationName,
}: Props): React.JSX.Element {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.full_name ||
    "—"
  const hasBio = !!profile.about?.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p
          className={
            hasBio
              ? "whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              : "text-sm text-muted-foreground"
          }
        >
          {hasBio
            ? profile.about
            : "Add a short bio in Settings so colleagues know who you are."}
        </p>

        <div>
          <h3 className="mb-1 font-display text-lg text-brand-navy">
            Personal information
          </h3>
          <div className="divide-y divide-border">
            <Row label="Name" value={name} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone} />
            <Row
              label="Role"
              value={role?.replace(/_/g, " ") ?? null}
            />
            <Row label="Organisation" value={organisationName} />
            <Row label="Member since" value={memberSince(profile.created_at)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
