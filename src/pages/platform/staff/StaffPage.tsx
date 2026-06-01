import { Users, AlertCircle, Mail } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useStaff } from "@/lib/queries/org.queries"
import type { UserRole } from "@/types/database.types"

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  trainer: "Trainer",
  content_editor: "Content editor",
}

const ROLE_STYLE: Partial<Record<UserRole, string>> = {
  super_admin: "bg-brand-navy/10 text-brand-navy",
  admin: "bg-primary/10 text-primary",
  manager: "bg-success/15 text-success",
  trainer: "bg-brand-gold/20 text-brand-gold",
  content_editor: "bg-muted text-muted-foreground",
}

export default function StaffPage() {
  const { data, isLoading, isError, refetch } = useStaff()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Staff</h1>
        <p className="mt-1 text-muted-foreground">
          Everyone with administrative, management or delivery access.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load staff. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Users className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No staff accounts yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-navy/10 text-sm font-semibold text-brand-navy">
                    {s.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <a
                      href={`mailto:${s.email}`}
                      className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3" /> {s.email}
                    </a>
                  </div>
                  <Badge variant="secondary" className={ROLE_STYLE[s.role]}>
                    {ROLE_LABEL[s.role] ?? s.role}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
