import { format } from "date-fns"
import { CreditCard, AlertCircle, CheckCircle2, Landmark, Check } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { usePlans, useSubscription } from "@/lib/queries/payments.queries"
import { COMPANY } from "@/lib/constants"

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100)
}

export default function PaymentsPage() {
  const { profile } = useUser()
  const plans = usePlans()
  const sub = useSubscription(profile?.organisation_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Payments &amp; billing</h1>
        <p className="mt-1 text-muted-foreground">
          Your plan, invoices and how to pay. We accept bank transfer and PayPal.
        </p>
      </div>

      {/* Current subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          {sub.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : sub.data ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{sub.data.planName}</p>
                  <p className="text-xs text-muted-foreground">
                    Started {format(new Date(sub.data.started_at), "d MMM yyyy")}
                    {sub.data.ends_at
                      ? ` · renews ${format(new Date(sub.data.ends_at), "d MMM yyyy")}`
                      : ""}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="capitalize text-success"
              >
                {sub.data.status}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active subscription. Choose a plan below, then pay by bank transfer
              or PayPal to activate it.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-3 font-display text-xl text-foreground">Plans</h2>
        {plans.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : plans.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Could not load plans. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => plans.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (plans.data?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                No plans published yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.data!.map((p) => {
              const features = Array.isArray(p.features)
                ? (p.features as string[])
                : []
              const current = sub.data?.plan_id === p.id
              return (
                <Card key={p.id} className={current ? "border-brand-gold" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>
                      <span className="font-display text-2xl text-foreground">
                        {gbp(p.price_pence)}
                      </span>{" "}
                      / {p.interval}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {features.length > 0 && (
                      <ul className="space-y-1.5">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 size-4 shrink-0 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button className="w-full" variant={current ? "outline" : "default"} disabled={current}>
                      {current ? "Current plan" : "Choose plan"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Bank transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-5 text-brand-navy" /> Pay by bank transfer
          </CardTitle>
          <CardDescription>
            Quote your organisation name as the reference. Email the remittance to{" "}
            {COMPANY.email} and we will activate your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Account name</p>
            <p className="font-medium">{COMPANY.legalName}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Company number</p>
            <p className="font-medium">{COMPANY.companyNumber}</p>
          </div>
          <div className="rounded-lg border border-border p-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Billing enquiries</p>
            <p className="font-medium">
              {COMPANY.email} · {COMPANY.phone}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
