/**
 * The catalogue of generatable workbooks. Holds presentation metadata and the
 * blank-template builder for each. Live-data builders are wired in the Reports
 * page where the relevant query hooks can be called.
 */
import type { WorkbookSpec } from "./types"
import { buildBookingRegister } from "./builders/booking-register"
import { buildCertificateLogTemplate } from "./builders/certificate-log"
import { buildFinanceTrackerTemplate } from "./builders/finance-tracker"
import { buildLearnerProgressTemplate } from "./builders/learner-progress"
import { buildTrainingMatrix } from "./builders/training-matrix"
import { buildBusinessOverviewTemplate } from "./builders/business-overview"

export type ReportId =
  | "booking-register"
  | "certificate-log"
  | "finance-tracker"
  | "learner-progress"
  | "training-matrix"
  | "business-overview"

export interface ReportMeta {
  readonly id: ReportId
  readonly title: string
  readonly description: string
  /** Builds the blank styled template. */
  readonly template: () => WorkbookSpec
  /** Whether a live Supabase export is offered. */
  readonly live: boolean
}

export const REPORTS: ReadonlyArray<ReportMeta> = [
  {
    id: "booking-register",
    title: "Booking Register",
    description:
      "Track course bookings, learner numbers and balances. Totals calculate as you type.",
    template: buildBookingRegister,
    live: false,
  },
  {
    id: "certificate-log",
    title: "Certificate Log",
    description:
      "A full record of issued certificates with verification codes and expiry tracking.",
    template: buildCertificateLogTemplate,
    live: true,
  },
  {
    id: "finance-tracker",
    title: "Finance Tracker",
    description:
      "Income, expenses and a monthly profit dashboard, with VAT and running totals built in.",
    template: buildFinanceTrackerTemplate,
    live: true,
  },
  {
    id: "learner-progress",
    title: "Learner Progress",
    description:
      "Pre and post assessment scores, pass marks and certificate dates for every learner.",
    template: buildLearnerProgressTemplate,
    live: true,
  },
  {
    id: "training-matrix",
    title: "Training Matrix",
    description:
      "Staff compliance across mandatory courses, with current and overdue status at a glance.",
    template: buildTrainingMatrix,
    live: true,
  },
  {
    id: "business-overview",
    title: "Business Overview",
    description:
      "Monthly KPIs, a client list and a revenue forecast for board and management reporting.",
    template: buildBusinessOverviewTemplate,
    live: true,
  },
]
