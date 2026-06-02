import type { JSX } from "react"
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
 * single element kept visible during window.print() (see print.css, which hides
 * everything except #invoice-printable).
 */
export function InvoiceView({ invoice }: { invoice: Invoice }): JSX.Element {
  const subtotalPence = invoice.items.reduce((s, i) => s + i.quantity * i.unit_pence, 0)
  const dueLabel = invoice.due_date
    ? format(new Date(invoice.due_date), "d MMMM yyyy")
    : "On receipt"

  return (
    <div
      id="invoice-printable"
      className="overflow-hidden rounded-lg border border-border bg-white text-foreground shadow-sm print:rounded-none print:border-0 print:shadow-none"
    >
      {/* Letterhead */}
      <div className="flex flex-wrap items-start justify-between gap-6 bg-brand-navy px-8 py-7 text-white print:px-0">
        <div>
          <img
            src={LOGOS.horizontalWhite}
            alt="Vitalcare Training Hub"
            width={220}
            height={55}
            className="h-11 w-auto"
          />
          <p className="mt-3 text-xs leading-relaxed text-white/80">
            {COMPANY.address.line1}, {COMPANY.address.city} {COMPANY.address.postcode}
            <br />
            {COMPANY.email} · {COMPANY.phone}
          </p>
        </div>
        <div className="text-right">
          <h2 className="font-display text-4xl leading-none">Invoice</h2>
          <p className="mt-2 font-mono text-sm tracking-wide text-white/90">{invoice.number}</p>
        </div>
      </div>

      <div className="px-8 py-7 print:px-0">
        {/* Meta + status */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Issue date</dt>
            <dd className="text-foreground">
              {format(new Date(invoice.created_at), "d MMMM yyyy")}
            </dd>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="text-foreground">{dueLabel}</dd>
            <dt className="text-muted-foreground">Currency</dt>
            <dd className="text-foreground">GBP (£)</dd>
          </dl>
          <Badge
            variant="secondary"
            className={`px-3 py-1 text-sm capitalize ${STATUS_STYLE[invoice.status]}`}
          >
            {STATUS_LABEL[invoice.status]}
          </Badge>
        </div>

        {/* From / Bill to */}
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
            <p className="text-sm text-muted-foreground">
              Company No. {COMPANY.companyNumber}
            </p>
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
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2.5 text-foreground">{item.description}</td>
                  <td className="px-3 py-2.5 text-right text-foreground">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right text-foreground">
                    {gbp(item.unit_pence)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-foreground">
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
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT</dt>
              <dd className="text-foreground">Not applicable</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-brand-navy px-3 py-2.5 text-white">
              <dt className="text-sm font-medium">Total due</dt>
              <dd className="font-display text-2xl leading-none text-brand-gold">
                {gbp(invoice.total_pence)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment terms */}
        <div className="mt-6 rounded-md border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Payment terms:</span> payment is due
          by {dueLabel}. Please quote invoice {invoice.number} with your payment. Made payable to{" "}
          {COMPANY.legalName}.
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{COMPANY.legalName}</p>
          <p>
            Company No. {COMPANY.companyNumber} ({COMPANY.jurisdiction}) · {COMPANY.website} ·{" "}
            {COMPANY.email}
          </p>
          <p className="mt-1">Thank you for your business.</p>
        </div>
      </div>
    </div>
  )
}