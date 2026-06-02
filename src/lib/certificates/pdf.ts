import jsPDF from "jspdf"
import { COMPANY, BRAND, LEADERSHIP } from "@/lib/constants"
import type { CertPreset } from "@/lib/queries/certificates.queries"

export interface CertificatePdfData {
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
  expiresAt?: string | null
  verificationUuid: string
  signatoryName?: string
  signatoryRole?: string
  /** Visual preset. Drives the header and border treatment. */
  preset?: CertPreset
  /** Optional template-driven section copy. Falls back to defaults. */
  titleText?: string
  introText?: string
  completionText?: string
  accreditationLine?: string
  footerText?: string
}

type RGB = [number, number, number]

/** Convert a hex colour to an [r, g, b] triple for jsPDF. */
function rgb(hex: string): RGB {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function fmt(iso: string): string {
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

/**
 * Draw a polished gold medallion with a navy core and the VC monogram, centred
 * on (cx, cy). jsPDF has no SVG, so this is composed from filled circles,
 * triangles (scallop points and ribbon tails) and text.
 */
function drawMedallion(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  navy: RGB,
  gold: RGB,
): void {
  const goldLight = rgb(BRAND.goldLight)
  // Scalloped coin edge.
  doc.setFillColor(gold[0], gold[1], gold[2])
  const points = 20
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    doc.circle(cx + r * Math.cos(a), cy + r * Math.sin(a), r * 0.16, "F")
  }
  // Ribbon tails below the seal.
  doc.triangle(
    cx - r * 0.45,
    cy + r * 0.7,
    cx - r * 0.15,
    cy + r * 0.7,
    cx - r * 0.3,
    cy + r * 1.5,
    "F",
  )
  doc.triangle(
    cx + r * 0.45,
    cy + r * 0.7,
    cx + r * 0.15,
    cy + r * 0.7,
    cx + r * 0.3,
    cy + r * 1.5,
    "F",
  )
  // Gold disc.
  doc.circle(cx, cy, r, "F")
  // Highlight ring.
  doc.setFillColor(goldLight[0], goldLight[1], goldLight[2])
  doc.circle(cx, cy, r * 0.96, "F")
  doc.setFillColor(gold[0], gold[1], gold[2])
  doc.circle(cx, cy, r * 0.9, "F")
  // Navy core.
  doc.setFillColor(navy[0], navy[1], navy[2])
  doc.circle(cx, cy, r * 0.78, "F")
  // Inner gold rings.
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(0.5)
  doc.circle(cx, cy, r * 0.78)
  doc.setLineWidth(0.3)
  doc.circle(cx, cy, r * 0.62)
  // Monogram.
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.setFont("times", "bold")
  doc.setFontSize(r * 4.4)
  doc.text("VC", cx, cy + r * 0.18, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(r * 1.05)
  doc.setTextColor(goldLight[0], goldLight[1], goldLight[2])
  doc.text("CERTIFIED", cx, cy + r * 0.62, { align: "center" })
}

/**
 * Draw a smooth gold wave band across the page width at vertical offset y,
 * filling down to fillTo. Approximated with a dense polyline so the curve reads
 * cleanly in print.
 */
function drawWave(
  doc: jsPDF,
  W: number,
  y: number,
  amp: number,
  fillTo: number,
  color: RGB,
): void {
  doc.setFillColor(color[0], color[1], color[2])
  const step = 3
  const pts: [number, number][] = []
  for (let x = 0; x <= W; x += step) {
    const yy = y + Math.sin((x / W) * Math.PI * 3) * amp
    pts.push([x, yy])
  }
  pts.push([W, fillTo])
  pts.push([0, fillTo])
  // jsPDF lines() takes deltas from a start point.
  const start = pts[0]
  const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]] as [number, number])
  doc.lines(deltas, start[0], start[1], [1, 1], "F", true)
}

/** A short symmetric gold flourish centred on (cx, y). */
function drawFlourish(doc: jsPDF, cx: number, y: number, half: number, navy: RGB, gold: RGB): void {
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(0.5)
  doc.line(cx - half, y, cx - 6, y)
  doc.line(cx + 6, y, cx + half, y)
  doc.setFillColor(gold[0], gold[1], gold[2])
  doc.triangle(cx - 5, y, cx - 1.5, y - 1.6, cx - 1.5, y + 1.6, "F")
  doc.triangle(cx + 5, y, cx + 1.5, y - 1.6, cx + 1.5, y + 1.6, "F")
  doc.setFillColor(navy[0], navy[1], navy[2])
  doc.circle(cx, y, 1.2, "F")
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.circle(cx, y, 1.2)
}

