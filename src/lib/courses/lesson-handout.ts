import jsPDF from "jspdf"
import { COMPANY, BRAND } from "@/lib/constants"

/** Convert lesson HTML (or plain text) into clean paragraphs for the PDF. */
function htmlToText(input: string): string {
  return input
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    // House style: no em or en dashes anywhere in generated documents.
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export interface LessonHandoutInput {
  courseTitle: string
  lessonTitle: string
  /** Lesson body, HTML or plain text. */
  content: string
}

/**
 * Generate and download a branded PDF handout for a lesson, with the Vitalcare
 * letterhead (navy band, company details) and legal footer. No external assets
 * needed, so it works for any lesson content.
 */
export function downloadLessonHandout(input: LessonHandoutInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const navy = BRAND.navy
  const gold = BRAND.gold
  const ink = "#0f172a"
  const muted = "#64748b"
  const pageW = 210
  const pageH = 297
  const left = 16
  const right = 194
  const width = right - left

  // Letterhead band
  doc.setFillColor(navy)
  doc.rect(0, 0, pageW, 30, "F")
  doc.setFillColor(gold)
  doc.rect(0, 30, pageW, 1.4, "F")
  doc.setTextColor("#ffffff")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(COMPANY.name, left, 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(
    `${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode}`,
    left,
    21,
  )
  doc.text(`${COMPANY.email}  ·  ${COMPANY.phone}`, left, 25.5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("COURSE HANDOUT", right, 16, { align: "right" })

  // Titles
  let y = 44
  doc.setTextColor(gold)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(input.courseTitle.toUpperCase(), left, y)
  y += 7
  doc.setTextColor(ink)
  doc.setFontSize(17)
  const titleLines = doc.splitTextToSize(input.lessonTitle, width) as string[]
  doc.text(titleLines, left, y)
  y += titleLines.length * 7 + 4

  // Body
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10.5)
  doc.setTextColor(ink)
  const paragraphs = htmlToText(input.content).split(/\n{2,}/)
  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para.replace(/\n/g, " "), width) as string[]
    for (const line of lines) {
      if (y > pageH - 22) {
        doc.addPage()
        y = 22
      }
      doc.text(line, left, y)
      y += 5.6
    }
    y += 3.2
  }

  // Legal footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor("#e2e8f0")
    doc.line(left, pageH - 16, right, pageH - 16)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(muted)
    doc.text(
      `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} (${COMPANY.jurisdiction}) · ${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode}`,
      left,
      pageH - 11,
    )
    doc.text(
      "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify",
      left,
      pageH - 7.5,
    )
    doc.text(`${p} / ${pages}`, right, pageH - 7.5, { align: "right" })
  }

  doc.save(`${slugify(input.lessonTitle) || "lesson"}-handout.pdf`)
}
