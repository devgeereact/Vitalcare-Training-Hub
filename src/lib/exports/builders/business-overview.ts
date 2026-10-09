/**
 * Business Overview workbook.
 *
 * The live export reports year-to-date measures that say what they count. The
 * previous version put every learner account under "Learners Trained", every
 * training session under "Courses Delivered" (cancelled and future ones
 * included), and headed the row "Year to date" without applying a date filter
 * anywhere. Three of those figures were wrong in the flattering direction.
 *
 * Clients and Forecast have no source in the application, so they ship as
 * blank templates. Their tabs say so, because a styled empty sheet inside a
 * workbook named "live export" reads as a real answer of zero.
 */
import type { BusinessMeasures } from "@/lib/queries/analytics.queries"
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_MONEY } from "../theme"
import {
  ACCOUNT_STATUSES,
  CREATOR,
  MONTHS_2026,
  ORG_TYPES,
  TEMPLATE_SUFFIX,
} from "./shared"

interface KpiRow {
  measure: string
  value: number | string | null
  basis: string
}

interface ClientRow {
  name?: string
}

interface ForecastRow {
  month: string
}

function formatPeriod(measures: BusinessMeasures): string {
  const from = new Date(measures.periodStart)
  const to = new Date(measures.periodEnd)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  return `${fmt(from)} to ${fmt(to)}`
}

function pounds(pence: number): number {
  return Math.round(pence) / 100
}

/**
 * One row per measure, each carrying the rule used to produce it.
 *
 * A number in a spreadsheet outlives the conversation that explained it, so
 * the definition travels in the next column rather than in somebody's memory.
 */
function kpiSheet(rows: ReadonlyArray<KpiRow>) {
  return sheet<KpiRow>({
    name: "KPIs",
    rows,
    templateRowCount: 10,
    columns: [
      { header: "Measure", width: 30, value: (r) => r.measure },
      { header: "Value", width: 16, align: "right", value: (r) => r.value },
      { header: "What this counts", width: 74, value: (r) => r.basis },
    ],
  })
}

function clientsSheet() {
  return sheet<ClientRow>({
    name: `Clients ${TEMPLATE_SUFFIX}`,
    templateRowCount: 12,
    rows: [],
    columns: [
      { header: "Client Name", width: 26 },
      { header: "Organisation Type", width: 20, dropdown: ORG_TYPES },
      { header: "First Contact", width: 14, numFmt: FMT_DATE },
      { header: "Last Training", width: 14, numFmt: FMT_DATE },
      { header: "Courses Taken", width: 14, align: "center" },
      { header: "Total Spend (£)", width: 16, numFmt: FMT_MONEY, align: "right" },
      { header: "Account Status", width: 16, dropdown: ACCOUNT_STATUSES },
    ],
  })
}

function forecastSheet() {
  return sheet<ForecastRow>({
    name: `Forecast ${TEMPLATE_SUFFIX}`,
    rows: MONTHS_2026.map((month) => ({ month })),
    columns: [
      { header: "Month", width: 16, value: (r) => r.month },
      { header: "Projected Revenue (£)", width: 18, numFmt: FMT_MONEY, align: "right" },
      { header: "Projected Learners", width: 16, align: "center" },
      { header: "Actual Revenue (£)", width: 18, numFmt: FMT_MONEY, align: "right" },
      { header: "Actual Learners", width: 16, align: "center" },
      {
        header: "Target Achieved",
        width: 16,
        align: "center",
        formula: { template: '=IF(D{r}="","",IF(D{r}>=B{r},"Y","N"))' },
      },
    ],
  })
}

function workbook(kpis: ReadonlyArray<KpiRow>): WorkbookSpec {
  return {
    fileName: "Vitalcare-Business-Overview.xlsx",
    creator: CREATOR,
    sheets: [kpiSheet(kpis), clientsSheet(), forecastSheet()],
  }
}

export function buildBusinessOverviewTemplate(): WorkbookSpec {
  return workbook([])
}

export function buildBusinessOverviewLive(
  measures: BusinessMeasures,
): WorkbookSpec {
  const period = formatPeriod(measures)
  const rows: KpiRow[] = [
    {
      measure: "Period",
      value: period,
      basis: "1 January to the moment this workbook was exported. Every figure below is filtered to it.",
    },
    {
      measure: "Learners trained",
      value: measures.learnersTrained,
      basis:
        "People who completed at least one course in the period, counted once each. Not the number of registered accounts.",
    },
    {
      measure: "Course completions",
      value: measures.completions,
      basis:
        "Enrolments marked completed in the period. One learner finishing three courses counts three times here and once above.",
    },
    {
      measure: "Enrolments started",
      value: measures.enrolments,
      basis: "Enrolments created in the period, whether or not they were finished.",
    },
    {
      measure: "Sessions delivered",
      value: measures.sessionsDelivered,
      basis:
        "Training sessions marked completed whose end time has passed. Cancelled and future sessions are excluded.",
    },
    {
      measure: "Sessions cancelled",
      value: measures.sessionsCancelled,
      basis: "Sessions in the period whose status is cancelled. Shown separately, never in the delivered figure.",
    },
    {
      measure: "Sessions still to come",
      value: measures.sessionsScheduled,
      basis: "Scheduled sessions starting after the export time. Not yet delivered.",
    },
    {
      measure: "Certificates issued",
      value: measures.certificatesIssued,
      basis: "Approved certificates issued in the period. Certificates awaiting approval are excluded.",
    },
    {
      measure: "Invoiced (£)",
      value: pounds(measures.invoicedPence),
      basis:
        "Value of invoices raised in the period and either sent or paid. Drafts and voided invoices are excluded. This is what was billed, not what was received.",
    },
    {
      measure: "Received, invoices (£)",
      value: pounds(measures.receivedPence),
      basis: "Value of invoices marked paid in the period, dated by the payment.",
    },
    {
      measure: "Received, store orders (£)",
      value: pounds(measures.orderReceiptsPence),
      basis:
        "Value of store orders confirmed as paid in the period. Separate from invoices, so the two are not double counted.",
    },
    {
      measure: "New and repeat clients, NPS",
      value: null,
      basis: "Not tracked by the platform. Left blank rather than estimated.",
    },
  ]
  return workbook(rows)
}
