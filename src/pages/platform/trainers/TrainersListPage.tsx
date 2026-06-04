import { useState } from "react"
import { GraduationCap, AlertCircle, Mail, CalendarDays } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrainers } from "@/lib/queries/trainers.queries"
import { useUser } from "@/hooks/use-user"
import ContactDetailById from "@/components/platform/ContactDetailById"
import { VerifiedTick, VerifyControl } from "@/components/platform/Verification"

export default function TrainersListPage() {
  const { data, isLoading, isError, refetch } = useTrainers()
  const { isSuperAdmin } = useUser()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Trainers</h1>
        <p className="mt-1 text-muted-foreground">
          Your delivery team, their specialisms and session load.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Could not load trainers. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <GraduationCap className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No trainers yet. Add a team member with the trainer role to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((t) => (
            <Card key={t.id} className="flex h-full flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-navy/10 text-base font-semibold text-brand-navy">
                    {t.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className="block truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded"
                    >
                      <CardTitle className="flex items-center gap-1.5 text-base hover:text-brand-navy">
                        <span className="truncate">{t.name}</span>
                        <VerifiedTick verified={t.isVerified} />
                      </CardTitle>
                    </button>
                    <a
                      href={`mailto:${t.email}`}
                      className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3" /> {t.email}
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {t.bio && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{t.bio}</p>
                )}
                {t.specialisms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {t.specialisms.slice(0, 4).map((s) => (
                      <Badge key={s} variant="secondary" className="font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {t.sessionsCount} session{t.sessionsCount === 1 ? "" : "s"} delivered
                </p>
                {isSuperAdmin && (
                  <div className="border-t border-border pt-3">
                    <VerifyControl
                      userId={t.id}
                      verified={t.isVerified}
                      name={t.name}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactDetailById userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
