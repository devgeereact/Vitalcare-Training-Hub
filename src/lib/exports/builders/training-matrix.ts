/**
 * Training Matrix workbook. Template only — the app has no staff-compliance
 * table yet. Each course block carries Due/Completed/Status, where Status
 * computes "✓ Current", "⚠ Overdue" or "Pending" from the two dates.
 */
import type {
  ComplianceStatus,
  MatrixCell,
  StaffMatrix,
} from "@/lib/queries/compliance.queries"
import type { ColumnSpec, WorkbookSpec } from "../types"
import { sheet } from "../engine"
import { FMT_DATE } from "../theme"
import { toDate } from "../format"
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

// ---------------------------------------------------------------------------
// Live export — generalised to N mandatory courses
// ---------------------------------------------------------------------------

interface LiveMatrixRow {
  staff: string
  role: string
  cells: Record<string, MatrixCell>
}

const STATUS_LABEL: Record<ComplianceStatus, string> = {
  current: "✓ Current",
  due_soon: "◷ Due soon",
  overdue: "⚠ Overdue",
  not_recorded: "Pending",
}

function liveMatrixSheet(matrix: StaffMatrix) {
  const columns: ColumnSpec<LiveMatrixRow>[] = [
    { header: "Staff Name", width: 20, value: (r) => r.staff },
    { header: "Job Role", width: 22, value: (r) => r.role },
  ]
  for (const course of matrix.courses) {
    const id = course.courseId
    columns.push(
      {
        header: `${course.title} Completed`,
        width: 16,
        numFmt: FMT_DATE,
        value: (r) => toDate(r.cells[id]?.completedOn ?? null),
      },
      {
        header: `${course.title} Due`,
        width: 14,
        numFmt: FMT_DATE,
        value: (r) => toDate(r.cells[id]?.dueOn ?? null),
      },
      {
        header: `${course.title} Status`,
        width: 14,
        align: "center",
        value: (r) => {
          const status = r.cells[id]?.status ?? "not_recorded"
          return STATUS_LABEL[status]
        },
      },
    )
  }
  columns.push({
    header: "Overall Compliance",
    width: 18,
    align: "center",
    value: (r) =>
      matrix.courses.filter((c) => r.cells[c.courseId]?.status === "current")
        .length,
  })

  const rows: LiveMatrixRow[] = matrix.staff.map((s) => ({
    staff: s.name,
    role: s.role,
    cells: s.cells,
  }))

  return sheet<LiveMatrixRow>({
    name: "Matrix",
    templateRowCount: 12,
    rows,
    columns,
  })
}

interface LiveSummaryRow {
  title: string
  current: number
  dueSoon: number
  overdue: number
  pending: number
  total: number
}

function liveSummarySheet(matrix: StaffMatrix) {
  const rows: LiveSummaryRow[] = matrix.courses.map((c) => {
    let current = 0
    let dueSoon = 0
    let overdue = 0
    let pending = 0
    for (const s of matrix.staff) {
      const status = s.cells[c.courseId]?.status ?? "not_recorded"
      if (status === "current") current += 1
      else if (status === "due_soon") dueSoon += 1
      else if (status === "overdue") overdue += 1
      else pending += 1
    }
    return {
      title: c.title,
      current,
      dueSoon,
      overdue,
      pending,
      total: matrix.staff.length,
    }
  })
  return sheet<LiveSummaryRow>({
    name: "Summary",
    rows,
    columns: [
      { header: "Course", width: 24, value: (r) => r.title },
      { header: "Total Staff", width: 12, align: "center", value: (r) => r.total },
      { header: "Current", width: 12, align: "center", value: (r) => r.current },
      { header: "Due Soon", width: 12, align: "center", value: (r) => r.dueSoon },
      { header: "Overdue", width: 12, align: "center", value: (r) => r.overdue },
      { header: "Pending", width: 12, align: "center", value: (r) => r.pending },
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

export function buildTrainingMatrixLive(matrix: StaffMatrix): WorkbookSpec {
  // No mandatory courses configured yet: fall back to the styled template.
  if (matrix.courses.length === 0) return buildTrainingMatrix()
  return {
    fileName: "Vitalcare-Training-Matrix.xlsx",
    creator: CREATOR,
    sheets: [liveMatrixSheet(matrix), liveSummarySheet(matrix)],
  }
}
