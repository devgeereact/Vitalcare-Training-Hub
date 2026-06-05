/**
 * Booking Register workbook. Template only — there is no booking table in the
 * app yet, so this ships as a faithful blank styled register.
 */
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_MONEY } from "../theme"
import {
  CONFIRMATION,
  CREATOR,
  MONTHS_2026,
  PAYMENT_STATUSES,
} from "./shared"

interface BookingRow {
  ref: string
}

interface CalendarRow {
  month: string
}

export function buildBookingRegister(): WorkbookSpec {
  const bookings = sheet<BookingRow>({
    name: "Bookings",
    templateRowCount: 14,
    rows: [],
    columns: [
      { header: "Booking Ref", width: 14 },
      { header: "Date Booked", width: 14, numFmt: FMT_DATE },
      { header: "Client Name", width: 26 },
      { header: "Organisation", width: 24 },
      { header: "Course Code", width: 13 },
      { header: "Course Date", width: 14, numFmt: FMT_DATE },
      { header: "Venue", width: 22 },
      { header: "Learners Booked", width: 14, align: "center" },
      { header: "Price Per Head (£)", width: 16, numFmt: FMT_MONEY, align: "right" },
      {
        header: "Total Value (£)",
        width: 15,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=H{r}*I{r}" },
      },
      { header: "Deposit Paid (£)", width: 15, numFmt: FMT_MONEY, align: "right" },
      {
        header: "Balance Due (£)",
        width: 15,
        numFmt: FMT_MONEY,
        align: "right",
        formula: { template: "=J{r}-K{r}" },
      },
      { header: "Payment Status", width: 16, dropdown: PAYMENT_STATUSES },
      { header: "Confirmation Sent", width: 16, dropdown: CONFIRMATION },
      { header: "Notes", width: 28 },
    ],
  })

  const calendar = sheet<CalendarRow>({
    name: "Calendar View",
    rows: MONTHS_2026.map((month) => ({ month })),
    columns: [
      { header: "Month", width: 18, value: (r) => r.month },
      { header: "Courses Scheduled", width: 18, align: "center" },
      { header: "Total Learners", width: 16, align: "center" },
      {
        header: "Projected Revenue (£)",
        width: 20,
        numFmt: FMT_MONEY,
        align: "right",
      },
    ],
  })

  return {
    fileName: "Vitalcare-Booking-Register.xlsx",
    creator: CREATOR,
    sheets: [bookings, calendar],
  }
}
