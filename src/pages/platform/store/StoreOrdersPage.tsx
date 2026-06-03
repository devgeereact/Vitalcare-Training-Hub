import { toast } from "sonner"
import { Package, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { useAuth } from "@/hooks/use-auth"
import { useOrders, useConfirmOrder, gbp } from "@/lib/queries/store.queries"
import type { OrderStatus } from "@/types/database.types"

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-destructive/15 text-destructive",
}

export default function StoreOrdersPage() {
  const { isAdmin, profile } = useUser()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useOrders(isAdmin, user?.id)
  const confirm = useConfirmOrder(profile?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Orders</h1>
        <p className="mt-1 text-muted-foreground">
          {isAdmin ? "Confirm payments to enrol buyers automatically." : "Your purchases."}
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
              <p className="text-sm text-muted-foreground">Could not load orders.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    {isAdmin && <th className="px-5 py-3 font-medium">Buyer</th>}
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    {isAdmin && <th className="px-5 py-3 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {data!.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-mono text-xs">{o.reference}</td>
                      {isAdmin && <td className="px-5 py-3">{o.buyerName}</td>}
                      <td className="px-5 py-3 text-muted-foreground">{o.items || "-"}</td>
                      <td className="px-5 py-3">{gbp(o.total_pence)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {o.payment_method === "paypal" ? "PayPal" : "Bank transfer"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className={STATUS_STYLE[o.status]}>
                          {o.status}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          {o.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={confirm.isPending}
                              onClick={() =>
                                confirm
                                  .mutateAsync(o.id)
                                  .then(() => toast.success("Payment confirmed, buyer enrolled"))
                                  .catch(() => toast.error("Could not confirm"))
                              }
                            >
                              {confirm.isPending ? (
                                <Loader2 className="mr-1.5 size-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 size-4" />
                              )}
                              Confirm
                            </Button>
                          )}
                        </td>
                      )}
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
