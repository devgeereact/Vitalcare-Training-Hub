import { Building2, ImageIcon, Mail, Phone, ShieldCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { driveImageUrl } from "@/lib/drive-image"
import { cn } from "@/lib/utils"
import type { Profile, UserRole } from "@/types/database.types"
import ProfileImageUpload from "@/components/profile/ProfileImageUpload"

interface Props {
  profile: Profile
  role: UserRole | null
  bannerUrl: string | null
  jobTitle: string | null
  organisationName: string | null
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
  onAvatarUploaded,
  onBannerUploaded,
}: Props) {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.full_name ||
    "Your profile"

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Cover banner */}
      <div
        className={cn(
          "relative h-36 sm:h-44",
          !bannerUrl && "bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-dark",
        )}
      >
        {bannerUrl ? (
          <img
            src={driveImageUrl(bannerUrl, 1200)}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-white/20">
            <ImageIcon className="size-8" />
          </div>
        )}
        {/* Scrim so the avatar and the change-cover control stay legible. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="absolute right-3 top-3">
          <ProfileImageUpload
            folder="banners"
            label="Change cover image"
            onUploaded={onBannerUploaded}
            className="size-9 bg-black/40 text-white hover:bg-black/60"
          />
        </div>
      </div>

      {/* Identity row */}
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative inline-block shrink-0">
            <Avatar className="size-28 ring-4 ring-card shadow-md">
              <AvatarImage src={driveImageUrl(profile.avatar_url, 240)} alt={name} />
              <AvatarFallback className="bg-brand-navy/10 text-3xl font-semibold text-brand-navy">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="font-display text-3xl leading-none text-foreground">{name}</h1>
              <Badge variant="secondary" className="gap-1 capitalize">
                <ShieldCheck className="size-3" />
                {role?.replace(/_/g, " ") ?? "Member"}
              </Badge>
            </div>
            {jobTitle && (
              <p className="mt-1.5 text-sm font-medium text-muted-foreground">{jobTitle}</p>
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
      </div>
    </div>
  )
}
