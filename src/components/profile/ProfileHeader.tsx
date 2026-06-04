import { Building2, Mail, Phone, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { driveImageUrl } from "@/lib/drive-image"
import { cn } from "@/lib/utils"
import type { Profile, UserRole } from "@/types/database.types"
import type { ProfileMetric } from "@/lib/queries/profile.queries"
import ProfileImageUpload from "@/components/profile/ProfileImageUpload"
import { VerifiedTick } from "@/components/platform/Verification"

interface Props {
  profile: Profile
  role: UserRole | null
  bannerUrl: string | null
  jobTitle: string | null
  organisationName: string | null
  /** Up to three real headline metrics, shown as chips. Optional. */
  chips?: ProfileMetric[]
  onAvatarUploaded: (url: string) => void
  onBannerUploaded: (url: string) => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Cover banner, avatar and core identity for the standalone profile page. */
export default function ProfileHeader({
  profile,
  role,
  bannerUrl,
  jobTitle,
  organisationName,
  chips,
  onAvatarUploaded,
  onBannerUploaded,
}: Props): React.ReactElement {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.full_name ||
    "Your profile"

  const avatarSrc = driveImageUrl(profile.avatar_url, 256)
  const roleLabel = role?.replace(/_/g, " ") ?? "Member"

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Cover banner: fixed aspect, object-cover, navy/gold gradient fallback. */}
      <div className="relative aspect-[4/1] min-h-[120px] w-full overflow-hidden bg-brand-navy">
        {bannerUrl ? (
          <img
            src={driveImageUrl(bannerUrl, 1600)}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-dark to-brand-navy"
          >
            <div className="absolute -right-8 -top-10 size-48 rounded-full bg-brand-gold/20 blur-2xl" />
            <div className="absolute bottom-0 left-10 size-40 rounded-full bg-brand-gold/10 blur-2xl" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <ProfileImageUpload
            folder="banners"
            label="Change cover image"
            onUploaded={onBannerUploaded}
            className="size-9 bg-black/40 text-white hover:bg-black/60"
          />
        </div>
      </div>

      {/* Identity block. Name sits on the white card below the banner. */}
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar: fixed square, object-cover, rounded-full, ring. */}
          <div className="relative shrink-0">
            <div className="relative size-28 overflow-hidden rounded-full bg-brand-navy/5 ring-4 ring-card shadow-md">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-brand-navy/10 text-3xl font-semibold text-brand-navy">
                  {initials(name)}
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1">
              <ProfileImageUpload
                folder="avatars"
                label="Change profile picture"
                onUploaded={onAvatarUploaded}
                className="size-8 border-2 border-card shadow-sm"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="flex items-center gap-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                {name}
                <VerifiedTick verified={profile.is_verified} className="[&_svg]:size-6" />
              </h1>
              <Badge
                variant="secondary"
                className="gap-1 border-brand-navy/10 bg-brand-navy/5 capitalize text-brand-navy"
              >
                <ShieldCheck className="size-3" />
                {roleLabel}
              </Badge>
            </div>
            {jobTitle && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {jobTitle}
              </p>
            )}
          </div>
        </div>

        {/* Contact line */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
          {profile.email && (
            <span className="flex min-w-0 items-center gap-1.5">
              <Mail className="size-4 shrink-0 text-brand-navy" />
              <span className="truncate">{profile.email}</span>
            </span>
          )}
          {profile.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="size-4 shrink-0 text-brand-navy" />
              {profile.phone}
            </span>
          )}
          {organisationName && (
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4 shrink-0 text-brand-navy" />
              {organisationName}
            </span>
          )}
        </div>

        {/* Quick-stat badges from real metrics: solid pills, the last accented. */}
        {chips && chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((m, i) => (
              <span
                key={m.key}
                className={cn(
                  "inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                  i === chips.length - 1
                    ? "bg-success text-white"
                    : "bg-brand-navy text-white",
                )}
              >
                <span className="text-sm leading-none">
                  {m.value.toLocaleString("en-GB")}
                  {m.suffix ?? ""}
                </span>
                <span className="font-medium opacity-90">{m.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
