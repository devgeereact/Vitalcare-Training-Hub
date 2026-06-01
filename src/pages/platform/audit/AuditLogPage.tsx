import { format } from "date-fns"
import { ScrollText, AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuditLogs } from "@/lib/queries/audit.queries"

export default function AuditLogPage() {
  const { data, isLoading, isError, refetch } = useAuditLogs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Audit log</h1>
        <p className="mt-1 text-muted-foreground">
          A record of significant actions across the platform.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load the audit log. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ScrollText className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No audit entries recorded yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3"
                >
                  <Badge variant="outline" className="font-mono text-xs">
                    {row.action}
                  </Badge>
                  {row.entity_type && (
                    <span className="text-sm text-muted-foreground">
                      {row.entity_type}
                      {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {row.actorName} ·{" "}
                    {format(new Date(row.created_at), "d MMM yyyy, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
