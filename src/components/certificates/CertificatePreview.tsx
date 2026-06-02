import { cn } from "@/lib/utils"
import { COMPANY } from "@/lib/constants"
import type { CertTemplate } from "@/lib/queries/certificates.queries"

export interface CertificatePreviewValues {
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  /** Optional expiry. When present, shown alongside the issue date. */
  expiresAt?: string | null
  verificationUuid: string
}

const SAMPLE: CertificatePreviewValues = {
  learnerName: "Jane Okafor",
  courseTitle: "Moving and Handling",
  cpdHours: 3,
  issuedAt: new Date().toISOString(),
  expiresAt: null,
  verificationUuid: "00000000-0000-0000-0000-000000000000",
}

/** Cursive handwriting style for the signatory name. */
const CURSIVE_STYLE: React.CSSProperties = { fontFamily: "'Dancing Script', cursive" }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * A4-landscape live preview of a certificate. Renders the template sections
 * with sample (or supplied) learner values. The Clinical Director sign-off is
 * always present. Designed to match the printed jsPDF output.
 */
export function CertificatePreview({
  template,
  values,
  className,
}: {
  template: CertTemplate
  values?: Partial<CertificatePreviewValues>
  className?: string
}) {
  const v = { ...SAMPLE, ...values }
  return (
    <div
      className={cn(
        "mx-auto aspect-[297/210] w-full rounded-md border-[6px] border-brand-gold bg-white p-[2.5%] shadow-sm",
        className,
      )}
    >
      <div className="flex h-full flex-col items-center justify-between rounded border border-brand-navy/30 px-[5%] py-[4%] text-center">
        {/* Title */}
        <div className="w-full">
          <p className="font-display text-[clamp(1.1rem,3.4vw,2.1rem)] leading-tight text-brand-navy">
            {template.titleText || "Certificate of Completion"}
          </p>
          <div className="mx-auto mt-1 h-[2px] w-[18%] bg-brand-gold" />
        </div>

        {/* Recital */}
        <div className="w-full">
          <p className="text-[clamp(0.6rem,1.3vw,0.85rem)] text-muted-foreground">
            {template.introText || "This is to certify that"}
          </p>
          <p className="mt-[1.5%] font-display text-[clamp(1.3rem,4vw,2.6rem)] leading-tight text-brand-navy">
            {v.learnerName}
          </p>
          <p className="mt-[2%] text-[clamp(0.6rem,1.3vw,0.85rem)] text-muted-foreground">
            {template.completionText || "has successfully completed"}
          </p>
          <p className="mt-[0.5%] font-display text-[clamp(1rem,2.6vw,1.6rem)] leading-tight text-brand-navy">
            {v.courseTitle}
          </p>
          <p className="mt-[2%] text-[clamp(0.5rem,1.1vw,0.72rem)] text-muted-foreground">
            {v.cpdHours} CPD hours · Issued {formatDate(v.issuedAt)}
            {v.expiresAt ? ` · Valid to ${formatDate(v.expiresAt)}` : ""}
          </p>
          {template.accreditationLine ? (
            <p className="mt-[0.5%] text-[clamp(0.5rem,1.1vw,0.72rem)] text-muted-foreground">
              {template.accreditationLine}
            </p>
          ) : null}
        </div>

        {/* Signature block + verification */}
        <div className="flex w-full items-end justify-between gap-4">
          <div className="text-left">
            {template.signatureImageUrl ? (
              <img
                src={template.signatureImageUrl}
                alt="Signature"
                className="mb-1 h-[clamp(1.5rem,4vw,2.6rem)] w-auto object-contain object-left"
              />
            ) : (
              <p
                className="mb-1 text-[clamp(1.3rem,3.4vw,2.1rem)] leading-none text-brand-navy"
                style={CURSIVE_STYLE}
              >
                {template.signatoryName}
              </p>
            )}
            <div className="h-px w-[clamp(5rem,16vw,11rem)] bg-brand-navy/70" />
            <p className="mt-[2px] text-[clamp(0.5rem,1.1vw,0.72rem)] font-semibold text-brand-navy">
              {template.signatoryName}
            </p>
            <p className="text-[clamp(0.45rem,1vw,0.66rem)] text-muted-foreground">
              {template.signatoryRole}
            </p>
            <p className="text-[clamp(0.45rem,1vw,0.66rem)] text-muted-foreground">
              {COMPANY.legalName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[clamp(0.45rem,1vw,0.66rem)] text-muted-foreground">
              Verify at {COMPANY.website}/verify
            </p>
            <p className="break-all text-[clamp(0.45rem,1vw,0.66rem)] text-muted-foreground">
              {v.verificationUuid}
            </p>
          </div>
        </div>

        {/* Footer */}
        {template.footerText ? (
          <p className="text-[clamp(0.4rem,0.9vw,0.6rem)] text-muted-foreground/70">
            {template.footerText}
          </p>
        ) : null}
      </div>
    </div>
  )
}
