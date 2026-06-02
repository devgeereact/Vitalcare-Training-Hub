import { cn } from "@/lib/utils"
import { COMPANY, LOGOS } from "@/lib/constants"
import type { CertTemplate } from "@/lib/queries/certificates.queries"

export interface CertificatePreviewValues {
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  verificationUuid: string
}

const SAMPLE: CertificatePreviewValues = {
  learnerName: "Jane Okafor",
  courseTitle: "Moving and Handling",
  cpdHours: 3,
  issuedAt: new Date().toISOString(),
  verificationUuid: "00000000-0000-0000-0000-000000000000",
}

const NAVY = "#1b2e6b"
const GOLD = "#d4a843"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** A signed name rendered in a cursive style above its line, with role + org. */
function Signatory({
  name,
  role,
  imageUrl,
  align = "left",
}: {
  name: string
  role: string
  imageUrl?: string | null
  align?: "left" | "right" | "center"
}): React.JSX.Element {
  const alignClass =
    align === "right" ? "items-end text-right" : align === "center" ? "items-center text-center" : "items-start text-left"
  return (
    <div className={cn("flex flex-col", alignClass)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Signature"
          className="mb-1 h-[clamp(1.3rem,3.6vw,2.4rem)] w-auto object-contain"
        />
      ) : (
        <p className="mb-1 font-display italic text-[clamp(0.85rem,2.2vw,1.4rem)] leading-none text-brand-navy">
          {name}
        </p>
      )}
      <div className="h-px w-[clamp(5rem,15vw,10rem)] bg-brand-navy/70" />
      <p className="mt-[2px] text-[clamp(0.5rem,1.05vw,0.7rem)] font-semibold text-brand-navy">
        {name}
      </p>
      <p className="text-[clamp(0.45rem,0.95vw,0.64rem)] text-muted-foreground">{role}</p>
    </div>
  )
}

/** Decorative gold rosette / seal built from SVG. Branded navy + gold. */
function Rosette({ className }: { className?: string }): React.JSX.Element {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2
    const r = i % 2 === 0 ? 50 : 40
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`
  }).join(" ")
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={points} fill={GOLD} />
      <circle cx="50" cy="50" r="33" fill={NAVY} />
      <circle cx="50" cy="50" r="33" fill="none" stroke={GOLD} strokeWidth="2" />
      <circle cx="50" cy="50" r="22" fill="none" stroke={GOLD} strokeWidth="1.2" />
      <polygon points="50,32 54,46 50,42 46,46" fill={GOLD} />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill={GOLD}
        fontFamily="serif"
      >
        VC
      </text>
    </svg>
  )
}

function MetaLine({
  values,
  accreditationLine,
  className,
}: {
  values: CertificatePreviewValues
  accreditationLine: string
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-[clamp(0.5rem,1.05vw,0.7rem)] text-muted-foreground">
        {values.cpdHours} CPD hours · Issued {formatDate(values.issuedAt)}
      </p>
      {accreditationLine ? (
        <p className="mt-[2px] text-[clamp(0.48rem,1vw,0.68rem)] text-muted-foreground">
          {accreditationLine}
        </p>
      ) : null}
    </div>
  )
}

function VerifyLine({ uuid, className }: { uuid: string; className?: string }): React.JSX.Element {
  return (
    <div className={cn("text-[clamp(0.42rem,0.92vw,0.62rem)] text-muted-foreground", className)}>
      <p>Verify at {COMPANY.website}/verify</p>
      <p className="break-all">{uuid}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 1 — Completion: top navy band + gold wavy divider + gold rosette
// ---------------------------------------------------------------------------
function CompletionPreset({
  template,
  v,
}: {
  template: CertTemplate
  v: CertificatePreviewValues
}): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-md border border-brand-navy/10 bg-white">
      {/* Top navy band with gold wavy divider */}
      <div className="relative h-[34%] w-full" style={{ backgroundColor: NAVY }}>
        <div className="flex h-full flex-col items-center justify-center px-[6%] pb-[3%] text-center">
          <p className="font-display text-[clamp(1.2rem,4vw,2.4rem)] uppercase leading-none tracking-wide text-white">
            Certificate
          </p>
          <p className="mt-1 text-[clamp(0.6rem,1.6vw,1rem)] font-semibold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
            of Completion
          </p>
        </div>
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          className="absolute -bottom-px left-0 h-[18px] w-full"
          aria-hidden="true"
        >
          <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z" fill={GOLD} />
        </svg>
      </div>

      {/* Rosette top-right overlapping divider */}
      <Rosette className="absolute right-[5%] top-[24%] h-[clamp(2.4rem,9vw,4.4rem)] w-[clamp(2.4rem,9vw,4.4rem)] drop-shadow" />

      {/* Body */}
      <div className="flex flex-1 gap-[4%] px-[6%] py-[3.5%]">
        {/* Left column: logo + org */}
        <div className="flex w-[26%] flex-col items-start justify-center gap-2 border-r border-brand-navy/10 pr-[4%]">
          <img src={LOGOS.roundNavy} alt={COMPANY.name} className="h-[clamp(2rem,7vw,3.4rem)] w-auto" />
          <p className="font-display text-[clamp(0.7rem,1.7vw,1rem)] leading-tight text-brand-navy">
            {COMPANY.name}
          </p>
          <p className="text-[clamp(0.45rem,0.95vw,0.64rem)] text-muted-foreground">
            {COMPANY.legalName}
          </p>
        </div>
        {/* Right column: recital */}
        <div className="flex flex-1 flex-col justify-center text-left">
          <p className="text-[clamp(0.55rem,1.2vw,0.78rem)] uppercase tracking-wide text-muted-foreground">
            {template.introText || "This is to certify that"}
          </p>
          <p className="mt-1 font-display text-[clamp(1.3rem,4.2vw,2.6rem)] leading-tight text-brand-navy">
            {v.learnerName}
          </p>
          <p className="mt-[2%] text-[clamp(0.55rem,1.2vw,0.78rem)] text-muted-foreground">
            {template.completionText || "has successfully completed"}{" "}
            <span className="font-display text-brand-navy">{v.courseTitle}</span>
          </p>
          <MetaLine
            values={v}
            accreditationLine={template.accreditationLine}
            className="mt-[3%] text-left"
          />
        </div>
      </div>

      {/* Two signatures + verify */}
      <div className="flex items-end justify-between gap-3 px-[6%] pb-[3%]">
        <Signatory
          name={template.signatoryName}
          role={template.signatoryRole}
          imageUrl={template.signatureImageUrl}
        />
        <VerifyLine uuid={v.verificationUuid} className="text-center" />
        <Signatory name="Training Instructor" role="Issuing Trainer" align="right" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 2 — Participation: corner waves + hexagons + star rosette (centred)
// ---------------------------------------------------------------------------
function Hexagon({ x, y, size, fill, opacity }: { x: number; y: number; size: number; fill: string; opacity: number }): React.JSX.Element {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${x + size * Math.cos(a)},${y + size * Math.sin(a)}`
  }).join(" ")
  return <polygon points={pts} fill={fill} opacity={opacity} />
}

