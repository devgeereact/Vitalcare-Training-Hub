import { cn } from "@/lib/utils"
import { COMPANY, LOGOS } from "@/lib/constants"
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

const NAVY = "#1b2e6b"
const NAVY_DARK = "#142054"
const GOLD = "#d4a843"
const GOLD_LIGHT = "#e8c26a"

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Short, human-readable certificate reference derived from the UUID. */
function certRef(uuid: string): string {
  return `VC-${uuid.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

// ---------------------------------------------------------------------------
// Shared ornaments
// ---------------------------------------------------------------------------

/**
 * Gold medallion with a navy core, concentric gold rings, a laurel wreath and
 * the Vitalcare monogram. Drawn on a normalised 100x100 viewBox so it stays
 * crisp at any size.
 */
function Medallion({ className }: { className?: string }): React.JSX.Element {
  // 24-point scalloped edge for a coin-like seal.
  const scallop = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const r = i % 2 === 0 ? 49 : 44
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`
  }).join(" ")
  // A pair of laurel arcs flanking the core.
  const laurel = (mirror: boolean): string => {
    const dir = mirror ? -1 : 1
    return `M ${50 + dir * 8} 72 Q ${50 + dir * 26} 64 ${50 + dir * 24} 40`
  }
  const leaves = Array.from({ length: 5 }, (_, i) => i)
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="med-core" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="100%" stopColor={NAVY_DARK} />
        </radialGradient>
        <linearGradient id="med-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor="#b88a2c" />
        </linearGradient>
      </defs>
      <polygon points={scallop} fill="url(#med-ring)" />
      <circle cx="50" cy="50" r="40" fill="url(#med-ring)" />
      <circle cx="50" cy="50" r="36" fill="url(#med-core)" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={GOLD} strokeWidth="1.4" />
      <circle cx="50" cy="50" r="29" fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.7" />
      {/* Laurel wreath */}
      {[false, true].map((m) => (
        <g key={m ? "r" : "l"}>
          <path d={laurel(m)} fill="none" stroke={GOLD} strokeWidth="1.1" opacity="0.85" />
          {leaves.map((i) => {
            const t = 0.18 + i * 0.16
            const dir = m ? -1 : 1
            const x = 50 + dir * (8 + t * 18)
            const y = 72 - t * 32
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx="2.6"
                ry="1.2"
                fill={GOLD}
                opacity="0.85"
                transform={`rotate(${dir * (40 - i * 12)} ${x} ${y})`}
              />
            )
          })}
        </g>
      ))}
      {/* Monogram */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.5"
        fill={GOLD}
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        VC
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="4.2"
        letterSpacing="1.4"
        fill={GOLD_LIGHT}
        fontFamily="Georgia, serif"
      >
        CERTIFIED
      </text>
      {/* Ribbon tails */}
      <path d="M40 86 L36 99 L46 92 Z" fill={GOLD} />
      <path d="M60 86 L64 99 L54 92 Z" fill={GOLD} />
    </svg>
  )
}

