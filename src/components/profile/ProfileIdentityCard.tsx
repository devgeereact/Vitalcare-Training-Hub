import { Link } from "react-router-dom"
import { MessageSquare, Settings } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { driveImageUrl } from "@/lib/drive-image"
import type { Profile, UserRole } from "@/types/database.types"
import type { ProfileMetric } from "@/lib/queries/profile.queries"
import ProfileImageUpload from "@/components/profile/ProfileImageUpload"
import { VerifiedTick } from "@/components/platform/Verification"

interface Props {
  profile: Profile
  role: UserRole | null
  bannerUrl: string | null
  jobTitle: string | null
  /** Real headline metrics shown as label/value rows. */
  metrics?: ProfileMetric[]
  onAvatarUploaded: (url: string) => void
  onBannerUploaded: (url: string) => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Compact identity card: gradient banner, overlapping avatar, name with verified
 * tick, role, real headline metrics as rows, and the actions. Mirrors the
 * profile sidebar style while staying on real data.
 */
export default function ProfileIdentityCard({
  profile,
  role,
  bannerUrl,
  jobTitle,
  metrics,
  onAvatarUploaded,
  onBannerUploaded,
}: Props): React.JSX.Element {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.full_name ||
    "Your profile"
  const avatarSrc = driveImageUrl(profile.avatar_url, 256)
  const roleLabel = jobTitle || role?.replace(/_/g, " ") || "Member"

  return (
    <Card className="overflow-hidden">
      <div className="relative h-28 bg-brand-navy">
        {bannerUrl ? (
          <img
            src={driveImageUrl(bannerUrl, 1200)}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy"
          />
        )}
        <div className="absolute right-2 top-2">
          <ProfileImageUpload
            folder="banners"
            label="Change cover image"
            onUploaded={onBannerUploaded}
            className="size-8 bg-black/40 text-white hover:bg-black/60"
          />
        </div>
      </div>

      <CardContent className="flex flex-col items-center px-5 pb-5 text-center">
        <div className="relative -mt-12">
          <div className="relative size-24 overflow-hidden rounded-full bg-brand-navy/5 ring-4 ring-card">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-brand-navy/10 text-2xl font-semibold text-brand-navy">
                {initials(name)}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0">
            <ProfileImageUpload
              folder="avatars"
              label="Change profile picture"
              onUploaded={onAvatarUploaded}
              className="size-7 border-2 border-card shadow-sm"
            />
          </div>
        </div>

        <h1 className="mt-3 flex items-center gap-1.5 font-display text-xl text-foreground">
          {name}
          <VerifiedTick verified={profile.is_verified} className="[&_svg]:size-5" />
        </h1>
        <Badge
          variant="secondary"
          className="mt-1 capitalize border-brand-navy/10 bg-brand-navy/5 text-brand-navy"
        >
          {roleLabel}
        </Badge>

        {metrics && metrics.length > 0 && (
          <div className="mt-4 w-full divide-y divide-border border-y border-border">
            {metrics.map((m) => (
              <div
                key={m.key}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-semibold text-foreground">
                  {m.value.toLocaleString("en-GB")}
                  {m.suffix ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex w-full gap-2">
          <Button asChild className="flex-1">
            <Link to={`/platform/messages`}>
              <MessageSquare className="mr-1.5 size-4" /> Messages
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/platform/settings">
              <Settings className="mr-1.5 size-4" /> Edit
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
