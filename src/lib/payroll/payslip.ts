import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPANY, LEADERSHIP, BRAND } from "@/lib/constants"
import type { Payroll } from "@/types/database.types"

/**
 * GBP for the PDF, matching the on-screen preview exactly (£1,250.00). jsPDF's
 * standard helvetica maps the pound sign via WinAnsi encoding, so £ renders.
 */
function gbpPdf(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100)
}

function ukDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function periodRange(p: Payroll): string {
  if (p.period_start && p.period_end) {
    return `${ukDate(p.period_start)} to ${ukDate(p.period_end)}`
  }
  return p.period
}

export function downloadPayslipPdf(p: Payroll): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const navy = BRAND.navy
  const gold = BRAND.gold
  const muted = "#64748b"
  const ink = "#0f172a"

  // Employer letterhead band
  doc.setFillColor(navy)
  doc.rect(0, 0, pageW, 34, "F")
  doc.setTextColor("#ffffff")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(COMPANY.name, 14, 15)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(
    `${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode}`,
    14,
    22,
  )
  doc.text(`Company No. ${COMPANY.companyNumber} (${COMPANY.jurisdiction})`, 14, 27)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.text("PAYSLIP", pageW - 14, 16, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(p.period, pageW - 14, 23, { align: "right" })

  // Employee block
  doc.setTextColor(ink)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("EMPLOYEE", 14, 46)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(p.staff_name, 14, 52)
  if (p.staff_email) {
    doc.setTextColor(muted)
    doc.setFontSize(9)
    doc.text(p.staff_email, 14, 57)
  }

  // Pay-period block
  doc.setTextColor(ink)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("PAY DETAILS", pageW - 14, 46, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setTextColor(muted)
  doc.setFontSize(9)
  doc.text(`Period: ${periodRange(p)}`, pageW - 14, 52, { align: "right" })
  const payDate = p.paid_at ? ukDate(p.paid_at) : p.status === "paid" ? "—" : "Pending"
  doc.text(`Pay date: ${payDate}`, pageW - 14, 57, { align: "right" })
  doc.text(`Status: ${p.status.toUpperCase()}`, pageW - 14, 62, { align: "right" })

  // Earnings / deductions table
  autoTable(doc, {
    startY: 70,
    head: [["Description", "Amount"]],
    body: [
      ["Gross pay", gbpPdf(p.gross_pence)],
      ["Deductions", `${p.deductions_pence > 0 ? "- " : ""}${gbpPdf(p.deductions_pence)}`],
    ],
    foot: [["Net pay", gbpPdf(p.net_pence)]],
    theme: "grid",
    headStyles: { fillColor: navy, textColor: "#ffffff", halign: "left" },
    footStyles: { fillColor: "#f1f5f9", textColor: navy, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
    styles: { fontSize: 10, cellPadding: 3 },
  })

  // @ts-expect-error lastAutoTable is added by the jspdf-autotable plugin
  const endY: number = doc.lastAutoTable?.finalY ?? 110
  let y = endY + 10

  if (p.notes) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(ink)
    doc.text("Notes", 14, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(muted)
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(p.notes, pageW - 28), 14, y + 5)
    y += 16
  }

  // Computer-generated note
  doc.setFontSize(8)
  doc.setTextColor(muted)
  doc.text(
    doc.splitTextToSize(
      `This is a computer-generated payslip and does not require a signature. Please retain it for your records. Authorised by ${LEADERSHIP.ceo.name}, ${LEADERSHIP.ceo.role}.`,
      pageW - 28,
    ),
    14,
    y,
  )

  // Footer
  doc.setDrawColor(gold)
  doc.setLineWidth(0.6)
  doc.line(14, 280, pageW - 14, 280)
  doc.setFontSize(8)
  doc.setTextColor("#94a3b8")
  doc.text(
    `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} (${COMPANY.jurisdiction}) · ${COMPANY.website} · ${COMPANY.email} · ${COMPANY.phone}`,
    pageW / 2,
    286,
    { align: "center" },
  )

  doc.save(
    `payslip-${p.staff_name.replace(/\s+/g, "-").toLowerCase()}-${p.period.replace(/\s+/g, "-")}.pdf`,
  )
}