/** A clean ornate corner flourish anchored at (x, y), scaled by s. */
function drawCorner(
  doc: jsPDF,
  x: number,
  y: number,
  sx: number,
  sy: number,
  navy: RGB,
  gold: RGB,
): void {
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.setLineWidth(1)
  doc.line(x, y, x + sx * 14, y)
  doc.line(x, y, x, y + sy * 14)
  doc.setLineWidth(0.5)
  doc.line(x + sx * 3, y + sy * 3, x + sx * 12, y + sy * 3)
  doc.line(x + sx * 3, y + sy * 3, x + sx * 3, y + sy * 12)
  doc.setFillColor(navy[0], navy[1], navy[2])
  doc.circle(x, y, 1.4, "F")
  doc.setDrawColor(gold[0], gold[1], gold[2])
  doc.circle(x, y, 1.4)
}

/** Render one signature block left- or right-aligned at the given baseline. */
function drawSignatory(
  doc: jsPDF,
  opts: {
    x: number
    lineY: number
    width: number
    name: string
    role: string
    align: "left" | "right"
    navy: RGB
  },
): void {
  const { x, lineY, width, name, role, align, navy } = opts
  const lineLeft = align === "left" ? x : x - width
  const lineRight = align === "left" ? x + width : x
  const textX = align === "left" ? lineLeft : lineRight
  // Cursive-style name above the rule.
  doc.setFont("times", "italic")
  doc.setFontSize(18)
  doc.setTextColor(navy[0], navy[1], navy[2])
  doc.text(name, align === "left" ? lineLeft + 2 : lineRight - 2, lineY - 3, { align })
  // Rule.
  doc.setDrawColor(navy[0], navy[1], navy[2])
  doc.setLineWidth(0.4)
  doc.line(lineLeft, lineY, lineRight, lineY)
  // Name + role.
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9.5)
  doc.text(name, textX, lineY + 5, { align })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(110, 110, 110)
  doc.text(role, textX, lineY + 9.5, { align })
}

