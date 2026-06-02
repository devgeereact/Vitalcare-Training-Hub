import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COMPANY, BRAND } from "@/lib/constants"
import type { Invoice } from "@/types/database.types"

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(pence / 100)
}

export function downloadInvoicePdf(inv: Invoice) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const navy = BRAND.navy

  doc.setFillColor(navy)
  doc.rect(0, 0, 210, 28, "F")
  doc.setTextColor("#ffffff")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("INVOICE", 14, 18)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(COMPANY.name, 196, 14, { align: "right" })
  doc.text(`Company No. ${COMPANY.companyNumber}`, 196, 20, { align: "right" })

  doc.setTextColor("#0f172a")
  doc.setFontSize(10)
  doc.text(`Invoice: ${inv.number}`, 14, 40)
  doc.text(`Date: ${new Date(inv.created_at).toLocaleDateString("en-GB")}`, 14, 46)
  if (inv.due_date) doc.text(`Due: ${new Date(inv.due_date).toLocaleDateString("en-GB")}`, 14, 52)
  doc.text(`Status: ${inv.status.toUpperCase()}`, 196, 40, { align: "right" })

  doc.setFont("helvetica", "bold")
  doc.text("Bill to:", 14, 62)
  doc.setFont("helvetica", "normal")
  doc.text(inv.recipient_name || "—", 14, 68)
  if (inv.recipient_email) doc.text(inv.recipient_email, 14, 73)

  autoTable(doc, {
    startY: 80,
    head: [["Description", "Qty", "Unit", "Amount"]],
    body: inv.items.map((i) => [
      i.description,
      String(i.quantity),
      gbp(i.unit_pence),
      gbp(i.quantity * i.unit_pence),
    ]),
    foot: [["", "", "Total", gbp(inv.total_pence)]],
    theme: "striped",
    headStyles: { fillColor: navy },
    footStyles: { fillColor: "#f1f5f9", textColor: navy, fontStyle: "bold" },
  })

  // @ts-expect-error lastAutoTable is added by the plugin
  const y = (doc.lastAutoTable?.finalY ?? 120) + 12
  if (inv.notes) {
    doc.setFontSize(9)
    doc.setTextColor("#64748b")
    doc.text(inv.notes, 14, y, { maxWidth: 180 })
  }
  doc.setFontSize(8)
  doc.setTextColor("#94a3b8")
  doc.text(
    `${COMPANY.legalName} · ${COMPANY.address.line1}, ${COMPANY.address.city} ${COMPANY.address.postcode} · ${COMPANY.email}`,
    14,
    285,
  )

  doc.save(`invoice-${inv.number}.pdf`)
}
