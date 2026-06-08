import { Suspense, type JSX } from "react"
import { lazyWithReload } from "@/lib/chunk-reload"
import { Link } from "react-router-dom"
import {
  Package,
  CheckCircle2,
  ShoppingCart,
  Banknote,
  AlertCircle,
  Clock,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { driveImageUrl } from "@/lib/drive-image"
import {
  useStoreStats,
  useOrders,
  gbp,
  type StoreStats,
  type OrderRow,
} from "@/lib/queries/store.queries"
import type { OrderStatus } from "@/types/database.types"

const OrdersTrendChart = lazyWithReload(
  () => import("@/components/store/OrdersTrendChart"),
)
const CatalogueStatusChart = lazyWithReload(
  () => import("@/components/store/CatalogueStatusChart"),
)

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-destructive/15 text-destructive",
}

function ChartSkeleton(): JSX.Element {
  return <Skeleton className="h-[280px] w-full rounded-md" />
}

/* ----------------------------------------------------------- stat tile -- */

interface TileProps {
  icon: typeof Package
  label: string
  value: string
  hint?: string
  accent?: "navy" | "gold"
}

function StatTile({ icon: Icon, label, value, hint, accent = "navy" }: TileProps): JSX.Element {
  const iconClass =
    accent === "gold"
      ? "bg-brand-gold/15 text-brand-gold"
      : "bg-brand-navy/10 text-brand-navy"
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl leading-tight text-foreground">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------- main section -- */

interface Props {
  /** Staff see all orders; learners see their own. */
  staff: boolean
  buyerId?: string
}

export default function StoreDashboard({ staff, buyerId }: Props): JSX.Element {
  const stats = useStoreStats()
  const orders = useOrders(staff, buyerId)

  if (stats.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load store metrics.</p>
          <Button variant="outline" size="sm" onClick={() => stats.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (stats.isLoading || !stats.data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[360px] w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-[360px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  const d: StoreStats = stats.data
  const hasOrders = d.totalOrders > 0
  const recent: OrderRow[] = (orders.data ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Package}
          label="Products"
          value={`${d.totalProducts}`}
          hint={`${d.publishedProducts} published · ${d.draftProducts} draft`}
        />
        <StatTile
          icon={ShoppingCart}
          label="Orders"
          value={`${d.totalOrders}`}
          hint={`${d.paidOrders} paid · ${d.pendingOrders} pending`}
          accent="gold"
        />
        <StatTile
          icon={Banknote}
          label="Revenue collected"
          value={gbp(d.revenuePence)}
          hint={d.paidOrders ? `Avg ${gbp(d.averageOrderPence)} per order` : "From paid orders"}
        />
        <StatTile
          icon={Clock}
          label="Outstanding"
          value={gbp(d.outstandingPence)}
          hint={`${d.pendingOrders} awaiting payment`}
          accent="gold"
        />
      </div>

      {/* Chart + status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="font-display text-lg">
                {hasOrders ? "Orders and revenue" : "Catalogue by status"}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {hasOrders
                  ? "Last six months. Revenue counts paid orders only."
                  : "No orders yet. Showing the catalogue split."}
              </p>
            </div>
            <TrendingUp className="size-5 text-brand-gold" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              {hasOrders ? (
                <OrdersTrendChart
                  labels={d.ordersByMonth.map((m) => m.label)}
                  orders={d.ordersByMonth.map((m) => m.orders)}
                  revenuePence={d.ordersByMonth.map((m) => m.revenuePence)}
                />
              ) : (
                <CatalogueStatusChart
                  published={d.publishedProducts}
                  draft={d.draftProducts}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent orders mini-table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-display text-lg">Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link to="/platform/store/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {orders.isLoading ? (
              <div className="space-y-3 px-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : orders.isError ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-xs text-muted-foreground">Could not load orders.</p>
                <Button variant="outline" size="sm" onClick={() => orders.refetch()}>
                  Retry
                </Button>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Package className="size-5" />
                </div>
                <p className="text-xs text-muted-foreground">No orders yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {staff ? o.buyerName : o.items || "Order"}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {o.reference ?? "-"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-medium">{gbp(o.total_pence)}</span>
                      <Badge variant="secondary" className={`text-[10px] ${STATUS_STYLE[o.status]}`}>
                        {o.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products strip */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-brand-gold" />
            <CardTitle className="font-display text-lg">Top products</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {hasOrders ? "By units sold on paid orders" : "By listed price"}
          </p>
        </CardHeader>
        <CardContent>
          {d.topProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="size-5" />
              </div>
              <p className="text-xs text-muted-foreground">No products to rank yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {d.topProducts.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="aspect-video w-full bg-muted">
                    {p.thumbnailUrl ? (
                      <img
                        src={driveImageUrl(p.thumbnailUrl, 400)}
                        alt={p.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Package className="size-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {p.name}
                    </p>
                    <p className="font-display text-base text-foreground">
                      {p.pricePence === 0 ? "Free" : gbp(p.pricePence)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3 text-success" />
                      {p.unitsSold > 0
                        ? `${p.unitsSold} sold · ${gbp(p.revenuePence)}`
                        : "No sales yet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
