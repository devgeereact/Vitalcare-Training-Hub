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
  AlertTriangle,
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
import { Badge } from "@/components/ui/badge"
import {
  useCertStats,
  verifyByUuid,
  type VerifyResult,
} from "@/lib/queries/certificates.queries"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; cert: VerifyResult; id: string }
  | { kind: "invalid_input" }
  | { kind: "not_found" }
  | { kind: "error" }

function fmt(iso: string): string {
  return format(new Date(iso), "d MMM yyyy")
}

export default function CertVerifyPage() {
  const stats = useCertStats()
  const [uuid, setUuid] = useState("")
  const [state, setState] = useState<LookupState>({ kind: "idle" })

  async function lookup() {
    const id = uuid.trim()
    if (!UUID_RE.test(id)) {
      setState({ kind: "invalid_input" })
      return
    }
    setState({ kind: "loading" })
    try {
      const cert = await verifyByUuid(id)
      setState(cert ? { kind: "found", cert, id } : { kind: "not_found" })
    } catch {
      setState({ kind: "error" })
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
            Enter a verification ID to confirm a certificate is genuine and in date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="00000000-0000-0000-0000-000000000000"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              className="font-mono focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              aria-label="Certificate verification ID"
            />
            <Button
              onClick={lookup}
              disabled={state.kind === "loading"}
              className="shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {state.kind === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              <span className="ml-1.5">Verify</span>
            </Button>
          </div>

          {state.kind === "found" ? (
            <ResultCard cert={state.cert} id={state.id} />
          ) : null}

          {state.kind === "invalid_input" ? (
            <Notice
              tone="warning"
              icon={<AlertTriangle className="size-5 text-warning" />}
              title="That does not look like a verification ID"
              body="Verification IDs are in the format shown in the box above."
            />
          ) : null}

          {state.kind === "not_found" ? (
            <Notice
              tone="destructive"
              icon={<ShieldX className="size-5 text-destructive" />}
              title="No matching certificate"
              body="Check the verification ID and try again."
            />
          ) : null}

          {state.kind === "error" ? (
            <Notice
              tone="destructive"
              icon={<ShieldX className="size-5 text-destructive" />}
              title="Verification is unavailable right now"
              body="Please try again in a moment."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ResultCard({ cert, id }: { cert: VerifyResult; id: string }) {
  const valid = cert.is_valid
  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        valid ? "border-success/30 bg-success/[0.04]" : "border-warning/40 bg-warning/[0.05]"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-inherit px-5 py-4">
        {valid ? (
          <BadgeCheck className="size-6 text-success" />
        ) : (
          <ShieldAlert className="size-6 text-warning" />
        )}
        <div className="flex-1">
          <p className="font-display text-xl text-brand-navy">
            {valid ? "Valid certificate" : "Certificate expired"}
          </p>
          <p className="text-sm text-muted-foreground">
            {valid
              ? "Genuine and currently in date."
              : "Genuine, but no longer in date. A refresher is due."}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            valid
              ? "border-success/40 bg-success/10 text-success"
              : "border-warning/50 bg-warning/10 text-warning"
          }
        >
          {valid ? "In date" : "Expired"}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
        <Field label="Learner" value={cert.learner_name} />
        <Field label="Course" value={cert.course_title} />
        <Field label="CPD hours" value={String(cert.cpd_hours)} />
        <Field label="Issued" value={fmt(cert.issued_at)} />
        {cert.expires_at ? (
          <Field label="Expires" value={fmt(cert.expires_at)} />
        ) : (
          <Field label="Expires" value="No expiry" />
        )}
        <Field label="Verification ID" value={id} mono />
      </dl>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 font-medium text-brand-navy ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  )
}

function Notice({
  tone,
  icon,
  title,
  body,
}: {
  tone: "warning" | "destructive"
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
        tone === "warning"
          ? "border-warning/40 bg-warning/[0.05]"
          : "border-destructive/30 bg-destructive/[0.04]"
      }`}
    >
      {icon}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
