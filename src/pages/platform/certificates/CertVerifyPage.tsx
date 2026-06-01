import { useState } from "react"
import { format } from "date-fns"
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  BadgeCheck,
  ShieldX,
  Loader2,
} from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  useCertStats,
  verifyByUuid,
  type VerifyResult,
} from "@/lib/queries/certificates.queries"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; cert: VerifyResult }
  | { kind: "not_found" }

export default function CertVerifyPage() {
  const stats = useCertStats()
  const [uuid, setUuid] = useState("")
  const [state, setState] = useState<LookupState>({ kind: "idle" })

  async function lookup() {
    if (!UUID_RE.test(uuid.trim())) {
      setState({ kind: "not_found" })
      return
    }
    setState({ kind: "loading" })
    try {
      const cert = await verifyByUuid(uuid)
      setState(cert ? { kind: "found", cert } : { kind: "not_found" })
    } catch {
      setState({ kind: "not_found" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Verification</h1>
        <p className="mt-1 text-muted-foreground">
          Certificate status overview and lookup.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total issued" value={stats.data?.total ?? 0} icon={Award} loading={stats.isLoading} />
        <StatCard label="Active" value={stats.data?.active ?? 0} icon={ShieldCheck} loading={stats.isLoading} />
        <StatCard label="Expiring (30 days)" value={stats.data?.expiringSoon ?? 0} icon={Clock} loading={stats.isLoading} />
        <StatCard label="Expired" value={stats.data?.expired ?? 0} icon={ShieldAlert} loading={stats.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify a certificate</CardTitle>
          <CardDescription>
            Enter a verification ID to confirm a certificate is genuine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="00000000-0000-0000-0000-000000000000"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
            <Button onClick={lookup} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              <span className="ml-1.5">Verify</span>
            </Button>
          </div>

          {state.kind === "found" && (
            <div
              className={`rounded-lg border p-4 ${
                state.cert.is_valid
                  ? "border-success/30 bg-success/5"
                  : "border-warning/30 bg-warning/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {state.cert.is_valid ? (
                  <BadgeCheck className="size-5 text-success" />
                ) : (
                  <ShieldAlert className="size-5 text-warning" />
                )}
                <span className="font-medium">
                  {state.cert.is_valid ? "Valid certificate" : "Expired certificate"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Learner</dt>
                  <dd className="font-medium">{state.cert.learner_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Course</dt>
                  <dd className="font-medium">{state.cert.course_title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CPD hours</dt>
                  <dd className="font-medium">{state.cert.cpd_hours}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="font-medium">
                    {format(new Date(state.cert.issued_at), "d MMM yyyy")}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {state.kind === "not_found" && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <ShieldX className="size-5 text-destructive" />
              No certificate found for that ID.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