/** A short, symmetric gold flourish used to separate the learner name. */
function Flourish({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 200 16" className={className} aria-hidden="true">
      <line x1="14" y1="8" x2="86" y2="8" stroke={GOLD} strokeWidth="1.2" />
      <line x1="114" y1="8" x2="186" y2="8" stroke={GOLD} strokeWidth="1.2" />
      <path
        d="M100 8 L94 4 L96 8 L94 12 Z M100 8 L106 4 L104 8 L106 12 Z"
        fill={GOLD}
      />
      <circle cx="100" cy="8" r="2.4" fill={NAVY} />
      <circle cx="100" cy="8" r="2.4" fill="none" stroke={GOLD} strokeWidth="0.8" />
      <circle cx="88" cy="8" r="1.4" fill={GOLD} />
      <circle cx="112" cy="8" r="1.4" fill={GOLD} />
    </svg>
  )
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
    align === "right"
      ? "items-end text-right"
      : align === "center"
        ? "items-center text-center"
        : "items-start text-left"
  return (
    <div className={cn("flex w-[clamp(6rem,18vw,11rem)] flex-col", alignClass)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Signature"
          className="mb-1 h-[clamp(1.3rem,3.6vw,2.4rem)] w-auto max-w-full object-contain"
        />
      ) : (
        <p
          className="mb-1 truncate font-display italic leading-none text-brand-navy text-[clamp(0.8rem,2vw,1.3rem)]"
          style={{ transform: "rotate(-2deg)" }}
        >
          {name}
        </p>
      )}
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)` }}
      />
      <p className="mt-[3px] text-[clamp(0.5rem,1.05vw,0.7rem)] font-semibold leading-tight text-brand-navy">
        {name}
      </p>
      <p className="text-[clamp(0.45rem,0.95vw,0.62rem)] leading-tight text-muted-foreground">
        {role}
      </p>
    </div>
  )
}

/** CPD hours, issue (and optional expiry) date, plus the accreditation line. */
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
      <div className="flex flex-wrap items-center justify-center gap-x-[1.2em] gap-y-1 text-[clamp(0.5rem,1.05vw,0.7rem)] font-medium text-brand-navy/80">
        <span>
          <span className="font-semibold text-brand-navy">{values.cpdHours}</span> CPD hours
        </span>
        <span className="text-brand-gold">&bull;</span>
        <span>Issued {formatDate(values.issuedAt)}</span>
        {values.expiresAt ? (
          <>
            <span className="text-brand-gold">&bull;</span>
            <span>Valid to {formatDate(values.expiresAt)}</span>
          </>
        ) : null}
      </div>
      {accreditationLine ? (
        <p className="mt-[3px] text-[clamp(0.46rem,0.98vw,0.66rem)] font-medium uppercase tracking-[0.12em] text-brand-gold">
          {accreditationLine}
        </p>
      ) : null}
    </div>
  )
}

/** Verification reference + UUID, used at the foot of every preset. */
function VerifyLine({
  uuid,
  className,
  align = "left",
}: {
  uuid: string
  className?: string
  align?: "left" | "center" | "right"
}): React.JSX.Element {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
  return (
    <div
      className={cn(
        "text-[clamp(0.42rem,0.9vw,0.6rem)] leading-tight text-muted-foreground",
        alignClass,
        className,
      )}
    >
      <p className="font-semibold text-brand-navy/80">{certRef(uuid)}</p>
      <p>Verify at {COMPANY.website}/verify</p>
      <p className="break-all opacity-80">{uuid}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 1 — Completion: navy banner + smooth gold wave + medallion
// ---------------------------------------------------------------------------
function CompletionPreset({
  template,
  v,
}: {
  template: CertTemplate
  v: CertificatePreviewValues
}): React.JSX.Element {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-md bg-white ring-1 ring-brand-navy/10">
      {/* Thin gold keyline framing the whole certificate */}
      <div
        className="pointer-events-none absolute inset-[2.5%] rounded-sm border"
        style={{ borderColor: `${GOLD}55` }}
      />

      {/* Top navy band with a smooth two-layer gold wave beneath it */}
      <div className="relative h-[33%] w-full overflow-hidden" style={{ backgroundColor: NAVY }}>
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(120% 140% at 50% -20%, ${NAVY_DARK} 0%, ${NAVY} 60%)` }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-[8%] pb-[5%] text-center">
          <p className="font-display uppercase leading-none tracking-[0.18em] text-white text-[clamp(1.2rem,4.2vw,2.5rem)]">
            Certificate
          </p>
          <p
            className="mt-[6px] font-semibold uppercase tracking-[0.42em] text-[clamp(0.55rem,1.5vw,0.95rem)]"
            style={{ color: GOLD }}
          >
            of Completion
          </p>
        </div>
        <svg
          viewBox="0 0 1200 90"
          preserveAspectRatio="none"
          className="absolute -bottom-px left-0 h-[clamp(14px,4vw,30px)] w-full"
          aria-hidden="true"
        >
          <path
            d="M0,55 C300,15 500,75 700,50 C900,25 1050,60 1200,40 L1200,90 L0,90 Z"
            fill={GOLD}
            opacity="0.35"
          />
          <path
            d="M0,62 C260,32 460,82 700,58 C920,36 1060,70 1200,52 L1200,90 L0,90 Z"
            fill={GOLD}
          />
        </svg>
      </div>

      {/* Medallion overlapping the wave, right side */}
      <Medallion className="absolute right-[6%] top-[22%] h-[clamp(2.6rem,9.5vw,4.8rem)] w-[clamp(2.6rem,9.5vw,4.8rem)] drop-shadow-md" />

      {/* Body */}
      <div className="relative flex flex-1 gap-[5%] px-[9%] pt-[2.5%]">
        {/* Left column: logo + org */}
        <div className="flex w-[26%] flex-col items-start justify-center gap-2 border-r border-brand-navy/10 pr-[5%]">
          <img src={LOGOS.roundNavy} alt={COMPANY.name} className="h-[clamp(2rem,7vw,3.6rem)] w-auto" />
          <p className="font-display leading-tight text-brand-navy text-[clamp(0.7rem,1.7vw,1.05rem)]">
            {COMPANY.name}
          </p>
          <p className="text-[clamp(0.44rem,0.92vw,0.62rem)] leading-snug text-muted-foreground">
            {COMPANY.legalName}
            <br />
            Company No. {COMPANY.companyNumber}
          </p>
        </div>
        {/* Right column: recital */}
        <div className="flex flex-1 flex-col justify-center text-left">
          <p className="text-[clamp(0.52rem,1.15vw,0.74rem)] uppercase tracking-[0.2em] text-muted-foreground">
            {template.introText || "This is to certify that"}
          </p>
          <p className="mt-[2px] font-display leading-[1.05] text-brand-navy text-[clamp(1.4rem,4.6vw,2.9rem)]">
            {v.learnerName}
          </p>
          <p className="mt-[3%] text-[clamp(0.54rem,1.2vw,0.78rem)] leading-relaxed text-muted-foreground">
            {template.completionText || "has successfully completed"}{" "}
            <span className="font-display text-brand-navy">{v.courseTitle}</span>
          </p>
          <MetaLine
            values={v}
            accreditationLine={template.accreditationLine}
            className="mt-[3%] !text-left [&>div]:justify-start [&>p]:text-left"
          />
        </div>
      </div>

      {/* Two signatories with verify reference between them */}
      <div className="relative flex items-end justify-between gap-3 px-[9%] pb-[5%] pt-[2%]">
        <Signatory
          name={template.signatoryName}
          role={template.signatoryRole}
          imageUrl={template.signatureImageUrl}
        />
        <VerifyLine uuid={v.verificationUuid} align="center" className="mb-[2px]" />
        <Signatory name="Training Instructor" role="Issuing Trainer" align="right" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 2 — Participation: smooth corner waves + hex accents + medallion
