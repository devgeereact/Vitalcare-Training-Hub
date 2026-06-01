import { format } from "date-fns"
import { Receipt, AlertCircle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { useSubscriptionHistory } from "@/lib/queries/payments.queries"

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100)
}

export default function FeesReceiptsPage() {
  const { profile } = useUser()
  const { data, isLoading, isError, refetch } = useSubscriptionHistory(
    profile?.organisation_id,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Fees &amp; receipts</h1>
        <p className="mt-1 text-muted-foreground">
          Your billing history. Receipts are issued by email on each payment.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load billing history. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Receipt className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No billing history yet. Once you take a plan, your receipts appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Started</th>
                    <th className="px-5 py-3 font-medium">Ends</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{r.planName}</td>
                      <td className="px-5 py-3">
                        {r.pricePence > 0 ? `${gbp(r.pricePence)} / ${r.interval}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {format(new Date(r.started_at), "d MMM yyyy")}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.ends_at ? format(new Date(r.ends_at), "d MMM yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
