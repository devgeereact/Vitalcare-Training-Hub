import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPANY, BRAND } from "@/lib/constants"
import type { Invoice } from "@/types/database.types"

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

export function downloadInvoicePdf(inv: Invoice): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const navy = BRAND.navy
  const gold = BRAND.gold
  const muted = "#64748b"
  const ink = "#0f172a"

  // Letterhead band
  doc.setFillColor(navy)
  doc.rect(0, 0, 210, 34, "F")
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
  doc.text(`${COMPANY.email}  ·  ${COMPANY.phone}`, 14, 27)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.text("INVOICE", 196, 16, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(inv.number, 196, 23, { align: "right" })

  // Meta
  doc.setTextColor(ink)
  doc.setFontSize(9)
  doc.text(`Issue date: ${ukDate(inv.created_at)}`, 14, 45)
  const dueLabel = inv.due_date ? ukDate(inv.due_date) : "On receipt"
  doc.text(`Due date: ${dueLabel}`, 14, 50)
  doc.setFont("helvetica", "bold")
  doc.text(`Status: ${inv.status.toUpperCase()}`, 196, 45, { align: "right" })
  doc.setFont("helvetica", "normal")

  // From block
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("FROM", 14, 62)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(COMPANY.legalName, 14, 68)
  doc.setTextColor(muted)
  doc.setFontSize(9)
  doc.text(
    `${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode}`,
    14,
    73,
  )
  doc.text(COMPANY.email, 14, 78)
  doc.text(COMPANY.phone, 14, 83)
  doc.text(`Company No. ${COMPANY.companyNumber}`, 14, 88)

  // Bill to block
  doc.setTextColor(ink)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("BILL TO", 196, 62, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(inv.recipient_name ?? "—", 196, 68, { align: "right" })
  if (inv.recipient_email) {
    doc.setTextColor(muted)
    doc.setFontSize(9)
    doc.text(inv.recipient_email, 196, 73, { align: "right" })
  }

  // Items table
  const subtotalPence = inv.items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)
  autoTable(doc, {
    startY: 98,
    head: [["#", "Item / Description", "Qty", "Unit", "Amount"]],
    body: inv.items.map((i, idx) => [
      String(idx + 1),
      i.description,
      String(i.quantity),
      gbpPdf(i.unit_pence),
      gbpPdf(i.quantity * i.unit_pence),
    ]),
    foot: [
      ["", "", "", "Subtotal", gbpPdf(subtotalPence)],
      ["", "", "", "VAT", "Not applicable"],
      ["", "", "", "Total due", gbpPdf(inv.total_pence)],
    ],
    theme: "striped",
    headStyles: { fillColor: navy, halign: "left" },
    footStyles: { fillColor: "#f1f5f9", textColor: navy, fontStyle: "bold", halign: "right" },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 32 },
    },
  })

  // @ts-expect-error lastAutoTable is added by the jspdf-autotable plugin
  const finalY = (doc.lastAutoTable?.finalY ?? 130) as number
  let y = finalY + 10

  // Payment terms band
  doc.setFillColor("#f8fafc")
  doc.rect(14, y, 182, 14, "F")
  doc.setTextColor(ink)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("PAYMENT TERMS", 18, y + 5)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(muted)
  doc.setFontSize(8)
  doc.text(
    `Payment is due by ${dueLabel}. Please quote invoice ${inv.number}. Made payable to ${COMPANY.legalName}.`,
    18,
    y + 10,
    { maxWidth: 174 },
  )
  y += 22

  if (inv.notes) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(ink)
    doc.text("Notes", 14, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(muted)
    doc.text(inv.notes, 14, y + 5, { maxWidth: 180 })
  }

  // Footer
  doc.setDrawColor(gold)
  doc.setLineWidth(0.6)
  doc.line(14, 280, 196, 280)
  doc.setFontSize(8)
  doc.setTextColor("#94a3b8")
  doc.text(
    `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} (${COMPANY.jurisdiction}) · ${COMPANY.website} · ${COMPANY.email}`,
    105,
    286,
    { align: "center" },
  )

  doc.save(`invoice-${inv.number}.pdf`)
}
