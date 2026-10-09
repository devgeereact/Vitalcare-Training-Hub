/**
 * Finance Tracker workbook.
 *
 * Three things this sheet used to get wrong, each of which changes a number
 * somebody might bank on.
 *
 * It added VAT at 20% to every line and to the total column. Whether VAT
 * applies to a given training service, and at what rate, is the accountant's
 * decision, not a constant. The VAT columns now appear only when the company
 * records itself as VAT registered in `@/lib/constants`, at the rate recorded
 * there, and the rate is written into the column heading so nobody has to
 * guess which one was used.
 *
 * It totalled invoiced value in a column headed as though it were income.
 * Invoiced and received are now separate columns with separate totals, because
 * an invoice that has been sent is not money in the bank.
 *
 * It described every unpaid invoice as "Pending", including voided ones, so a
 * cancelled invoice looked like a debt still owed.
 *
 * Expenses and Dashboard have no source in the application and ship blank.
 * Their tabs say so.
 */
import type { Invoice } from "@/types/database.types"
import type { ColumnSpec, TotalsCellSpec, WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_MONEY } from "../theme"
import { penceToPounds, toDate } from "../format"
import { VAT } from "@/lib/constants"
import {
  CREATOR,
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES,
  MONTHS_2026,
  TEMPLATE_SUFFIX,
} from "./shared"

interface IncomeRow {
  date: Date | null
  number: string
  client: string | null
  course: string | null
  learners: number | null
  unitPrice: number | null
  total: number | null
  status: string
}

interface DashboardRow {
  month: string
}

/** Spreadsheet column letter for a zero-based index (0 -> A). */
function colLetter(index: number): string {
  let n = index
  let out = ""
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

const VAT_MULTIPLIER = (VAT.ratePercent / 100).toString()

function incomeSheet(rows: ReadonlyArray<IncomeRow>) {
  const columns: ColumnSpec<IncomeRow>[] = [
    { header: "Date", width: 14, numFmt: FMT_DATE, value: (r) => r.date },
    { header: "Invoice #", width: 16, value: (r) => r.number },
    { header: "Client", width: 26, value: (r) => r.client },
    { header: "Course", width: 20, value: (r) => r.course },
    { header: "Learners", width: 10, align: "center", value: (r) => r.learners },
    {
      header: "Unit Price (£)",
      width: 16,
      numFmt: FMT_MONEY,
      align: "right",
      value: (r) => r.unitPrice,
    },
    {
      header: "Invoiced (£)",
      width: 14,
      numFmt: FMT_MONEY,
      align: "right",
      value: (r) => r.total,
      formula: { template: "=E{r}*F{r}" },
    },
  ]

  // Indices are worked out as the columns are added, so the formulas below
  // still point at the right letters when the VAT pair is absent.
  const invoicedCol = colLetter(columns.length - 1)

  if (VAT.registered) {
    columns.push({
      header: `VAT ${VAT.ratePercent}% (£)`,
      width: 14,
      numFmt: FMT_MONEY,
      align: "right",
      formula: { template: `=${invoicedCol}{r}*${VAT_MULTIPLIER}` },
    })
    const vatCol = colLetter(columns.length - 1)
    columns.push({
      header: "Invoiced incl VAT (£)",
      width: 20,
      numFmt: FMT_MONEY,
      align: "right",
      formula: { template: `=${invoicedCol}{r}+${vatCol}{r}` },
    })
  }

  columns.push({
    header: "Status",
    width: 12,
    dropdown: INVOICE_STATUSES,
    value: (r) => r.status,
  })
  const statusCol = colLetter(columns.length - 1)
  const chargedCol = VAT.registered
    ? colLetter(columns.length - 2)
    : invoicedCol

  // Received is what the client actually paid: the charged total when the
  // invoice is marked Paid, nothing otherwise. Keeping it beside the invoiced
  // figure is the whole point, so the two can never be read as one number.
  columns.push({
    header: "Received (£)",
    width: 16,
    numFmt: FMT_MONEY,
    align: "right",
    formula: {
      template: `=IF(${statusCol}{r}="Paid",${chargedCol}{r},0)`,
    },
  })
  const receivedCol = colLetter(columns.length - 1)

  const totals: TotalsCellSpec[] = [
    { col: 0, text: "TOTALS" },
    { col: 4, formula: "=SUM(E2:E{last})" },
    {
      col: columns.findIndex((c) => c.header === "Invoiced (£)"),
      formula: `=SUM(${invoicedCol}2:${invoicedCol}{last})`,
      numFmt: FMT_MONEY,
    },
    {
      col: columns.length - 1,
      formula: `=SUM(${receivedCol}2:${receivedCol}{last})`,
      numFmt: FMT_MONEY,
    },
  ]
  if (VAT.registered) {
    const vatCol = colLetter(columns.findIndex((c) => c.header.startsWith("VAT")))
    const grossCol = colLetter(
      columns.findIndex((c) => c.header === "Invoiced incl VAT (£)"),
    )
    totals.push(
      {
        col: columns.findIndex((c) => c.header.startsWith("VAT")),
        formula: `=SUM(${vatCol}2:${vatCol}{last})`,
        numFmt: FMT_MONEY,
      },
      {
        col: columns.findIndex((c) => c.header === "Invoiced incl VAT (£)"),
        formula: `=SUM(${grossCol}2:${grossCol}{last})`,
        numFmt: FMT_MONEY,
      },
    )
  }

  return sheet<IncomeRow>({
    name: "Income",
    templateRowCount: 12,
    rows,
    totals,
    columns,
  })
}

function expensesSheet() {
  const columns: ColumnSpec<{ never?: never }>[] = [
    { header: "Date", width: 14, numFmt: FMT_DATE },
    { header: "Category", width: 18, dropdown: EXPENSE_CATEGORIES },
    { header: "Description", width: 28 },
    { header: "Amount (£)", width: 14, numFmt: FMT_MONEY, align: "right" },
  ]
  const totals: TotalsCellSpec[] = [
    { col: 0, text: "TOTALS" },
    { col: 3, formula: "=SUM(D2:D{last})", numFmt: FMT_MONEY },
  ]
  if (VAT.registered) {
    columns.push(
      {
        header: `VAT ${VAT.ratePercent}% (£)`,
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: `=D{r}*${VAT_MULTIPLIER}` },
      },
      {
        header: "Total (£)",
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=D{r}+E{r}" },
      },
    )
    totals.push(
      { col: 4, formula: "=SUM(E2:E{last})", numFmt: FMT_MONEY },
      { col: 5, formula: "=SUM(F2:F{last})", numFmt: FMT_MONEY },
    )
  }
  columns.push({ header: "Receipt #", width: 14 })

  return sheet<{ never?: never }>({
    name: `Expenses ${TEMPLATE_SUFFIX}`,
    templateRowCount: 12,
    rows: [],
    totals,
    columns,
  })
}

