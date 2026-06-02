import jsPDF from "jspdf"
import { COMPANY, BRAND, LEADERSHIP } from "@/lib/constants"

export interface CertificatePdfData {
  learnerName: string
  courseTitle: string
  /**
   * Retained for call-site stability. No longer rendered on the certificate.
   * @deprecated CPD hours were removed from the certificate face.
   */
  cpdHours?: number
  issuedAt: string
  /** Optional expiry. When present, shown alongside the issue date. */
  expiresAt?: string | null
  verificationUuid: string
  signatoryName?: string
  signatoryRole?: string
  /** Optional template-driven section copy. Falls back to defaults. */
  titleText?: string
  introText?: string
  completionText?: string
  accreditationLine?: string
  footerText?: string
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Derive a short, human-friendly verification reference from the UUID. The
 * short form (VC-XXXX) is printed alongside the full UUID. Same input always
 * yields the same reference, so it stays stable for a given certificate.
 */
export function certVerificationRef(uuid: string): { short: string; full: string } {
  const clean = uuid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  const tail = clean.slice(-4).padStart(4, "0")
  return { short: `VC-${tail}`, full: uuid }
}

/** RGB triplet for a hex colour, used by jsPDF's numeric draw/text setters. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/** Draw the gold medallion seal centred at (cx, cy) with the given radius. */
function drawSeal(doc: jsPDF, cx: number, cy: number, r: number): void {
  const [gr, gg, gb] = rgb(BRAND.gold)
  const [nr, ng, nb] = rgb(BRAND.navy)

  // Fluted edge: small gold dots around the rim.
  doc.setFillColor(gr, gg, gb)
  const teeth = 40
  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2
    doc.circle(cx + Math.cos(a) * (r + 1.6), cy + Math.sin(a) * (r + 1.6), 0.7, "F")
  }

  // Face and rings.
  doc.setFillColor(gr, gg, gb)
  doc.circle(cx, cy, r, "F")
  doc.setDrawColor(255, 246, 224)
  doc.setLineWidth(0.4)
  doc.circle(cx, cy, r - 1.6)
  doc.setDrawColor(140, 107, 34)
  doc.setLineWidth(0.25)
  doc.circle(cx, cy, r - 3.4)

  // Monogram.
  doc.setTextColor(nr, ng, nb)
  doc.setFont("times", "bold")
  doc.setFontSize(r * 1.5)
  doc.text("VC", cx, cy + r * 0.05, { align: "center", baseline: "middle" })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(r * 0.32)
  doc.text("VERIFIED", cx, cy + r * 0.55, { align: "center", baseline: "middle" })
}

/** Draw a decorative corner flourish anchored at (x, y) towards (sx, sy). */
function drawCorner(doc: jsPDF, x: number, y: number, sx: number, sy: number): void {
  const [gr, gg, gb] = rgb(BRAND.gold)
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.7)
  doc.line(x, y, x + 16 * sx, y)
  doc.line(x, y, x, y + 16 * sy)
  doc.setFillColor(gr, gg, gb)
  doc.circle(x + 4 * sx, y + 4 * sy, 0.9, "F")
}

