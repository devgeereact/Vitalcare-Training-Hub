import type { JSX } from "react"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { COMPANY, LEADERSHIP, LOGOS } from "@/lib/constants"
import { gbp } from "@/lib/queries/payroll.queries"
import type { Payroll, PayrollStatus } from "@/types/database.types"

const STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
}

const STATUS_STYLE: Record<PayrollStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  paid: "bg-success/15 text-success",
}

function periodRange(p: Payroll): string {
  if (p.period_start && p.period_end) {
    return `${format(new Date(p.period_start), "d MMM yyyy")} to ${format(
      new Date(p.period_end),
      "d MMM yyyy",
    )}`
  }
  return p.period
}

/**
 * Presentational, printable payslip. Renders inside the Preview dialog and is
 * the single element kept visible during window.print() (see print.css, which
 * hides everything except #payslip-printable).
 */
export function PayslipView({ payslip }: { payslip: Payroll }): JSX.Element {
  const payDate = payslip.paid_at
    ? format(new Date(payslip.paid_at), "d MMMM yyyy")
    : payslip.status === "paid"
      ? "-"
      : "Pending"

  return (
    <div
      id="payslip-printable"
      className="overflow-hidden rounded-lg border border-border bg-white text-foreground shadow-sm print:rounded-none print:border-0 print:shadow-none"
    >
      {/* Employer letterhead */}
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
            Company No. {COMPANY.companyNumber} ({COMPANY.jurisdiction})
          </p>
        </div>
        <div className="text-right">
          <h2 className="font-display text-4xl leading-none">Payslip</h2>
          <p className="mt-2 text-sm text-white/90">{payslip.period}</p>
        </div>
      </div>

      <div className="px-8 py-7 print:px-0">
        {/* Employee + pay-period block */}
        <div className="grid gap-6 border-b border-border pb-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employee
            </p>
            <p className="font-medium text-foreground">{payslip.staff_name}</p>
            {payslip.staff_email && (
              <p className="text-sm text-muted-foreground">{payslip.staff_email}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pay period
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-muted-foreground">Period</dt>
                <dd className="text-foreground">{periodRange(payslip)}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-muted-foreground">Pay date</dt>
                <dd className="text-foreground">{payDate}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge
                    variant="secondary"
                    className={`capitalize ${STATUS_STYLE[payslip.status]}`}
                  >
                    {STATUS_LABEL[payslip.status]}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Earnings / deductions */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-navy text-left text-xs uppercase tracking-wide text-white">
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2.5 text-foreground">Gross pay</td>
                <td className="px-3 py-2.5 text-right text-foreground">
                  {gbp(payslip.gross_pence)}
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2.5 text-foreground">Deductions</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">
                  {payslip.deductions_pence > 0 ? "− " : ""}
                  {gbp(payslip.deductions_pence)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net pay */}
        <div className="mt-5 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Gross</dt>
              <dd className="text-foreground">{gbp(payslip.gross_pence)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total deductions</dt>
              <dd className="text-foreground">{gbp(payslip.deductions_pence)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-brand-navy px-3 py-2.5 text-white">
              <dt className="text-sm font-medium">Net pay</dt>
              <dd className="font-display text-2xl leading-none text-brand-gold">
                {gbp(payslip.net_pence)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Notes */}
        {payslip.notes && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{payslip.notes}</p>
          </div>
        )}

        {/* Computer-generated note */}
        <p className="mt-6 rounded-md border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          This is a computer-generated payslip and does not require a signature. Please retain
          it for your records. Authorised by {LEADERSHIP.ceo.name}, {LEADERSHIP.ceo.role}.
        </p>

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{COMPANY.legalName}</p>
          <p>
            Company No. {COMPANY.companyNumber} ({COMPANY.jurisdiction}) · {COMPANY.website} ·{" "}
            {COMPANY.email} · {COMPANY.phone}
          </p>
        </div>
      </div>
    </div>
  )
}