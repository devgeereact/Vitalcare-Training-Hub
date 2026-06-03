import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"
import { BRAND, COMPANY, LOGOS } from "@/lib/constants"
import { certVerificationRef, certVerifyUrl } from "@/lib/certificates/pdf"
import type { CertTemplate } from "@/lib/queries/certificates.queries"

export interface CertificatePreviewValues {
  learnerName: string
  courseTitle: string
  issuedAt: string
  /** Optional expiry. When present, shown alongside the issue date. */
  expiresAt?: string | null
  verificationUuid: string
}

const SAMPLE: CertificatePreviewValues = {
  learnerName: "Jane Okafor",
  courseTitle: "Moving and Handling",
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
 * A4-landscape live preview of a certificate, built to match the printed jsPDF
 * output: a navy header band with the wordmark, a gold rule, a centred body
 * with the learner name between flanking rules, a three-column footer (dates,
 * signature, verification with QR) and a company bar.
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
  const ref = certVerificationRef(v.verificationUuid)
  const label =
    "font-sans text-[clamp(0.42rem,0.95vw,0.62rem)] font-bold uppercase tracking-[0.08em] text-brand-navy"

  return (
    <div
      className={cn(
        "relative mx-auto flex aspect-[297/210] w-full flex-col overflow-hidden rounded-md border border-border bg-white shadow-sm",
        className,
      )}
    >
      {/* Navy header band with the white wordmark */}
      <div className="flex h-[20%] items-center justify-center bg-brand-navy px-[6%]">
        <img
          src={LOGOS.horizontalWhite}
          alt="Vitalcare Training Hub"
          className="h-[clamp(1.6rem,5.5vw,3.4rem)] w-auto"
        />
      </div>
      {/* Gold rule */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center px-[7%] py-[3%] text-center">
        <p className="font-display text-[clamp(1.1rem,3.6vw,2.1rem)] leading-tight text-brand-navy">
          {template.titleText || "Certificate of Completion"}
        </p>
        <p className="mt-[1.4%] font-display text-[clamp(0.6rem,1.5vw,0.95rem)] italic text-muted-foreground">
          {template.introText || "This is to certify that"}
        </p>

        {/* Name with flanking rules */}
        <div className="mt-[1.6%] flex w-full items-center justify-center gap-[3%]">
          <span className="h-px flex-1 bg-brand-navy/40" />
          <span className="whitespace-nowrap font-display text-[clamp(1.4rem,4.4vw,2.7rem)] leading-tight text-brand-navy">
            {v.learnerName}
          </span>
          <span className="h-px flex-1 bg-brand-navy/40" />
        </div>

        <p className="mt-[1.6%] font-display text-[clamp(0.58rem,1.4vw,0.92rem)] italic text-muted-foreground">
          {template.completionText || "has successfully completed"}
        </p>
        <p className="mt-[0.6%] font-display text-[clamp(0.85rem,2.3vw,1.45rem)] font-semibold leading-tight text-brand-navy">
          {v.courseTitle}
        </p>
        <p className="mt-[1%] font-display text-[clamp(0.5rem,1.2vw,0.78rem)] italic text-muted-foreground">
          {template.accreditationLine || "CSTF-aligned, CPD-accredited"}
        </p>

        {/* Gold divider */}
        <div className="mt-[2.4%] h-px w-[78%] bg-brand-gold/70" />

        {/* Three-column footer */}
        <div className="mt-[2.6%] grid w-full grid-cols-[1fr_auto_1fr] items-start gap-[3%] text-left">
          {/* Left: dates */}
          <div>
            <p className={label}>Issued</p>
            <p className="font-display text-[clamp(0.5rem,1.2vw,0.78rem)] text-foreground">
              {formatDate(v.issuedAt)}
            </p>
            {v.expiresAt ? (
              <>
                <p className={cn(label, "mt-[8%]")}>Expires</p>
                <p className="font-display text-[clamp(0.5rem,1.2vw,0.78rem)] text-foreground">
                  {formatDate(v.expiresAt)}
                </p>
              </>
            ) : null}
          </div>

          {/* Centre: signature */}
          <div className="min-w-[40%] text-center">
            {template.signatureImageUrl ? (
              <img
                src={template.signatureImageUrl}
                alt="Signature"
                className="mx-auto mb-[2px] h-[clamp(1.3rem,3.6vw,2.4rem)] w-auto object-contain"
              />
            ) : (
              <p
                className="mb-[2px] text-[clamp(0.95rem,2.6vw,1.7rem)] leading-none text-brand-navy"
                style={CURSIVE_STYLE}
              >
                {template.signatoryName}
              </p>
            )}
            <div className="mx-auto h-px w-full bg-foreground/60" />
            <p className="mt-[3%] text-[clamp(0.46rem,1.05vw,0.7rem)] font-semibold text-brand-navy">
              {template.signatoryName}
            </p>
            <p className="font-display text-[clamp(0.44rem,1vw,0.66rem)] text-muted-foreground">
              {template.signatoryRole}
            </p>
            <p className="font-display text-[clamp(0.44rem,1vw,0.66rem)] text-muted-foreground">
              {COMPANY.legalName}
            </p>
          </div>

          {/* Right: verification + QR */}
          <div className="flex items-start justify-end gap-[5%]">
            <div className="min-w-0 text-right">
              <p className={label}>Verification ID</p>
              <p className="text-[clamp(0.5rem,1.2vw,0.8rem)] font-semibold text-brand-navy">
                {ref.short}
              </p>
              <p className="font-display text-[clamp(0.42rem,0.95vw,0.62rem)] italic text-muted-foreground">
                Scan to verify
              </p>
              <p className="break-all text-[clamp(0.36rem,0.8vw,0.52rem)] leading-tight text-muted-foreground">
                {v.verificationUuid}
              </p>
            </div>
            <div className="shrink-0 rounded-[2px] bg-white p-[2px] ring-1 ring-brand-navy/15">
              <QRCodeSVG
                value={certVerifyUrl(v.verificationUuid)}
                size={256}
                level="M"
                bgColor="#ffffff"
                fgColor={BRAND.navy}
                marginSize={2}
                className="h-[clamp(2rem,6.5vw,3.8rem)] w-[clamp(2rem,6.5vw,3.8rem)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Company bar */}
      <div className="border-t border-border bg-[#f6f7fb] py-[1.4%] text-center font-display text-[clamp(0.44rem,0.95vw,0.66rem)] text-muted-foreground">
        {template.footerText ||
          `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} · Verify at ${COMPANY.website}/verify`}
      </div>
    </div>
  )
}
