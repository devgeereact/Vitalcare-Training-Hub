import jsPDF from "jspdf"
import { COMPANY, BRAND, LEADERSHIP } from "@/lib/constants"
import type { CertPreset } from "@/lib/queries/certificates.queries"

export interface CertificatePdfData {
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
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

/** Convert a hex colour to an [r, g, b] triple for jsPDF. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Generate and download an A4-landscape Vitalcare certificate. */
export function downloadCertificatePdf(data: CertificatePdfData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297
  const H = 210
  const navy = BRAND.navy
  const gold = BRAND.gold
  const [nr, ng, nb] = rgb(navy)
  const [gr, gg, gb] = rgb(gold)
  const preset: CertPreset = data.preset ?? "completion"

  // Preset-specific frame + header treatment, all branded navy + gold.
  if (preset === "completion") {
    // Top navy band with a gold divider beneath it.
    doc.setFillColor(nr, ng, nb)
    doc.rect(0, 0, W, 56, "F")
    doc.setFillColor(gr, gg, gb)
    doc.rect(0, 56, W, 3, "F")
    doc.setDrawColor(gold)
    doc.setLineWidth(0.6)
    doc.rect(10, 64, W - 20, H - 74)

    doc.setTextColor(255, 255, 255)
    doc.setFont("times", "normal")
    doc.setFontSize(30)
    doc.text(data.titleText?.trim() || "Certificate of Completion", W / 2, 36, {
      align: "center",
    })
  } else if (preset === "participation") {
    // Navy corner wedges with a gold inner keyline.
    doc.setFillColor(nr, ng, nb)
    doc.triangle(0, 0, 70, 0, 0, 50, "F")
    doc.triangle(W, H, W - 70, H, W, H - 50, "F")
    doc.setFillColor(gr, gg, gb)
    doc.triangle(0, 0, 52, 0, 0, 38, "F")
    doc.triangle(W, H, W - 52, H, W, H - 38, "F")
    doc.setDrawColor(navy)
    doc.setLineWidth(0.6)
    doc.rect(12, 12, W - 24, H - 24)

    doc.setTextColor(nr, ng, nb)
    doc.setFont("times", "normal")
    doc.setFontSize(30)
    doc.text(data.titleText?.trim() || "Certificate of Participation", W / 2, 42, {
      align: "center",
    })
  } else {
    // Achievement: ornate navy + gold double border + gold lower band.
    doc.setDrawColor(navy)
    doc.setLineWidth(3)
    doc.rect(8, 8, W - 16, H - 16)
    doc.setDrawColor(gold)
    doc.setLineWidth(1)
    doc.rect(13, 13, W - 26, H - 26)
    doc.setFillColor(gr, gg, gb)
    doc.rect(13, H - 26, W - 26, 1.5, "F")

    doc.setTextColor(nr, ng, nb)
    doc.setFont("times", "normal")
    doc.setFontSize(32)
    doc.text(data.titleText?.trim() || "Certificate of Achievement", W / 2, 42, {
      align: "center",
    })
  }

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(90)
  doc.text(data.introText?.trim() || "This is to certify that", W / 2, 66, {
    align: "center",
  })

  // Learner name
  doc.setFont("times", "bold")
  doc.setFontSize(34)
  doc.setTextColor(navy)
  doc.text(data.learnerName, W / 2, 78, { align: "center" })

  // Gold underline
  doc.setDrawColor(gold)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 60, 84, W / 2 + 60, 84)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(90)
  doc.text(data.completionText?.trim() || "has successfully completed", W / 2, 98, {
    align: "center",
  })

  doc.setFont("times", "bold")
  doc.setFontSize(20)
  doc.setTextColor(navy)
  doc.text(data.courseTitle, W / 2, 112, { align: "center", maxWidth: W - 80 })

  // Meta line
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(90)
  doc.text(`${data.cpdHours} CPD hours  ·  Issued ${fmt(data.issuedAt)}`, W / 2, 126, {
    align: "center",
  })
  doc.setFontSize(9)
  doc.text(
    data.accreditationLine?.trim() ||
      "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify",
    W / 2,
    132,
    { align: "center" },
  )

  // Signatory (left). Italic script approximates a pen signature above the line.
  const signName = data.signatoryName?.trim() || LEADERSHIP.clinicalDirector.name
  const signRole = data.signatoryRole?.trim() || LEADERSHIP.clinicalDirector.role
  doc.setFont("times", "italic")
  doc.setFontSize(20)
  doc.setTextColor(navy)
  doc.text(signName, 42, 165)
  doc.setDrawColor(navy)
  doc.setLineWidth(0.4)
  doc.line(40, 168, 120, 168)
  doc.setFontSize(10)
  doc.setTextColor(navy)
  doc.setFont("helvetica", "bold")
  doc.text(signName, 40, 174)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(110)
  doc.text(signRole, 40, 179)
  doc.text(COMPANY.legalName, 40, 184)

  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text("Verify at " + `${COMPANY.website}/verify`, W - 40, 170, { align: "right" })
  doc.text(data.verificationUuid, W - 40, 175, { align: "right" })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(140)
  doc.text(
    data.footerText?.trim() ||
      `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber}`,
    W / 2,
    192,
    { align: "center" },
  )

  doc.save(`vitalcare-certificate-${data.verificationUuid.slice(0, 8)}.pdf`)
}
