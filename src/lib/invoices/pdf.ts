import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPANY, BRAND } from "@/lib/constants"
import type { Invoice } from "@/types/database.types"

/**
 * GBP for the PDF. jsPDF's built-in helvetica font does not carry the £ glyph,
 * so it renders as a tofu box. We use a "GBP " prefix instead to keep amounts
 * legible and unambiguous.
 */
function gbpPdf(pence: number): string {
  const amount = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pence / 100)
  return `GBP ${amount}`
}

export function downloadInvoicePdf(inv: Invoice) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const navy = BRAND.navy
  const muted = "#64748b"

  // Header band
  doc.setFillColor(navy)
  doc.rect(0, 0, 210, 30, "F")
  doc.setTextColor("#ffffff")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("INVOICE", 14, 19)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(COMPANY.name, 196, 13, { align: "right" })
  doc.setFontSize(8)
  doc.text(`Company No. ${COMPANY.companyNumber}`, 196, 19, { align: "right" })
  doc.text(COMPANY.website, 196, 24, { align: "right" })

  // Invoice meta
  doc.setTextColor("#0f172a")
  doc.setFontSize(10)
  doc.text(`Invoice: ${inv.number}`, 14, 42)
  doc.text(`Issued: ${new Date(inv.created_at).toLocaleDateString("en-GB")}`, 14, 48)
  if (inv.due_date) {
    doc.text(`Due: ${new Date(inv.due_date).toLocaleDateString("en-GB")}`, 14, 54)
  }
  doc.setFont("helvetica", "bold")
  doc.text(`Status: ${inv.status.toUpperCase()}`, 196, 42, { align: "right" })
  doc.setFont("helvetica", "normal")

  // From block
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("FROM", 14, 66)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(COMPANY.legalName, 14, 72)
  doc.setTextColor(muted)
  doc.setFontSize(9)
  doc.text(
    `${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode}`,
    14,
    77,
  )
  doc.text(COMPANY.email, 14, 82)
  doc.text(COMPANY.phone, 14, 87)

  // Bill to block
  doc.setTextColor("#0f172a")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("BILL TO", 196, 66, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(inv.recipient_name ?? "—", 196, 72, { align: "right" })
  if (inv.recipient_email) {
    doc.setTextColor(muted)
    doc.setFontSize(9)
    doc.text(inv.recipient_email, 196, 77, { align: "right" })
  }

  // Items table
  const subtotalPence = inv.items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)
  autoTable(doc, {
    startY: 96,
    head: [["#", "Item / Description", "Qty", "Unit", "Total"]],
    body: inv.items.map((i, idx) => [
      String(idx + 1),
      i.description,
      String(i.quantity),
      gbpPdf(i.unit_pence),
      gbpPdf(i.quantity * i.unit_pence),
    ]),
    foot: [
      ["", "", "", "Subtotal", gbpPdf(subtotalPence)],
      ["", "", "", "Total", gbpPdf(inv.total_pence)],
    ],
    theme: "striped",
    headStyles: { fillColor: navy, halign: "left" },
    footStyles: { fillColor: "#f1f5f9", textColor: navy, fontStyle: "bold", halign: "right" },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 30 },
    },
  })

  // @ts-expect-error lastAutoTable is added by the jspdf-autotable plugin
  const finalY = (doc.lastAutoTable?.finalY ?? 130) as number
  let y = finalY + 12

  if (inv.notes) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor("#0f172a")
    doc.text("Notes", 14, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(muted)
    doc.text(inv.notes, 14, y + 5, { maxWidth: 180 })
    y += 12
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor("#94a3b8")
  doc.text(
    `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} (${COMPANY.jurisdiction}) · ${COMPANY.email}`,
    105,
    287,
    { align: "center" },
  )

  doc.save(`invoice-${inv.number}.pdf`)
}
