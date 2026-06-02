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
 * Gold medallion seal, drawn as an SVG so it stays crisp at any print scale.
 * A fluted outer ring, a guilloche-style inner ring and the company monogram.
 */
function GoldSeal({ className }: { className?: string }) {
  const teeth = Array.from({ length: 48 })
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Vitalcare seal of completion"
    >
      <defs>
        <radialGradient id="seal-face" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#e8c26a" />
          <stop offset="55%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#a9842f" />
        </radialGradient>
        <linearGradient id="seal-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22387f" />
          <stop offset="100%" stopColor="#142054" />
        </linearGradient>
      </defs>

      {/* Ribbon tails */}
      <path d="M44 96 L34 118 L48 110 L52 120 L60 98 Z" fill="url(#seal-ribbon)" />
      <path d="M76 96 L86 118 L72 110 L68 120 L60 98 Z" fill="url(#seal-ribbon)" />

      {/* Fluted edge */}
      {teeth.map((_, i) => {
        const a = (i / teeth.length) * Math.PI * 2
        const r1 = 52
        const r2 = 57
        return (
          <circle
            key={i}
            cx={60 + Math.cos(a) * ((r1 + r2) / 2)}
            cy={60 + Math.sin(a) * ((r1 + r2) / 2)}
            r={2.4}
            fill="#c79a38"
          />
        )
      })}

      <circle cx="60" cy="60" r="52" fill="url(#seal-face)" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#fff6e0" strokeOpacity="0.55" strokeWidth="0.8" />
      {/* Guilloche-style inner ring */}
      <circle cx="60" cy="60" r="40" fill="none" stroke="#8c6b22" strokeWidth="0.5" strokeDasharray="1 2" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="#fff6e0" strokeOpacity="0.6" strokeWidth="0.7" />

      {/* Monogram */}
      <text
        x="60"
        y="58"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'DM Serif Display', serif"
        fontSize="30"
        fill="#142054"
      >
        VC
      </text>
      <text
        x="60"
        y="78"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'DM Sans', sans-serif"
        fontSize="6.5"
        letterSpacing="1.5"
        fill="#142054"
        fillOpacity="0.85"
      >
        VERIFIED
      </text>
    </svg>
  )
}

/** Decorative corner flourish, mirrored via the transform prop. */
function CornerFlourish({
  className,
  transform,
}: {
  className?: string
  transform?: string
}) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden transform={transform}>
      <path
        d="M4 4 L4 30 M4 4 L30 4"
        fill="none"
        stroke="#d4a843"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 10 Q10 26 26 26 M10 10 Q26 10 26 26"
        fill="none"
        stroke="#1b2e6b"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <circle cx="10" cy="10" r="1.8" fill="#d4a843" />
    </svg>
  )
}

