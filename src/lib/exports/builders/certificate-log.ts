/**
 * Certificate Log workbook. Supports a blank template and a live export from
 * learner_certificates. Certificate Number, Organisation, Trainer and Course
 * Date are not stored against certificates, so those columns stay blank on a
 * live export.
 */
import type { CertRow } from "@/lib/queries/certificates.queries"
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE } from "../theme"
import { toDate } from "../format"
import { CERT_STATUSES, CREATOR, SUMMARY_COURSES, TRAINERS } from "./shared"

interface CertLogRow {
  certNumber: string | null
  issueDate: Date | null
  learner: string
  organisation: string | null
  course: string
  courseDate: Date | null
  trainer: string | null
  expiry: Date | null
  verification: string
  status: string
}

interface SummaryRow {
  course: string
}

const EXPIRY_FORMULA = {
  template: '=IF(B{r}="","",DATE(YEAR(B{r})+3,MONTH(B{r}),DAY(B{r})))',
}

function logSheet(rows: ReadonlyArray<CertLogRow>) {
  return sheet<CertLogRow>({
    name: "Certificate Log",
    templateRowCount: 16,
    rows,
    columns: [
      { header: "Certificate Number", width: 20, value: (r) => r.certNumber },
      { header: "Issue Date", width: 14, numFmt: FMT_DATE, value: (r) => r.issueDate },
      { header: "Learner Name", width: 22, value: (r) => r.learner },
      { header: "Organisation", width: 22, value: (r) => r.organisation },
      { header: "Course", width: 18, value: (r) => r.course },
      { header: "Course Date", width: 14, numFmt: FMT_DATE, value: (r) => r.courseDate },
      { header: "Trainer", width: 22, dropdown: TRAINERS, value: (r) => r.trainer },
      {
        header: "Expiry Date",
        width: 14,
        numFmt: FMT_DATE,
        value: (r) => r.expiry,
        formula: EXPIRY_FORMULA,
      },
      { header: "Verification Code", width: 18, value: (r) => r.verification },
      { header: "Status", width: 12, dropdown: CERT_STATUSES, value: (r) => r.status },
    ],
  })
}

function summarySheet() {
  return sheet<SummaryRow>({
    name: "Summary",
    rows: SUMMARY_COURSES.map((course) => ({ course })),
    columns: [
      { header: "Course", width: 20, value: (r) => r.course },
      {
        header: "Total Issued",
        width: 14,
        align: "center",
        value: (_r, i) => `=COUNTIF('Certificate Log'!E:E,A${i + 2})`,
      },
      {
        header: "Active",
        width: 12,
        align: "center",
        value: (_r, i) =>
          `=COUNTIFS('Certificate Log'!E:E,A${i + 2},'Certificate Log'!J:J,"Active")`,
      },
      {
        header: "Expired",
        width: 12,
        align: "center",
        value: (_r, i) =>
          `=COUNTIFS('Certificate Log'!E:E,A${i + 2},'Certificate Log'!J:J,"Expired")`,
      },
      {
        header: "Revoked",
        width: 12,
        align: "center",
        value: (_r, i) =>
          `=COUNTIFS('Certificate Log'!E:E,A${i + 2},'Certificate Log'!J:J,"Revoked")`,
      },
    ],
  })
}

function workbook(rows: ReadonlyArray<CertLogRow>): WorkbookSpec {
  return {
    fileName: "Vitalcare-Certificate-Log.xlsx",
    creator: CREATOR,
    sheets: [logSheet(rows), summarySheet()],
  }
}

export function buildCertificateLogTemplate(): WorkbookSpec {
  return workbook([])
}

/** Map a certificate status to the workbook's Status picklist. */
function statusLabel(status: CertRow["status"]): string {
  return status === "expired" ? "Expired" : "Active"
}

export function buildCertificateLogLive(certs: ReadonlyArray<CertRow>): WorkbookSpec {
  const rows: CertLogRow[] = certs.map((c) => ({
    certNumber: null,
    issueDate: toDate(c.issuedAt),
    learner: c.learnerName,
    organisation: null,
    course: c.courseTitle,
    courseDate: null,
    trainer: null,
    expiry: toDate(c.expiresAt),
    verification: c.verificationUuid,
    status: statusLabel(c.status),
  }))
  return workbook(rows)
}
