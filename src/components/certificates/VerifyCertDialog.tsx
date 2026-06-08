import { useEffect, useState } from "react"
import { BadgeCheck, ShieldX, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { verifyByCode, type VerifyResult } from "@/lib/queries/certificates.queries"

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-brand-navy ${mono ? "font-mono break-all" : ""}`}>
        {value}
      </p>
    </div>
  )
}

/**
 * In-platform certificate check. Confirms a learner's own certificate is genuine
 * and in date without leaving the app. The public marketing verify page stays for
 * third parties checking authenticity.
 */
export default function VerifyCertDialog({
  code,
  onClose,
}: {
  code: string | null
  onClose: () => void
}): React.ReactElement {
  // Keyed by code so we never setState synchronously in the effect: the result
  // belongs to a specific code, and anything else reads as loading.
  const [result, setResult] = useState<{
    code: string
    value: VerifyResult | null | "error"
  } | null>(null)

  useEffect(() => {
    if (!code) return
    let active = true
    verifyByCode(code)
      .then((cert) => active && setResult({ code, value: cert }))
      .catch(() => active && setResult({ code, value: "error" }))
    return () => {
      active = false
    }
  }, [code])

  const state:
    | { kind: "loading" }
    | { kind: "found"; cert: VerifyResult }
    | { kind: "not_found" }
    | { kind: "error" } =
    !code || result?.code !== code
      ? { kind: "loading" }
      : result.value === "error"
        ? { kind: "error" }
        : result.value === null
          ? { kind: "not_found" }
          : { kind: "found", cert: result.value }

  return (
    <Dialog open={Boolean(code)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Certificate check</DialogTitle>
        </DialogHeader>

        {state.kind === "loading" && (
          <div className="flex items-center gap-3 py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Checking this certificate…
          </div>
        )}

        {state.kind === "found" && (
          <div
            className={`rounded-xl border p-5 ${
              state.cert.is_valid
                ? "border-success/30 bg-success/[0.06]"
                : "border-destructive/30 bg-destructive/[0.06]"
            }`}
          >
            <div className="flex items-center gap-3">
              {state.cert.is_valid ? (
                <BadgeCheck className="size-8 text-success" />
              ) : (
                <ShieldX className="size-8 text-destructive" />
              )}
              <div>
                <p className="font-display text-xl text-brand-navy">
                  {state.cert.is_valid ? "Valid certificate" : "Not currently valid"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {state.cert.is_valid
                    ? "Genuine and currently in date."
                    : "This certificate has expired or is not yet approved."}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
              <Field label="Learner" value={state.cert.learner_name} />
              <Field label="Course" value={state.cert.course_title} />
              <Field label="CPD hours" value={`${state.cert.cpd_hours}`} />
              <Field label="Issued" value={fmt(state.cert.issued_at)} />
              {state.cert.expires_at ? (
                <Field label="Expires" value={fmt(state.cert.expires_at)} />
              ) : null}
              <Field label="Verification code" value={state.cert.verification_code} mono />
            </div>
          </div>
        )}

        {state.kind === "not_found" && (
          <p className="py-6 text-sm text-muted-foreground">
            No certificate matches that code.
          </p>
        )}
        {state.kind === "error" && (
          <p className="py-6 text-sm text-destructive">
            Could not check this certificate. Please try again.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
