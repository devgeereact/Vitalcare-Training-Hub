/**
 * Finance Tracker workbook. The Income sheet supports a live export from
 * invoices; Expenses and Dashboard ship as styled templates (no expense source
 * exists in the app). Invoice money is integer pence and is converted to pounds
 * before being placed in a money cell.
 */
import type { Invoice } from "@/types/database.types"
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_MONEY } from "../theme"
import { penceToPounds, toDate } from "../format"
import {
  CREATOR,
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES,
  MONTHS_2026,
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

function incomeSheet(rows: ReadonlyArray<IncomeRow>) {
  return sheet<IncomeRow>({
    name: "Income",
    templateRowCount: 12,
    rows,
    totals: [
      { col: 0, text: "TOTALS" },
      { col: 4, formula: "=SUM(E2:E{last})" },
      { col: 6, formula: "=SUM(G2:G{last})", numFmt: FMT_MONEY },
      { col: 7, formula: "=SUM(H2:H{last})", numFmt: FMT_MONEY },
      { col: 8, formula: "=SUM(I2:I{last})", numFmt: FMT_MONEY },
    ],
    columns: [
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
        header: "Total (£)",
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        value: (r) => r.total,
        formula: { template: "=E{r}*F{r}" },
      },
      {
        header: "VAT 20% (£)",
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=G{r}*0.2" },
      },
      {
        header: "Grand Total (£)",
        width: 16,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=G{r}+H{r}" },
      },
      { header: "Status", width: 12, dropdown: INVOICE_STATUSES, value: (r) => r.status },
    ],
  })
}

function expensesSheet() {
  return sheet<{ never?: never }>({
    name: "Expenses",
    templateRowCount: 12,
    rows: [],
    totals: [
      { col: 0, text: "TOTALS" },
      { col: 3, formula: "=SUM(D2:D{last})", numFmt: FMT_MONEY },
      { col: 4, formula: "=SUM(E2:E{last})", numFmt: FMT_MONEY },
      { col: 5, formula: "=SUM(F2:F{last})", numFmt: FMT_MONEY },
    ],
    columns: [
      { header: "Date", width: 14, numFmt: FMT_DATE },
      { header: "Category", width: 18, dropdown: EXPENSE_CATEGORIES },
      { header: "Description", width: 28 },
      { header: "Amount (£)", width: 14, numFmt: FMT_MONEY, align: "right" },
      {
        header: "VAT (£)",
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=D{r}*0.2" },
      },
      {
        header: "Total (£)",
        width: 14,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=D{r}+E{r}" },
      },
      { header: "Receipt #", width: 14 },
    ],
  })
}

function dashboardSheet() {
  return sheet<DashboardRow>({
    name: "Dashboard",
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

function incomeStatus(status: Invoice["status"]): string {
  return status === "paid" ? "Paid" : "Pending"
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
