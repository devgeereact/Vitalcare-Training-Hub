/**
 * Training Matrix workbook. Template only — the app has no staff-compliance
 * table yet. Each course block carries Due/Completed/Status, where Status
 * computes "✓ Current", "⚠ Overdue" or "Pending" from the two dates.
 */
import type { WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE } from "../theme"
import { CREATOR, JOB_ROLES } from "./shared"

interface MatrixRow {
  staff?: string
}

interface SummaryRow {
  course: string
  /** Matrix column letter holding this course's Status. */
  col: string
}

/** Status formula for a course block, given its Due/Completed column letters. */
function statusFormula(due: string, done: string) {
  return {
    template:
      `=IF(AND(${due}{r}<>"",${done}{r}<>""),` +
      `IF(${done}{r}>=${due}{r},"✓ Current","⚠ Overdue"),"Pending")`,
  }
}

function matrixSheet() {
  return sheet<MatrixRow>({
    name: "Matrix",
    templateRowCount: 12,
    rows: [],
    columns: [
      { header: "Staff Name", width: 20 },
      { header: "Job Role", width: 22, dropdown: JOB_ROLES },
      { header: "BLS Due", width: 13, numFmt: FMT_DATE },
      { header: "BLS Completed", width: 15, numFmt: FMT_DATE },
      { header: "BLS Status", width: 14, align: "center", formula: statusFormula("C", "D") },
      { header: "IPC Due", width: 13, numFmt: FMT_DATE },
      { header: "IPC Completed", width: 15, numFmt: FMT_DATE },
      { header: "IPC Status", width: 14, align: "center", formula: statusFormula("F", "G") },
      { header: "Manual Handling Due", width: 18, numFmt: FMT_DATE },
      { header: "MH Completed", width: 15, numFmt: FMT_DATE },
      { header: "MH Status", width: 14, align: "center", formula: statusFormula("I", "J") },
      { header: "Safeguarding Due", width: 16, numFmt: FMT_DATE },
      { header: "SA Completed", width: 15, numFmt: FMT_DATE },
      { header: "SA Status", width: 14, align: "center", formula: statusFormula("L", "M") },
      {
        header: "Overall Compliance",
        width: 18,
        align: "center",
        formula: {
          template:
            '=COUNTIF(E{r},"✓ Current")+COUNTIF(H{r},"✓ Current")' +
            '+COUNTIF(K{r},"✓ Current")+COUNTIF(N{r},"✓ Current")',
        },
      },
    ],
  })
}

function summarySheet() {
  const rows: SummaryRow[] = [
    { course: "Basic Life Support (BLS)", col: "E" },
    { course: "Infection Prevention (IPC)", col: "H" },
    { course: "Manual Handling", col: "K" },
    { course: "Safeguarding Adults", col: "N" },
  ]
  return sheet<SummaryRow>({
    name: "Summary",
    rows,
    columns: [
      { header: "Course", width: 24, value: (r) => r.course },
      {
        header: "Total Staff",
        width: 12,
        align: "center",
        value: () => "=COUNTA(Matrix!A:A)-1",
      },
      {
        header: "Current",
        width: 12,
        align: "center",
        value: (r) => `=COUNTIF(Matrix!${r.col}:${r.col},"✓ Current")`,
      },
      {
        header: "Overdue",
        width: 12,
        align: "center",
        value: (r) => `=COUNTIF(Matrix!${r.col}:${r.col},"⚠ Overdue")`,
      },
      {
        header: "Pending",
        width: 12,
        align: "center",
        value: (_r, i) => `=B${i + 2}-C${i + 2}-D${i + 2}`,
      },
      {
        header: "Compliance %",
        width: 14,
        align: "center",
        numFmt: "0%",
        value: (_r, i) => `=IFERROR(C${i + 2}/B${i + 2},0)`,
      },
    ],
  })
}

export function buildTrainingMatrix(): WorkbookSpec {
  return {
    fileName: "Vitalcare-Training-Matrix.xlsx",
    creator: CREATOR,
    sheets: [matrixSheet(), summarySheet()],
  }
}
