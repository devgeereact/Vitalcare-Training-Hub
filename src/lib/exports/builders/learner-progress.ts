/**
 * Learner Progress workbook. Supports a blank template and a live export of the
 * learner roster. Pre-assessment scores, per-course results and certificate
 * numbers are not held against the roster, so those columns stay blank on a
 * live export; Pass/Fail and Expiry compute once a score or date is entered.
 */
import type { LearnerRow } from "@/lib/queries/learners.queries"
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE, FMT_PERCENT } from "../theme"
import { splitName, toDate } from "../format"
import { CREATOR, SUMMARY_COURSES } from "./shared"

interface ProgressRow {
  learnerId: string
  firstName: string
  lastName: string
  organisation: string | null
  email: string
  course: string | null
  date: Date | null
  preScore: number | null
  postScore: number | null
  certNumber: string | null
  certIssued: Date | null
}

interface SummaryRow {
  course: string
}

const PASS_FORMULA = { template: '=IF(I{r}="","",IF(I{r}>=75,"PASS","FAIL"))' }
const EXPIRY_FORMULA = {
  template: '=IF(G{r}="","",DATE(YEAR(G{r})+3,MONTH(G{r}),DAY(G{r})))',
}

function progressSheet(rows: ReadonlyArray<ProgressRow>) {
  return sheet<ProgressRow>({
    name: "Learner Progress",
    templateRowCount: 15,
    rows,
    columns: [
      { header: "Learner ID", width: 14, value: (r) => r.learnerId },
      { header: "First Name", width: 16, value: (r) => r.firstName },
      { header: "Last Name", width: 16, value: (r) => r.lastName },
      { header: "Organisation", width: 22, value: (r) => r.organisation },
      { header: "Email", width: 26, value: (r) => r.email },
      { header: "Course", width: 18, value: (r) => r.course },
      { header: "Date", width: 14, numFmt: FMT_DATE, value: (r) => r.date },
      { header: "Pre-Assessment %", width: 16, align: "center", value: (r) => r.preScore },
      { header: "Post-Assessment %", width: 16, align: "center", value: (r) => r.postScore },
      { header: "Pass/Fail", width: 12, align: "center", formula: PASS_FORMULA },
      { header: "Certificate Number", width: 20, value: (r) => r.certNumber },
      { header: "Certificate Issued", width: 16, numFmt: FMT_DATE, value: (r) => r.certIssued },
      { header: "Expiry Date", width: 14, numFmt: FMT_DATE, formula: EXPIRY_FORMULA },
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
        header: "Total Learners",
        width: 14,
        align: "center",
        value: (_r, i) => `=COUNTIF('Learner Progress'!F:F,A${i + 2})`,
      },
      {
        header: "Passed",
        width: 12,
        align: "center",
        value: (_r, i) =>
          `=COUNTIFS('Learner Progress'!F:F,A${i + 2},'Learner Progress'!J:J,"PASS")`,
      },
      {
        header: "Failed",
        width: 12,
        align: "center",
        value: (_r, i) => `=B${i + 2}-C${i + 2}`,
      },
      {
        header: "Pass Rate %",
        width: 14,
        align: "center",
        numFmt: FMT_PERCENT,
        value: (_r, i) => `=IFERROR(C${i + 2}/B${i + 2},0)`,
      },
      {
        header: "Avg Post-Score %",
        width: 16,
        align: "center",
        value: (_r, i) =>
          `=IFERROR(AVERAGEIF('Learner Progress'!F:F,A${i + 2},'Learner Progress'!I:I),0)`,
      },
    ],
  })
}

function workbook(rows: ReadonlyArray<ProgressRow>): WorkbookSpec {
  return {
    fileName: "Vitalcare-Learner-Progress.xlsx",
    creator: CREATOR,
    sheets: [progressSheet(rows), summarySheet()],
  }
}

export function buildLearnerProgressTemplate(): WorkbookSpec {
  return workbook([])
}

export function buildLearnerProgressLive(
  learners: ReadonlyArray<LearnerRow>,
): WorkbookSpec {
  const rows: ProgressRow[] = learners.map((l) => {
    const { first, last } = splitName(l.name)
    return {
      learnerId: l.id.slice(0, 8),
      firstName: first,
      lastName: last,
      organisation: null,
      email: l.email,
      course: null,
      date: toDate(l.joined),
      preScore: null,
      postScore: null,
      certNumber: null,
      certIssued: null,
    }
  })
  return workbook(rows)
}