function dashboardSheet() {
  return sheet<DashboardRow>({
    name: `Dashboard ${TEMPLATE_SUFFIX}`,
    rows: MONTHS_2026.map((month) => ({ month })),
    columns: [
      { header: "Month", width: 16, value: (r) => r.month },
      { header: "Total Income (£)", width: 18, numFmt: FMT_MONEY, align: "right" },
      { header: "Total Expenses (£)", width: 18, numFmt: FMT_MONEY, align: "right" },
      {
        header: "Net Profit (£)",
        width: 16,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=B{r}-C{r}" },
      },
      {
        header: "Running Income (£)",
        width: 18,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=SUM(B$2:B{r})" },
      },
      {
        header: "Running Expenses (£)",
        width: 18,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=SUM(C$2:C{r})" },
      },
      {
        header: "Running Profit (£)",
        width: 18,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=SUM(D$2:D{r})" },
      },
    ],
  })
}

function workbook(income: ReadonlyArray<IncomeRow>): WorkbookSpec {
  return {
    fileName: "Vitalcare-Finance-Tracker.xlsx",
    creator: CREATOR,
    sheets: [incomeSheet(income), expensesSheet(), dashboardSheet()],
  }
}

export function buildFinanceTrackerTemplate(): WorkbookSpec {
  return workbook([])
}

/**
 * Invoice status, said plainly.
 *
 * Everything that was not paid used to read "Pending", which turned a voided
 * invoice into an outstanding debt and a draft into a promise to a client who
 * had never been sent it.
 */
function incomeStatus(status: Invoice["status"]): string {
  switch (status) {
    case "paid":
      return "Paid"
    case "sent":
      return "Sent"
    case "draft":
      return "Draft"
    case "void":
      return "Void"
    default:
      return "Unknown"
  }
}

export function buildFinanceTrackerLive(
  invoices: ReadonlyArray<Invoice>,
): WorkbookSpec {
  const rows: IncomeRow[] = invoices.map((inv) => ({
    date: toDate(inv.created_at),
    number: inv.number,
    client: inv.recipient_name,
    course: inv.items[0]?.description ?? null,
    learners: null,
    unitPrice: null,
    total: penceToPounds(inv.total_pence),
    status: incomeStatus(inv.status),
  }))
  return workbook(rows)
}
