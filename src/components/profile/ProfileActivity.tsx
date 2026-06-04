import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import ProfileCardHeader from "@/components/profile/ProfileCardHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useProfileActivity,
  type ProfileActivityItem,
  type ProfileActivityKind,
} from "@/lib/queries/profile.queries"
import type { UserRole } from "@/types/database.types"

interface Props {
  userId: string | undefined
  role: UserRole | null
}

/** Friendly UK date, e.g. "2 June 2026". */
function formatActivityDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const ICONS: Record<
  ProfileActivityKind,
  React.ComponentType<{ className?: string }>
> = {
  enrolment: BookOpen,
  completion: CheckCircle2,
  certificate: Award,
  session: CalendarDays,
}

function Row({
  item,
  last,
}: {
  item: ProfileActivityItem
  last: boolean
}): React.ReactElement {
  const Icon = ICONS[item.kind]
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
        />
      )}
      <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-brand-navy/5 text-brand-navy">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-sm text-foreground">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatActivityDate(item.at)}
        </p>
      </div>
    </li>
  )
}

/**
 * Recent activity timeline built from real platform data: enrolments,
 * completions and certificates for learners, sessions for trainers, recent
 * certificate issuance for staff. Loading, empty and error states included.
 */
export default function ProfileActivity({
  userId,
  role,
}: Props): React.ReactElement {
  const { data, isLoading, isError, refetch } = useProfileActivity(userId, role)

  return (
    <Card>
      <ProfileCardHeader
        icon={Activity}
        title="Recent activity"
        description="Your latest milestones on the hub."
      />
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">
              We could not load your recent activity.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Activity className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Your milestones appear here as you go.
            </p>
          </div>
        ) : (
          <ul className="mt-1">
            {data.map((item, i) => (
              <Row key={item.id} item={item} last={i === data.length - 1} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
