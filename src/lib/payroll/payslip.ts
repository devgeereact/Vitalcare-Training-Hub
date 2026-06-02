import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPANY, BRAND } from "@/lib/constants"
import type { Payroll } from "@/types/database.types"

/** jsPDF helvetica lacks the £ glyph, so use a "GBP " prefix. */
function gbpPdf(pence: number): string {
  const amount = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pence / 100)
  return `GBP ${amount}`
}

export function downloadPayslipPdf(p: Payroll): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()

  // Header band
  doc.setFillColor(BRAND.navy)
  doc.rect(0, 0, pageW, 28, "F")
  doc.setTextColor("#ffffff")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Payslip", 14, 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(COMPANY.legalName, 14, 21)

  // Employer / employee
  doc.setTextColor("#0f172a")
  doc.setFontSize(9)
  let y = 40
  doc.setFont("helvetica", "bold")
  doc.text("Employer", 14, y)
  doc.text("Employee", pageW / 2, y)
  doc.setFont("helvetica", "normal")
  y += 5
  doc.text(COMPANY.legalName, 14, y)
  doc.text(p.staff_name, pageW / 2, y)
  y += 5
  doc.text(`${COMPANY.address.line1}, ${COMPANY.address.city}`, 14, y)
  if (p.staff_email) doc.text(p.staff_email, pageW / 2, y)
  y += 5
  doc.text(`${COMPANY.address.postcode}`, 14, y)
  doc.text(`Pay period: ${p.period}`, pageW / 2, y)
  y += 5
  doc.text(`Company No. ${COMPANY.companyNumber}`, 14, y)
  doc.text(`Status: ${p.status}`, pageW / 2, y)

  // Earnings / deductions table
  autoTable(doc, {
    startY: y + 8,
    head: [["Description", "Amount"]],
    body: [
      ["Gross pay", gbpPdf(p.gross_pence)],
      ["Deductions", `- ${gbpPdf(p.deductions_pence)}`],
    ],
    foot: [["Net pay", gbpPdf(p.net_pence)]],
    headStyles: { fillColor: BRAND.navy, textColor: "#ffffff" },
    footStyles: { fillColor: "#f1f5f9", textColor: "#0f172a", fontStyle: "bold" },
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
  })

  // Notes
  // @ts-expect-error lastAutoTable is added by the autotable plugin
  const endY: number = doc.lastAutoTable?.finalY ?? y + 30
  if (p.notes) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Notes", 14, endY + 10)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(p.notes, pageW - 28), 14, endY + 15)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor("#64748b")
  doc.text(
    `${COMPANY.legalName} · ${COMPANY.website} · ${COMPANY.email} · ${COMPANY.phone}`,
    pageW / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  )

  doc.save(`payslip-${p.staff_name.replace(/\s+/g, "-").toLowerCase()}-${p.period.replace(/\s+/g, "-")}.pdf`)
}
