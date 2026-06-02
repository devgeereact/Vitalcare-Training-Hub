import { AlertCircle, Users } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfileDepartments } from "@/lib/queries/profile.queries"

interface Props {
  userId: string | undefined
}

/**
 * Teams and departments the user belongs to. Renders nothing when the user has
 * no memberships, so the card is omitted rather than showing an empty shell.
 */
export default function ProfileDepartments({
  userId,
}: Props): React.ReactElement | null {
  const { data, isLoading, isError, refetch } = useProfileDepartments(userId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teams and departments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teams and departments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-2 text-center">
          <AlertCircle className="size-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            We could not load your teams.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Omit the card entirely when there is nothing to show.
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams and departments</CardTitle>
        <CardDescription>Where you collaborate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-navy/10 text-brand-navy">
              <Users className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {d.name}
              </p>
              {d.description?.trim() && (
                <p className="truncate text-xs text-muted-foreground">
                  {d.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
