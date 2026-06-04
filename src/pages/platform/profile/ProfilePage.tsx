import { toast } from "sonner"
import { BarChart3, UserRound } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import {
  readProfileExtras,
  updateOwnProfile,
  useOrganisationName,
  useProfileMetrics,
} from "@/lib/queries/profile.queries"
import ProfileIdentityCard from "@/components/profile/ProfileIdentityCard"
import ProfilePersonalInfo from "@/components/profile/ProfilePersonalInfo"
import ProfileMetrics from "@/components/profile/ProfileMetrics"
import ProfileContact from "@/components/profile/ProfileContact"
import ProfileDepartments from "@/components/profile/ProfileDepartments"
import ProfileActivity from "@/components/profile/ProfileActivity"

export default function ProfilePage(): React.ReactElement {
  const { profile, refreshProfile, loading } = useAuth()
  const { role } = useUser()
  const extras = readProfileExtras(profile)
  const org = useOrganisationName(profile?.organisation_id)
  // Headline chips reuse the same role-based metrics as the overview grid.
  const metrics = useProfileMetrics(profile?.id, role)

  async function saveImage(
    field: "avatar_url" | "banner_url",
    url: string,
  ): Promise<void> {
    if (!profile?.id) return
    try {
      await updateOwnProfile(profile.id, { [field]: url })
      await refreshProfile()
    } catch {
      toast.error("Could not save the image. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-1" />
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <UserRound className="size-8 text-muted-foreground" />
          <h1 className="font-display text-2xl text-foreground">
            Profile unavailable
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            We could not load your profile. Sign out and back in, then try
            again.
          </p>
        </div>
      </div>
    )
  }

  const chips = metrics.data?.slice(0, 3)

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      {/* Left column: identity card, contact, teams. */}
      <div className="space-y-6 lg:col-span-1">
        <ProfileIdentityCard
          profile={profile}
          role={role}
          bannerUrl={extras.banner_url}
          jobTitle={extras.job_title}
          metrics={chips}
          onAvatarUploaded={(url) => void saveImage("avatar_url", url)}
          onBannerUploaded={(url) => void saveImage("banner_url", url)}
        />
        <ProfileContact profile={profile} organisationName={org.data ?? null} />
        <ProfileDepartments userId={profile.id} />
      </div>

      {/* Main column: about + personal info, overview metrics, activity. */}
      <div className="space-y-6 lg:col-span-2">
        <ProfilePersonalInfo
          profile={profile}
          role={role}
          organisationName={org.data ?? null}
        />

        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-navy/5 text-brand-navy">
              <BarChart3 className="size-4" />
            </span>
            <h2 className="font-display text-lg leading-none text-foreground">
              Overview
            </h2>
          </div>
          <ProfileMetrics userId={profile.id} role={role} />
        </section>

        <ProfileActivity userId={profile.id} role={role} />
      </div>
    </div>
  )
}
