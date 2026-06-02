import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { COMPANY, LOGOS } from "@/lib/constants"
import { gbp } from "@/lib/queries/invoices.queries"
import type { Invoice, InvoiceStatus } from "@/types/database.types"

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
}

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/15 text-success",
  void: "bg-destructive/15 text-destructive",
}

/**
 * Presentational, printable invoice. Renders inside the View dialog and is the
 * single element kept visible during window.print() (see the @media print block
 * in InvoicesPage which hides everything except #invoice-printable).
 */
export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const subtotalPence = invoice.items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)

  return (
    <div
      id="invoice-printable"
      className="bg-white text-foreground print:p-0"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
        <div>
          <h2 className="font-display text-4xl leading-none text-brand-navy">INVOICE</h2>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Number</dt>
              <dd className="font-mono text-foreground">{invoice.number}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="text-foreground">
                {format(new Date(invoice.created_at), "d MMMM yyyy")}
              </dd>
            </div>
            {invoice.due_date && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Due</dt>
                <dd className="text-foreground">
                  {format(new Date(invoice.due_date), "d MMMM yyyy")}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="flex flex-col items-end gap-3">
          <img
            src={LOGOS.horizontalNavy}
            alt="Vitalcare Training Hub"
            width={200}
            height={50}
            className="h-12 w-auto"
          />
          <Badge variant="secondary" className={STATUS_STYLE[invoice.status]}>
            {STATUS_LABEL[invoice.status]}
          </Badge>
        </div>
      </div>

      {/* From / To */}
      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            From
          </p>
          <p className="font-medium text-foreground">{COMPANY.legalName}</p>
          <p className="text-sm text-muted-foreground">
            {COMPANY.address.line1}, {COMPANY.address.city} {COMPANY.address.postcode}
          </p>
          <p className="text-sm text-muted-foreground">{COMPANY.email}</p>
          <p className="text-sm text-muted-foreground">{COMPANY.phone}</p>
          <p className="text-sm text-muted-foreground">Company No. {COMPANY.companyNumber}</p>
        </div>
        <div className="sm:text-right">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bill to
          </p>
          <p className="font-medium text-foreground">{invoice.recipient_name ?? "—"}</p>
          {invoice.recipient_email && (
            <p className="text-sm text-muted-foreground">{invoice.recipient_email}</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-navy text-left text-xs uppercase tracking-wide text-white">
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Item / Description</th>
              <th className="px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="px-3 py-2.5 text-right font-medium">Unit</th>
              <th className="px-3 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-border">
                <td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2.5 text-foreground">{item.description}</td>
                <td className="px-3 py-2.5 text-right text-foreground">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right text-foreground">{gbp(item.unit_pence)}</td>
                <td className="px-3 py-2.5 text-right text-foreground">
                  {gbp(item.quantity * item.unit_pence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-5 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-foreground">{gbp(subtotalPence)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-display text-xl text-brand-navy">{gbp(invoice.total_pence)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        {COMPANY.legalName} · Company No. {COMPANY.companyNumber} ({COMPANY.jurisdiction}) ·{" "}
        {COMPANY.website}
      </div>
    </div>
  )
}