// ---------------------------------------------------------------------------
function Hexagon({
  x,
  y,
  size,
  fill,
  opacity,
}: {
  x: number
  y: number
  size: number
  fill: string
  opacity: number
}): React.JSX.Element {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${(x + size * Math.cos(a)).toFixed(1)},${(y + size * Math.sin(a)).toFixed(1)}`
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
    <div className="relative flex h-full flex-col items-center overflow-hidden rounded-md bg-white px-[12%] pb-[5%] pt-[6%] text-center ring-1 ring-brand-navy/10">
      {/* Corner waves + hex accents */}
      <svg
        viewBox="0 0 1200 850"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Top-left flowing waves */}
        <path d="M0,0 L470,0 C360,120 410,250 250,290 C110,325 70,200 0,300 Z" fill={NAVY} />
        <path
          d="M0,0 L380,0 C300,95 320,215 190,245 C80,270 45,165 0,235 Z"
          fill={GOLD}
          opacity="0.9"
        />
        <path d="M0,0 L300,0 C250,70 250,170 150,190 C70,206 40,130 0,180 Z" fill={NAVY_DARK} opacity="0.5" />
        {/* Bottom-right flowing waves */}
        <path
          d="M1200,850 L730,850 C840,730 790,600 950,560 C1090,525 1130,650 1200,550 Z"
          fill={NAVY}
        />
        <path
          d="M1200,850 L820,850 C900,755 880,635 1010,605 C1120,580 1155,685 1200,615 Z"
          fill={GOLD}
          opacity="0.9"
        />
        <path
          d="M1200,850 L900,850 C950,780 950,680 1050,660 C1130,644 1160,720 1200,670 Z"
          fill={NAVY_DARK}
          opacity="0.5"
        />
        {/* Scattered hex accents */}
        <Hexagon x={1040} y={120} size={26} fill={NAVY} opacity={0.1} />
        <Hexagon x={1110} y={205} size={15} fill={GOLD} opacity={0.35} />
        <Hexagon x={130} y={715} size={22} fill={NAVY} opacity={0.09} />
        <Hexagon x={195} y={640} size={13} fill={GOLD} opacity={0.35} />
      </svg>

      {/* Medallion top-right */}
      <Medallion className="absolute right-[7%] top-[7%] h-[clamp(2.2rem,8vw,4.2rem)] w-[clamp(2.2rem,8vw,4.2rem)] drop-shadow" />

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <img src={LOGOS.roundNavy} alt={COMPANY.name} className="mb-[2%] h-[clamp(1.8rem,6vw,3.2rem)] w-auto" />
        <p className="font-display uppercase leading-none tracking-[0.16em] text-brand-navy text-[clamp(1.2rem,4.2vw,2.5rem)]">
          Certificate
        </p>
        <p
          className="mt-[6px] font-semibold uppercase tracking-[0.42em] text-[clamp(0.55rem,1.5vw,0.95rem)]"
          style={{ color: GOLD }}
        >
          of Participation
        </p>
        <p className="mt-[3.5%] text-[clamp(0.52rem,1.15vw,0.74rem)] uppercase tracking-[0.18em] text-muted-foreground">
          {template.introText || "This certificate is proudly presented to"}
        </p>
        <p
          className="mt-[2px] bg-clip-text font-display leading-[1.05] text-transparent text-[clamp(1.6rem,5.2vw,3.1rem)]"
          style={{ backgroundImage: `linear-gradient(95deg, ${NAVY}, ${GOLD} 60%, ${NAVY_DARK})` }}
        >
          {v.learnerName}
        </p>
        <Flourish className="mt-[2%] h-auto w-[clamp(7rem,26vw,12rem)]" />
        <p className="mt-[2.5%] max-w-[78%] text-[clamp(0.54rem,1.2vw,0.78rem)] leading-relaxed text-muted-foreground">
          {template.completionText || "for participating in"}{" "}
          <span className="font-display text-brand-navy">{v.courseTitle}</span>
        </p>
        <MetaLine values={v} accreditationLine={template.accreditationLine} className="mt-[3%]" />
      </div>

      {/* Single signatory bottom-left, verify bottom-right */}
      <div className="relative mt-auto flex w-full items-end justify-between gap-3 pt-[4%]">
        <Signatory
          name={template.signatoryName}
          role={template.signatoryRole}
          imageUrl={template.signatureImageUrl}
        />
        <VerifyLine uuid={v.verificationUuid} align="right" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preset 3 — Achievement: ornate double border + corner flourishes + medallion
// ---------------------------------------------------------------------------

/** A clean ornate corner flourish, drawn for the top-left and mirrored to fit. */
function CornerFlourish({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M6 6 L40 6 M6 6 L6 40"
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14 Q14 34 34 34 M14 14 Q34 14 34 34"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.2"
        opacity="0.8"
      />
      <path d="M14 14 L22 22 L14 22 Z" fill={NAVY} />
      <circle cx="34" cy="34" r="2.4" fill={GOLD} />
      <circle cx="6" cy="6" r="3.2" fill={NAVY} />
      <circle cx="6" cy="6" r="3.2" fill="none" stroke={GOLD} strokeWidth="0.8" />
    </svg>
  )
}

function AchievementPreset({
  template,
  v,
}: {
  template: CertTemplate
  v: CertificatePreviewValues
}): React.JSX.Element {
  return (
    <div
      className="relative h-full overflow-hidden rounded-md bg-white"
      style={{ border: `clamp(3px,0.8vw,5px) solid ${NAVY}` }}
    >
      {/* Inner gold keyline */}
      <div
        className="pointer-events-none absolute inset-[clamp(5px,1.6vw,10px)] rounded-sm"
        style={{ border: `1.5px solid ${GOLD}` }}
      />
      {/* Faint guilloché-style hex watermark behind the content */}
      <svg
        viewBox="0 0 1200 850"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <Hexagon x={600} y={420} size={250} fill={NAVY} opacity={0.025} />
        <Hexagon x={600} y={420} size={190} fill={GOLD} opacity={0.03} />
      </svg>

      {/* Ornate corner flourishes */}
      <CornerFlourish className="pointer-events-none absolute left-[1.5%] top-[2%] h-[clamp(2rem,8vw,3.6rem)] w-[clamp(2rem,8vw,3.6rem)]" />
      <CornerFlourish className="pointer-events-none absolute right-[1.5%] top-[2%] h-[clamp(2rem,8vw,3.6rem)] w-[clamp(2rem,8vw,3.6rem)] -scale-x-100" />
      <CornerFlourish className="pointer-events-none absolute bottom-[2%] left-[1.5%] h-[clamp(2rem,8vw,3.6rem)] w-[clamp(2rem,8vw,3.6rem)] -scale-y-100" />
      <CornerFlourish className="pointer-events-none absolute bottom-[2%] right-[1.5%] h-[clamp(2rem,8vw,3.6rem)] w-[clamp(2rem,8vw,3.6rem)] -scale-100" />

      <div className="relative flex h-full flex-col items-center justify-center px-[11%] py-[6%] text-center">
        <img src={LOGOS.roundNavy} alt={COMPANY.name} className="mb-[1.5%] h-[clamp(1.6rem,5.2vw,3rem)] w-auto" />
        <p className="font-display uppercase leading-none tracking-[0.18em] text-brand-navy text-[clamp(1.3rem,4.5vw,2.7rem)]">
          Certificate
        </p>
        <p
          className="mt-[6px] font-semibold uppercase tracking-[0.44em] text-[clamp(0.58rem,1.6vw,1rem)]"
          style={{ color: GOLD }}
        >
          of Achievement
        </p>
        <p className="mt-[3%] text-[clamp(0.52rem,1.15vw,0.74rem)] uppercase tracking-[0.18em] text-muted-foreground">
          {template.introText || "This certificate is proudly presented to"}
        </p>
        <p className="mt-[2px] font-display leading-[1.05] text-brand-navy text-[clamp(1.5rem,5vw,3rem)]">
          {v.learnerName}
        </p>
        <Flourish className="mt-[1.5%] h-auto w-[clamp(7rem,26vw,12rem)]" />
        <p className="mt-[2.5%] max-w-[76%] text-[clamp(0.54rem,1.2vw,0.78rem)] leading-relaxed text-muted-foreground">
          {template.completionText || "for outstanding achievement in"}{" "}
          <span className="font-display text-brand-navy">{v.courseTitle}</span>
        </p>
        <MetaLine values={v} accreditationLine={template.accreditationLine} className="mt-[2.5%]" />

        {/* Medallion between two signatories */}
        <div className="mt-auto flex w-full items-end justify-between gap-2 pt-[3%]">
          <Signatory
            name={template.signatoryName}
            role={template.signatoryRole}
            imageUrl={template.signatureImageUrl}
          />
          <Medallion className="h-[clamp(2.2rem,8vw,3.8rem)] w-[clamp(2.2rem,8vw,3.8rem)] shrink-0 drop-shadow" />
          <Signatory name="Training Instructor" role="Issuing Trainer" align="right" />
        </div>
        <VerifyLine uuid={v.verificationUuid} align="center" className="mt-[1.5%]" />
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
    <div
      className={cn(
        "mx-auto aspect-[297/210] w-full overflow-hidden rounded-md shadow-[0_8px_30px_-12px_rgba(27,46,107,0.35)]",
        className,
      )}
    >
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