function ParticipationPreset({
  template,
  v,
}: {
  template: CertTemplate
  v: CertificatePreviewValues
}): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-md border border-brand-navy/10 bg-white px-[10%] py-[5%] text-center">
      {/* Corner waves + hex accents */}
      <svg viewBox="0 0 1200 850" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M0,0 L420,0 C320,90 360,210 220,250 C90,290 60,170 0,260 Z" fill={NAVY} />
        <path d="M0,0 L360,0 C300,70 300,190 180,210 C70,230 40,150 0,210 Z" fill={GOLD} opacity="0.85" />
        <path d="M1200,850 L780,850 C880,760 840,640 980,600 C1110,560 1140,680 1200,590 Z" fill={NAVY} />
        <path d="M1200,850 L840,850 C900,780 900,660 1020,640 C1130,620 1160,700 1200,640 Z" fill={GOLD} opacity="0.85" />
        <Hexagon x={1050} y={120} size={26} fill={NAVY} opacity={0.12} />
        <Hexagon x={1110} y={210} size={16} fill={GOLD} opacity={0.3} />
        <Hexagon x={120} y={720} size={22} fill={NAVY} opacity={0.1} />
        <Hexagon x={180} y={640} size={14} fill={GOLD} opacity={0.3} />
      </svg>

      {/* Star rosette top-right */}
      <Rosette className="absolute right-[7%] top-[8%] h-[clamp(2.2rem,8vw,4rem)] w-[clamp(2.2rem,8vw,4rem)]" />

      <div className="relative flex flex-col items-center">
        <img src={LOGOS.roundNavy} alt={COMPANY.name} className="mb-2 h-[clamp(1.8rem,6vw,3rem)] w-auto" />
        <p className="font-display text-[clamp(1.2rem,4vw,2.4rem)] uppercase leading-none tracking-wide text-brand-navy">
          Certificate
        </p>
        <p className="mt-1 text-[clamp(0.6rem,1.6vw,1rem)] font-semibold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
          of Participation
        </p>
        <p className="mt-[3%] text-[clamp(0.55rem,1.2vw,0.78rem)] text-muted-foreground">
          {template.introText || "This certificate is proudly presented to"}
        </p>
        <p
          className="mt-1 bg-clip-text font-display text-[clamp(1.5rem,5vw,3rem)] leading-tight text-transparent"
          style={{ backgroundImage: `linear-gradient(90deg, ${GOLD}, ${NAVY})` }}
        >
          {v.learnerName}
        </p>
        <p className="mt-[2%] max-w-[80%] text-[clamp(0.55rem,1.2vw,0.78rem)] text-muted-foreground">
          {template.completionText || "for participating in"}{" "}
          <span className="font-display text-brand-navy">{v.courseTitle}</span>
        </p>
        <MetaLine values={v} accreditationLine={template.accreditationLine} className="mt-[3%]" />
      </div>

      {/* Single signatory bottom-left + verify bottom-right */}
      <div className="relative mt-auto flex w-full items-end justify-between gap-3 pt-[4%]">
        <Signatory
          name={template.signatoryName}
          role={template.signatoryRole}
          imageUrl={template.signatureImageUrl}
        />
        <VerifyLine uuid={v.verificationUuid} className="text-right" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 3 — Achievement: ornate double border + gold lower band + medallion
