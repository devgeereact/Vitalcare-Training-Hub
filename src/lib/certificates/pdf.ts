import jsPDF from "jspdf"
import { COMPANY, BRAND, LEADERSHIP } from "@/lib/constants"

export interface CertificatePdfData {
  learnerName: string
  courseTitle: string
  cpdHours: number
  issuedAt: string
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

  // Outer gold border + inner navy keyline
  doc.setDrawColor(gold)
  doc.setLineWidth(2.5)
  doc.rect(10, 10, W - 20, H - 20)
  doc.setDrawColor(navy)
  doc.setLineWidth(0.5)
  doc.rect(14, 14, W - 28, H - 28)

  // Heading
  doc.setTextColor(navy)
  doc.setFont("times", "normal")
  doc.setFontSize(30)
  doc.text(data.titleText?.trim() || "Certificate of Completion", W / 2, 42, {
    align: "center",
  })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(90)
  doc.text(data.introText?.trim() || "This is to certify that", W / 2, 60, {
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
