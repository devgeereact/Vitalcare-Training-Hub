import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { BadgeCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle } from "lucide-react"
import { PageHero } from "@/components/marketing/PageHero"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"

interface CertResult {
  learner_name: string
  course_title: string
  cpd_hours: number
  issued_at: string
  expires_at: string | null
  is_valid: boolean
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; cert: CertResult; id: string }
  | { kind: "invalid_input" }
  | { kind: "not_found" }
  | { kind: "error" }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function VerifyCertPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get("id") ?? "")
  const [state, setState] = useState<State>({ kind: "idle" })

  const verify = useCallback(async (uuid: string) => {
    const id = uuid.trim()
    if (!UUID_RE.test(id)) {
      setState({ kind: "invalid_input" })
      return
    }
    setState({ kind: "loading" })
    const { data, error } = await supabase.rpc("verify_certificate", {
      p_uuid: id,
    })
    if (error) {
      console.error("[verify_certificate]", error)
      setState({ kind: "error" })
      return
    }
    const cert = data?.[0]
    setState(cert ? { kind: "found", cert, id } : { kind: "not_found" })
  }, [])

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) void verify(id)
    // run once on mount for a deep link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(value.trim() ? { id: value.trim() } : {})
    void verify(value)
  }

  return (
    <>
      <PageHero
        eyebrow="Verify a certificate"
        title="Check a Vitalcare certificate"
        description="Enter the verification code printed on the certificate to confirm it is genuine and in date."
      />

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Verification code (UUID)"
            aria-label="Certificate verification code"
            className="font-mono focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          />
          <Button
            type="submit"
            disabled={state.kind === "loading"}
            className="shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            {state.kind === "loading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        <div className="mt-8">
          {state.kind === "found" && state.cert.is_valid ? (
            <div className="overflow-hidden rounded-2xl border border-success/30 bg-success/[0.04]">
              <div className="flex items-center gap-3 border-b border-success/20 px-6 py-5">
                <BadgeCheck className="size-8 text-success" />
                <div>
                  <p className="font-display text-2xl text-brand-navy">
                    Valid certificate
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Genuine and currently in date.
                  </p>
                </div>
              </div>
              <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                <Field label="Learner" value={state.cert.learner_name} />
                <Field label="Course" value={state.cert.course_title} />
                <Field label="CPD hours" value={`${state.cert.cpd_hours}`} />
                <Field label="Issued" value={formatDate(state.cert.issued_at)} />
                {state.cert.expires_at ? (
                  <Field label="Expires" value={formatDate(state.cert.expires_at)} />
                ) : (
                  <Field label="Expires" value="No expiry" />
                )}
                <Field label="Verification code" value={state.id} mono />
              </dl>
            </div>
          ) : null}

          {state.kind === "found" && !state.cert.is_valid ? (
            <div className="overflow-hidden rounded-2xl border border-warning/40 bg-warning/[0.05]">
              <div className="flex items-center gap-3 border-b border-warning/30 px-6 py-5">
                <ShieldAlert className="size-8 text-warning" />
                <div>
                  <p className="font-display text-2xl text-brand-navy">
                    Certificate expired
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Genuine, but no longer in date. A refresher is due.
                  </p>
                </div>
              </div>
              <dl className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                <Field label="Learner" value={state.cert.learner_name} />
                <Field label="Course" value={state.cert.course_title} />
                {state.cert.expires_at ? (
                  <Field label="Expired on" value={formatDate(state.cert.expires_at)} />
                ) : null}
              </dl>
            </div>
          ) : null}

          {state.kind === "invalid_input" ? (
            <Notice
              icon={<AlertTriangle className="size-6 text-warning" />}
              title="That does not look like a verification code"
              body="Verification codes are printed at the foot of every Vitalcare certificate, in the format shown above."
            />
          ) : null}

          {state.kind === "not_found" ? (
            <Notice
              icon={<ShieldX className="size-6 text-muted-foreground" />}
              title="No matching certificate"
              body="Check the verification code and try again."
            />
          ) : null}

          {state.kind === "error" ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-8 text-center">
              <p className="font-semibold text-destructive">
                Verification is unavailable right now
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please try again in a moment.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-6">
      {icon}
      <div>
        <p className="font-semibold text-brand-navy">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
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
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 font-medium text-brand-navy ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  )
}