/** Generate and download an A4-landscape Vitalcare certificate. */
export function downloadCertificatePdf(data: CertificatePdfData): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297
  const H = 210
  const navy = rgb(BRAND.navy)
  const navyDark = rgb(BRAND.navyDark)
  const gold = rgb(BRAND.gold)
  const preset: CertPreset = data.preset ?? "completion"
  const grey: RGB = [90, 90, 90]

  // Default copy per preset.
  const defaults: Record<CertPreset, { title: string; intro: string; body: string }> = {
    completion: {
      title: "Certificate of Completion",
      intro: "This is to certify that",
      body: "has successfully completed",
    },
    participation: {
      title: "Certificate of Participation",
      intro: "This certificate is proudly presented to",
      body: "for participating in",
    },
    achievement: {
      title: "Certificate of Achievement",
      intro: "This certificate is proudly presented to",
      body: "for outstanding achievement in",
    },
  }
  const d = defaults[preset]
  const title = data.titleText?.trim() || d.title
  const intro = data.introText?.trim() || d.intro
  const body = data.completionText?.trim() || d.body

  // -- Frame + header treatment --------------------------------------------
  let titleY = 42

  if (preset === "completion") {
    // Navy band, smooth gold wave, gold keyline frame.
    doc.setFillColor(navy[0], navy[1], navy[2])
    doc.rect(0, 0, W, 60, "F")
    drawWave(doc, W, 60, 3.2, 70, gold)
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.4)
    doc.rect(8, 8, W - 16, H - 16)

    doc.setTextColor(255, 255, 255)
    doc.setFont("times", "normal")
    doc.setFontSize(30)
    doc.text("CERTIFICATE", W / 2, 30, { align: "center", charSpace: 1.5 })
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(title.replace(/^certificate\s+/i, "").toUpperCase(), W / 2, 42, {
      align: "center",
      charSpace: 3,
    })
    drawMedallion(doc, W - 38, 64, 13, navy, gold)
    titleY = 60
  } else if (preset === "participation") {
    // Navy corner waves with gold inner keyline.
    doc.setFillColor(navy[0], navy[1], navy[2])
    doc.triangle(0, 0, 78, 0, 0, 56, "F")
    doc.triangle(W, H, W - 78, H, W, H - 56, "F")
    doc.setFillColor(gold[0], gold[1], gold[2])
    doc.triangle(0, 0, 58, 0, 0, 42, "F")
    doc.triangle(W, H, W - 58, H, W, H - 42, "F")
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2])
    doc.triangle(0, 0, 40, 0, 0, 30, "F")
    doc.triangle(W, H, W - 40, H, W, H - 30, "F")
    doc.setDrawColor(navy[0], navy[1], navy[2])
    doc.setLineWidth(0.5)
    doc.rect(12, 12, W - 24, H - 24)
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.3)
    doc.rect(14, 14, W - 28, H - 28)

    doc.setTextColor(navy[0], navy[1], navy[2])
    doc.setFont("times", "normal")
    doc.setFontSize(30)
    doc.text("CERTIFICATE", W / 2, 38, { align: "center", charSpace: 1.5 })
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(title.replace(/^certificate\s+/i, "").toUpperCase(), W / 2, 49, {
      align: "center",
      charSpace: 3,
    })
    drawMedallion(doc, W - 36, 34, 12, navy, gold)
    titleY = 49
  } else {
    // Achievement: ornate navy + gold double border + corner flourishes.
    doc.setDrawColor(navy[0], navy[1], navy[2])
    doc.setLineWidth(3)
    doc.rect(8, 8, W - 16, H - 16)
    doc.setDrawColor(gold[0], gold[1], gold[2])
    doc.setLineWidth(0.8)
    doc.rect(13, 13, W - 26, H - 26)
    drawCorner(doc, 13, 13, 1, 1, navy, gold)
    drawCorner(doc, W - 13, 13, -1, 1, navy, gold)
    drawCorner(doc, 13, H - 13, 1, -1, navy, gold)
    drawCorner(doc, W - 13, H - 13, -1, -1, navy, gold)

    doc.setTextColor(navy[0], navy[1], navy[2])
    doc.setFont("times", "normal")
    doc.setFontSize(32)
    doc.text("CERTIFICATE", W / 2, 40, { align: "center", charSpace: 1.5 })
    doc.setTextColor(gold[0], gold[1], gold[2])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(title.replace(/^certificate\s+/i, "").toUpperCase(), W / 2, 51, {
      align: "center",
      charSpace: 3.5,
    })
    titleY = 51
  }

  // -- Recital --------------------------------------------------------------
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(grey[0], grey[1], grey[2])
  doc.text(intro.toUpperCase(), W / 2, titleY + 14, { align: "center", charSpace: 1.2 })

  // Learner name (hero).
  doc.setFont("times", "bold")
  doc.setFontSize(36)
  doc.setTextColor(navy[0], navy[1], navy[2])
  doc.text(data.learnerName, W / 2, titleY + 28, { align: "center" })

  // Gold flourish under the name.
  drawFlourish(doc, W / 2, titleY + 34, 55, navy, gold)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(grey[0], grey[1], grey[2])
  doc.text(body, W / 2, titleY + 44, { align: "center" })

  doc.setFont("times", "bold")
  doc.setFontSize(19)
  doc.setTextColor(navy[0], navy[1], navy[2])
  doc.text(data.courseTitle, W / 2, titleY + 55, { align: "center", maxWidth: W - 90 })

  // Meta line: CPD hours, issue + optional expiry. Bullet via ASCII to dodge
  // jsPDF's limited Unicode handling.
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10.5)
  doc.setTextColor(navy[0], navy[1], navy[2])
  const metaParts = [`${data.cpdHours} CPD hours`, `Issued ${fmt(data.issuedAt)}`]
  if (data.expiresAt) metaParts.push(`Valid to ${fmt(data.expiresAt)}`)
  doc.text(metaParts.join("   -   "), W / 2, titleY + 65, { align: "center" })

  // Accreditation line in gold.
  doc.setFontSize(8.5)
  doc.setTextColor(gold[0], gold[1], gold[2])
  doc.setFont("helvetica", "bold")
  doc.text(
    (data.accreditationLine?.trim() ||
      "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify").toUpperCase(),
    W / 2,
    titleY + 71,
    { align: "center", charSpace: 0.8 },
  )

  // -- Signatures + medallion ----------------------------------------------
  const signName = data.signatoryName?.trim() || LEADERSHIP.clinicalDirector.name
  const signRole = data.signatoryRole?.trim() || "Clinical Director"
  const sigY = 176
  const twoSign = preset !== "participation"

  drawSignatory(doc, {
    x: 40,
    lineY: sigY,
    width: 62,
    name: signName,
    role: signRole,
    align: "left",
    navy,
  })

  if (twoSign) {
    drawSignatory(doc, {
      x: W - 40,
      lineY: sigY,
      width: 62,
      name: "Training Instructor",
      role: "Issuing Trainer",
      align: "right",
      navy,
    })
    if (preset === "achievement") {
      drawMedallion(doc, W / 2, sigY - 4, 11, navy, gold)
    }
  }

  // -- Verification reference ----------------------------------------------
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(navy[0], navy[1], navy[2])
  const verifyX = twoSign ? W / 2 : W - 40
  const verifyAlign = twoSign ? "center" : "right"
  const verifyY = preset === "participation" ? sigY : 192
  doc.text(certRef(data.verificationUuid), verifyX, verifyY, { align: verifyAlign })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(`Verify at ${COMPANY.website}/verify`, verifyX, verifyY + 4, { align: verifyAlign })
  doc.text(data.verificationUuid, verifyX, verifyY + 7.5, { align: verifyAlign })

  // -- Footer ---------------------------------------------------------------
  doc.setFontSize(7.5)
  doc.setTextColor(140, 140, 140)
  doc.text(
    data.footerText?.trim() || `${COMPANY.legalName} - Company No. ${COMPANY.companyNumber}`,
    W / 2,
    H - 7,
    { align: "center" },
  )

  doc.save(`vitalcare-certificate-${data.verificationUuid.slice(0, 8)}.pdf`)
}