/** Generate and download an A4-landscape Vitalcare certificate. */
export function downloadCertificatePdf(data: CertificatePdfData): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297
  const H = 210
  const [nr, ng, nb] = rgb(BRAND.navy)
  const [gr, gg, gb] = rgb(BRAND.gold)

  // Warm paper tint.
  doc.setFillColor(253, 252, 247)
  doc.rect(0, 0, W, H, "F")

  // Outer gold frame.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(2.2)
  doc.rect(9, 9, W - 18, H - 18)
  // Thin navy keyline.
  doc.setDrawColor(nr, ng, nb)
  doc.setLineWidth(0.5)
  doc.rect(13, 13, W - 26, H - 26)
  // Hairline gold inner rule.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.3)
  doc.rect(15, 15, W - 30, H - 30)

  // Corner flourishes (inside the frame).
  drawCorner(doc, 19, 19, 1, 1)
  drawCorner(doc, W - 19, 19, -1, 1)
  drawCorner(doc, 19, H - 19, 1, -1)
  drawCorner(doc, W - 19, H - 19, -1, -1)

  // Heading.
  doc.setTextColor(nr, ng, nb)
  doc.setFont("times", "normal")
  doc.setFontSize(32)
  doc.text(data.titleText?.trim() || "Certificate of Completion", W / 2, 42, {
    align: "center",
  })

  // Gold divider under the title.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 26, 47, W / 2 - 4, 47)
  doc.line(W / 2 + 4, 47, W / 2 + 26, 47)
  doc.setFillColor(gr, gg, gb)
  doc.rect(W / 2 - 1.3, 45.7, 2.6, 2.6, "F")

  // Recital: intro line.
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  doc.text(
    (data.introText?.trim() || "This is to certify that").toUpperCase(),
    W / 2,
    62,
    { align: "center", charSpace: 1.4 },
  )

  // Learner name (hero).
  doc.setFont("times", "bold")
  doc.setFontSize(38)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.learnerName, W / 2, 80, { align: "center" })

  // Gold underline beneath the name.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 55, 86, W / 2 + 55, 86)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  doc.text(
    (data.completionText?.trim() || "has successfully completed").toUpperCase(),
    W / 2,
    99,
    { align: "center", charSpace: 1.4 },
  )

  doc.setFont("times", "bold")
  doc.setFontSize(20)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.courseTitle, W / 2, 112, { align: "center", maxWidth: W - 90 })

  // Issue date line (no CPD hours).
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  // ASCII separators dodge jsPDF's limited Unicode handling in standard fonts.
  const metaParts = [`Issued ${fmt(data.issuedAt)}`]
  if (data.expiresAt) metaParts.push(`Valid to ${fmt(data.expiresAt)}`)
  doc.text(metaParts.join("   -   "), W / 2, 124, { align: "center" })

  // Accreditation line.
  doc.setFontSize(9)
  doc.setTextColor(nr, ng, nb)
  doc.text(
    data.accreditationLine?.trim() ||
      "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify",
    W / 2,
    130,
    { align: "center" },
  )

  // Central seal, sitting above the signature row.
  drawSeal(doc, W / 2, 158, 15)

  // Signatory (left). The on-screen preview renders the name in the Dancing
  // Script cursive webfont. jsPDF cannot easily embed that font, so the PDF
  // uses Times italic as the closest available pen-signature approximation.
  const signName = data.signatoryName?.trim() || LEADERSHIP.clinicalDirector.name
  const signRole = data.signatoryRole?.trim() || LEADERSHIP.clinicalDirector.role
  doc.setFont("times", "italic")
  doc.setFontSize(20)
  doc.setTextColor(nr, ng, nb)
  doc.text(signName, 42, 165)
  doc.setDrawColor(nr, ng, nb)
  doc.setLineWidth(0.4)
  doc.line(40, 168, 110, 168)
  doc.setFontSize(10)
  doc.setTextColor(nr, ng, nb)
  doc.setFont("helvetica", "bold")
  doc.text(signName, 40, 174)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(110, 110, 110)
  doc.text(signRole, 40, 179)
  doc.text(COMPANY.legalName, 40, 184)

  // Verification (right).
  const ref = certVerificationRef(data.verificationUuid)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(nr, ng, nb)
  doc.text(ref.short, W - 40, 165, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  doc.text(data.verificationUuid, W - 40, 170, { align: "right" })
  doc.setFontSize(9)
  doc.text(`Verify at ${COMPANY.website}/verify`, W - 40, 175, { align: "right" })

  // Footer.
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(
    data.footerText?.trim() ||
      `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber}`,
    W / 2,
    194,
    { align: "center" },
  )

  doc.save(`vitalcare-certificate-${data.verificationUuid.slice(0, 8)}.pdf`)
}
