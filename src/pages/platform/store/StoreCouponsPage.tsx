import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Ticket, AlertCircle, Plus, Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCoupons, useCouponMutations, gbp } from "@/lib/queries/store.queries"

export default function StoreCouponsPage() {
  const { data, isLoading, isError, refetch } = useCoupons()
  const mut = useCouponMutations()
  const [code, setCode] = useState("")
  const [kind, setKind] = useState<"percent" | "amount">("percent")
  const [amount, setAmount] = useState("")

  function create() {
    if (!code.trim() || !amount) return
    const n = parseFloat(amount)
    mut.create
      .mutateAsync({
        code,
        percentOff: kind === "percent" ? Math.round(n) : null,
        amountOffPence: kind === "amount" ? Math.round(n * 100) : null,
      })
      .then(() => {
        toast.success("Coupon created")
        setCode("")
        setAmount("")
      })
      .catch(() => toast.error("Could not create (code may exist)"))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Coupons</h1>
        <p className="mt-1 text-muted-foreground">
          Discount codes applied at checkout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New coupon</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="mb-1.5 block text-xs">Code</Label>
            <Input
              placeholder="WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-40"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent off</SelectItem>
                <SelectItem value="amount">Amount off (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">{kind === "percent" ? "Percent" : "£ off"}</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28"
            />
          </div>
          <Button onClick={create} disabled={!code.trim() || !amount || mut.create.isPending}>
            {mut.create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-1.5 size-4" /> Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load coupons.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Ticket className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">No coupons yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data!.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <code className="rounded bg-muted px-2 py-1 text-sm font-medium">{c.code}</code>
                  <span className="text-sm text-muted-foreground">
                    {c.percent_off ? `${c.percent_off}% off` : c.amount_off_pence ? `${gbp(c.amount_off_pence)} off` : "-"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    used {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                    {c.expires_at ? ` · expires ${format(new Date(c.expires_at), "d MMM yyyy")}` : ""}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {!c.is_active && <Badge variant="secondary">Inactive</Badge>}
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(v) =>
                        mut.toggle
                          .mutateAsync({ id: c.id, isActive: v })
                          .catch(() => toast.error("Could not update"))
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
