import { toast } from "sonner"
import { AlertTriangle, UserRound } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@/hooks/use-user"
import {
  readProfileExtras,
  updateOwnProfile,
  useOrganisationName,
} from "@/lib/queries/profile.queries"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileMetrics from "@/components/profile/ProfileMetrics"
import ProfileDetailsCard from "@/components/platform/ProfileDetailsCard"

export default function ProfilePage() {
  const { profile, refreshProfile, loading } = useAuth()
  const { role } = useUser()
  const extras = readProfileExtras(profile)
  const org = useOrganisationName(profile?.organisation_id)

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
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl">
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

  const emergencySet =
    !!profile.emergency_contact_name?.trim() &&
    !!profile.emergency_contact_phone?.trim()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ProfileHeader
        profile={profile}
        role={role}
        bannerUrl={extras.banner_url}
        jobTitle={extras.job_title}
        organisationName={org.data ?? null}
        onAvatarUploaded={(url) => void saveImage("avatar_url", url)}
        onBannerUploaded={(url) => void saveImage("banner_url", url)}
      />

      <section>
        <h2 className="mb-3 font-display text-xl text-foreground">
          At a glance
        </h2>
        <ProfileMetrics userId={profile.id} role={role} />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfileDetailsCard />
        </div>

        <div className="space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>A short bio for colleagues.</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.about?.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {profile.about}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a short bio in Your details so colleagues know who you
                  are.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Emergency contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency contact</CardTitle>
              <CardDescription>Who we call if needed.</CardDescription>
            </CardHeader>
            <CardContent>
              {emergencySet ? (
                <div className="space-y-1 text-sm">
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
                    No emergency contact on file. Add one in Your details.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