/**
 * A4-landscape live preview of a certificate. Print-grade single layout with a
 * double guilloche-style frame, a gold medallion seal and a cursive signature.
 * Renders sample (or supplied) learner values. The Clinical Director sign-off is
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
  const ref = certVerificationRef(v.verificationUuid)
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[297/210] w-full overflow-hidden rounded-md bg-[#fdfcf7] shadow-sm",
        className,
      )}
    >
      {/* Soft engine-turned background tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(27,46,107,0.05), transparent 60%), repeating-radial-gradient(circle at 50% 50%, rgba(27,46,107,0.025) 0, rgba(27,46,107,0.025) 1px, transparent 1px, transparent 7px)",
        }}
      />

      {/* Outer gold frame */}
      <div className="absolute inset-[1.6%] rounded-[3px] border-[3px] border-brand-gold" />
      {/* Thin navy keyline */}
      <div className="absolute inset-[2.9%] rounded-[2px] border border-brand-navy/45" />
      {/* Hairline gold inner rule */}
      <div className="absolute inset-[3.6%] rounded-[2px] border border-brand-gold/40" />

      {/* Corner flourishes */}
      <CornerFlourish className="absolute left-[3.4%] top-[4.6%] h-[7%] w-auto" />
      <CornerFlourish className="absolute right-[3.4%] top-[4.6%] h-[7%] w-auto" transform="scale(-1 1)" />
      <CornerFlourish className="absolute bottom-[4.6%] left-[3.4%] h-[7%] w-auto" transform="scale(1 -1)" />
      <CornerFlourish className="absolute bottom-[4.6%] right-[3.4%] h-[7%] w-auto" transform="scale(-1 -1)" />

      <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[6.5%] text-center">
        {/* Crest */}
        <div className="flex w-full flex-col items-center">
          <img
            src={LOGOS.roundNavy}
            alt="Vitalcare Training Hub"
            className="h-[clamp(1.6rem,5vw,3rem)] w-auto"
          />
          <p className="mt-[1.4%] font-display text-[clamp(1.3rem,4vw,2.5rem)] leading-tight text-brand-navy">
            {template.titleText || "Certificate of Completion"}
          </p>
          <div className="mt-[1%] flex items-center gap-2">
            <span className="h-px w-[clamp(1.5rem,6vw,4rem)] bg-brand-gold" />
            <span className="size-[6px] rotate-45 bg-brand-gold" />
            <span className="h-px w-[clamp(1.5rem,6vw,4rem)] bg-brand-gold" />
          </div>
        </div>

        {/* Recital */}
        <div className="w-full">
          <p className="text-[clamp(0.55rem,1.3vw,0.82rem)] uppercase tracking-[0.2em] text-muted-foreground">
            {template.introText || "This is to certify that"}
          </p>
          <p className="mt-[1.4%] font-display text-[clamp(1.5rem,5vw,3.2rem)] leading-tight text-brand-navy">
            {v.learnerName}
          </p>
          <div className="mx-auto mt-[1%] h-[2px] w-[40%] max-w-[18rem] bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
          <p className="mt-[2.2%] text-[clamp(0.55rem,1.3vw,0.82rem)] uppercase tracking-[0.2em] text-muted-foreground">
            {template.completionText || "has successfully completed"}
          </p>
          <p className="mt-[0.8%] font-display text-[clamp(1rem,2.8vw,1.7rem)] leading-tight text-brand-navy">
            {v.courseTitle}
          </p>
          <p className="mt-[2.2%] text-[clamp(0.5rem,1.1vw,0.72rem)] text-muted-foreground">
            Issued {formatDate(v.issuedAt)}
            {v.expiresAt ? ` · Valid to ${formatDate(v.expiresAt)}` : ""}
          </p>
          {template.accreditationLine ? (
            <p className="mt-[0.4%] text-[clamp(0.48rem,1vw,0.68rem)] font-medium text-brand-navy/70">
              {template.accreditationLine}
            </p>
          ) : null}
        </div>

        {/* Signature block, seal and verification */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[3%]">
          {/* Signature (left) */}
          <div className="text-left">
            {template.signatureImageUrl ? (
              <img
                src={template.signatureImageUrl}
                alt="Signature"
                className="mb-[2px] h-[clamp(1.4rem,4vw,2.6rem)] w-auto object-contain object-left"
              />
            ) : (
              <p
                className="mb-[2px] text-[clamp(0.95rem,2.4vw,1.5rem)] leading-none text-brand-navy"
                style={CURSIVE_STYLE}
              >
                {template.signatoryName}
              </p>
            )}
            <div className="h-px w-[clamp(6rem,18vw,12rem)] bg-brand-navy/70" />
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

          {/* Seal (centre) */}
          <GoldSeal className="h-[clamp(2.6rem,9vw,5.5rem)] w-auto self-end" />

          {/* Verification (right): certificate code, full UUID and scannable QR */}
          <div className="flex items-end justify-end gap-[4%]">
            <div className="min-w-0 text-right">
              <p className="text-[clamp(0.5rem,1.1vw,0.72rem)] font-semibold text-brand-navy">
                {ref.short}
              </p>
              <p className="text-[clamp(0.42rem,0.92vw,0.6rem)] text-muted-foreground">
                Scan to verify
              </p>
              <p className="break-all text-[clamp(0.38rem,0.85vw,0.56rem)] leading-tight text-muted-foreground">
                {v.verificationUuid}
              </p>
            </div>
            <div className="shrink-0 rounded-[2px] bg-white p-[3px] shadow-sm ring-1 ring-brand-navy/10">
              <QRCodeSVG
                value={certVerifyUrl(v.verificationUuid)}
                size={256}
                level="M"
                bgColor="#ffffff"
                fgColor={BRAND.navy}
                marginSize={2}
                className="h-[clamp(2.2rem,7vw,4.2rem)] w-[clamp(2.2rem,7vw,4.2rem)]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {template.footerText ? (
          <p className="text-[clamp(0.42rem,0.9vw,0.6rem)] tracking-wide text-muted-foreground/70">
            {template.footerText}
          </p>
        ) : null}
      </div>
    </div>
  )
}
