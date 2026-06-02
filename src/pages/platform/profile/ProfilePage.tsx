import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"
import ProfileDetailsCard from "@/components/platform/ProfileDetailsCard"

export default function ProfilePage() {
  const { profile, role } = useUser()
  const name =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Your profile"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">My profile</h1>
        <p className="mt-1 text-muted-foreground">View and update your details.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-navy/10 text-xl font-semibold text-brand-navy">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <CardTitle className="font-display text-2xl">{name}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {role?.replace("_", " ") ?? "—"}
                </Badge>
                <span className="text-sm text-muted-foreground">{profile?.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        {profile?.about && (
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {profile.about}
            </p>
          </CardContent>
        )}
      </Card>

      <ProfileDetailsCard />
    </div>
  )
}
