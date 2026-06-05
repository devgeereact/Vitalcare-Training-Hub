/**
 * Business Overview workbook. The KPIs sheet supports a live export with a
 * single year-to-date row drawn from platform analytics and paid invoices.
 * New/repeat client segmentation and NPS are not tracked, so those stay blank.
 * Clients and Forecast ship as styled templates.
 */
import type { AnalyticsSummary } from "@/lib/queries/analytics.queries"
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_MONEY } from "../theme"
import {
  ACCOUNT_STATUSES,
  CREATOR,
  MONTHS_2026,
  ORG_TYPES,
} from "./shared"

interface KpiRow {
  period: string
  coursesDelivered: number | null
  learnersTrained: number | null
  revenue: number | null
  newClients: number | null
  repeatClients: number | null
  nps: number | null
  certificates: number | null
}

interface ClientRow {
  name?: string
}

interface ForecastRow {
  month: string
}

function kpiSheet(rows: ReadonlyArray<KpiRow>) {
  return sheet<KpiRow>({
    name: "KPIs",
    rows,
    templateRowCount: 12,
    columns: [
      { header: "Month", width: 16, value: (r) => r.period },
      { header: "Courses Delivered", width: 18, align: "center", value: (r) => r.coursesDelivered },
      { header: "Learners Trained", width: 16, align: "center", value: (r) => r.learnersTrained },
      { header: "Revenue (£)", width: 14, numFmt: FMT_MONEY, align: "right", value: (r) => r.revenue },
      { header: "New Clients", width: 14, align: "center", value: (r) => r.newClients },
      { header: "Repeat Clients", width: 14, align: "center", value: (r) => r.repeatClients },
      { header: "NPS Score", width: 12, align: "center", value: (r) => r.nps },
      { header: "Certificates Issued", width: 16, align: "center", value: (r) => r.certificates },
    ],
  })
}

function clientsSheet() {
  return sheet<ClientRow>({
    name: "Clients",
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
    name: "Forecast",
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
  summary: AnalyticsSummary,
  revenuePounds: number | null,
): WorkbookSpec {
  const ytd: KpiRow = {
    period: "Year to date",
    coursesDelivered: summary.sessions,
    learnersTrained: summary.learners,
    revenue: revenuePounds,
    newClients: null,
    repeatClients: null,
    nps: null,
    certificates: summary.certificates,
  }
  return workbook([ytd])
}