// ---------------------------------------------------------------------------
function AchievementPreset({
  template,
  v,
}: {
  template: CertTemplate
  v: CertificatePreviewValues
}): React.JSX.Element {
  return (
    <div className="relative h-full overflow-hidden rounded-md bg-white" style={{ border: `4px solid ${NAVY}` }}>
      <div className="absolute inset-[6px] rounded-sm" style={{ border: `1.5px solid ${GOLD}` }} />
      {/* Navy corner blocks */}
      <div className="absolute left-0 top-0 h-[12%] w-[18%]" style={{ background: NAVY, clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <div className="absolute right-0 top-0 h-[12%] w-[18%]" style={{ background: NAVY, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
      {/* Gold lower band */}
      <div className="absolute bottom-[6px] left-[6px] right-[6px] h-[16%]" style={{ background: `linear-gradient(180deg, transparent, ${GOLD}22)` }} />

      {/* Hex watermark */}
      <svg viewBox="0 0 1200 850" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <Hexagon x={600} y={420} size={220} fill={NAVY} opacity={0.03} />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center px-[10%] py-[6%] text-center">
        <img src={LOGOS.roundNavy} alt={COMPANY.name} className="mb-2 h-[clamp(1.6rem,5.5vw,2.8rem)] w-auto" />
        <p className="font-display text-[clamp(1.3rem,4.4vw,2.6rem)] uppercase leading-none tracking-wide text-brand-navy">
          Certificate
        </p>
        <p className="mt-1 text-[clamp(0.62rem,1.7vw,1.05rem)] font-semibold uppercase tracking-[0.38em]" style={{ color: GOLD }}>
          of Achievement
        </p>
        <p className="mt-[3%] text-[clamp(0.55rem,1.2vw,0.78rem)] text-muted-foreground">
          {template.introText || "This certificate is proudly presented to"}
        </p>
        <p className="mt-1 font-display text-[clamp(1.4rem,4.8vw,2.8rem)] leading-tight text-brand-navy">
          {v.learnerName}
        </p>
        <div className="mx-auto mt-1 h-[2px] w-[28%]" style={{ backgroundColor: GOLD }} />
        <p className="mt-[2%] max-w-[78%] text-[clamp(0.55rem,1.2vw,0.78rem)] text-muted-foreground">
          {template.completionText || "for outstanding achievement in"}{" "}
          <span className="font-display text-brand-navy">{v.courseTitle}</span>
        </p>
        <MetaLine values={v} accreditationLine={template.accreditationLine} className="mt-[2.5%]" />

        {/* Medallion between two signatories */}
        <div className="mt-auto flex w-full items-end justify-between gap-3 pt-[3%]">
          <Signatory
            name={template.signatoryName}
            role={template.signatoryRole}
            imageUrl={template.signatureImageUrl}
          />
          <Rosette className="h-[clamp(2rem,7vw,3.4rem)] w-[clamp(2rem,7vw,3.4rem)] shrink-0" />
          <Signatory name="Training Instructor" role="Issuing Trainer" align="right" />
        </div>
        <VerifyLine uuid={v.verificationUuid} className="mt-[1.5%] text-center" />
      </div>
    </div>
  )
}

/**
 * A4-landscape live preview of a certificate. Renders the chosen visual preset
 * with sample (or supplied) learner values, all in Vitalcare navy + gold. The
 * Clinical Director sign-off is always present. Mirrors the jsPDF output.
 */
export function CertificatePreview({
  template,
  values,
  className,
}: {
  template: CertTemplate
  values?: Partial<CertificatePreviewValues>
  className?: string
}): React.JSX.Element {
  const v: CertificatePreviewValues = { ...SAMPLE, ...values }
  return (
    <div className={cn("mx-auto aspect-[297/210] w-full overflow-hidden rounded-md shadow-sm", className)}>
      {template.preset === "participation" ? (
        <ParticipationPreset template={template} v={v} />
      ) : template.preset === "achievement" ? (
        <AchievementPreset template={template} v={v} />
      ) : (
        <CompletionPreset template={template} v={v} />
      )}
    </div>
  )
}
