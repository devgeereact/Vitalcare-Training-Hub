// Headless verification: render every workbook builder, write to /tmp, reopen
// with ExcelJS and assert styling, formulas and number formats actually emit.
import ExcelJS from "exceljs"
import { buildBookingRegister } from "../src/lib/exports/builders/booking-register.ts"
import { buildCertificateLogTemplate, buildCertificateLogLive } from "../src/lib/exports/builders/certificate-log.ts"
import { buildFinanceTrackerTemplate, buildFinanceTrackerLive } from "../src/lib/exports/builders/finance-tracker.ts"
import { buildLearnerProgressTemplate } from "../src/lib/exports/builders/learner-progress.ts"
import { buildTrainingMatrix, buildTrainingMatrixLive } from "../src/lib/exports/builders/training-matrix.ts"
import { buildBusinessOverviewTemplate } from "../src/lib/exports/builders/business-overview.ts"

function renderSpec(spec) {
  const wb = new ExcelJS.Workbook()
  wb.creator = spec.creator
  for (const s of spec.sheets) s.render(wb.addWorksheet(s.name))
  return wb
}

let failures = 0
function check(label, cond) {
  if (!cond) { failures++; console.log("  ✗", label) }
  else console.log("  ✓", label)
}

const specs = [
  buildBookingRegister(),
  buildCertificateLogTemplate(),
  buildFinanceTrackerTemplate(),
  buildLearnerProgressTemplate(),
  buildTrainingMatrix(),
  buildBusinessOverviewTemplate(),
  buildCertificateLogLive([
    { id: "abc12345-x", learnerId: "l1", learnerName: "Sarah Okonkwo",
      organisation: "Greenfield Care Ltd", certificateNumber: "VC-CERT-2026-0001",
      courseTitle: "BLS", cpdHours: 6, issuedAt: "2026-01-15T00:00:00Z", expiresAt: null,
      verificationUuid: "OHGI1JNY", status: "active", daysToExpiry: 900 },
  ]),
  buildFinanceTrackerLive([
    { id: "i1", number: "VC-INV-001", recipient_id: null, recipient_name: "Greenfield Care Ltd",
      recipient_email: null, items: [{ description: "BLS", quantity: 6, unit_pence: 9500 }],
      total_pence: 57000, status: "paid", due_date: null, notes: null, issued_by: null,
      created_at: "2026-01-15T00:00:00Z", paid_at: null },
  ]),
]

for (const spec of specs) {
  console.log("\n# " + spec.fileName)
  const wb = renderSpec(spec)
  // Round-trip through a buffer to mimic the real download path.
  const buf = await wb.xlsx.writeBuffer()
  const reopened = new ExcelJS.Workbook()
  await reopened.xlsx.load(buf)
  const ws = reopened.worksheets[0]
  const h1 = ws.getRow(1).getCell(1)
  check("header navy fill", h1.fill?.fgColor?.argb === "FF1b2e6b")
  check("header white bold", h1.font?.bold === true && h1.font?.color?.argb === "FFFFFFFF")
  check("freeze row 1", ws.views?.[0]?.ySplit === 1)
}

// Targeted formula + value assertions.
console.log("\n# targeted assertions")
{
  const wb = renderSpec(buildFinanceTrackerTemplate())
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const income = re.getWorksheet("Income")
  check("Income G2 formula =E2*F2", income.getRow(2).getCell(7).value?.formula === "E2*F2")
  check("Income H2 VAT =G2*0.2", income.getRow(2).getCell(8).value?.formula === "G2*0.2")
  // Totals row sits after 12 template rows -> row 14.
  check("TOTALS label row 14", income.getRow(14).getCell(1).value === "TOTALS")
  check("SUM formula stamped {last}=13", income.getRow(14).getCell(7).value?.formula === "SUM(G2:G13)")
}
{
  const wb = renderSpec(buildFinanceTrackerLive([
    { id: "i1", number: "VC-INV-001", recipient_id: null, recipient_name: "Greenfield Care Ltd",
      recipient_email: null, items: [{ description: "BLS", quantity: 6, unit_pence: 9500 }],
      total_pence: 57000, status: "paid", due_date: null, notes: null, issued_by: null,
      created_at: "2026-01-15T00:00:00Z", paid_at: null }]))
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const income = re.getWorksheet("Income")
  check("live Total pounds = 570 (pence/100)", income.getRow(2).getCell(7).value === 570)
  check("live VAT still formula =G2*0.2", income.getRow(2).getCell(8).value?.formula === "G2*0.2")
}
{
  const wb = renderSpec(buildCertificateLogTemplate())
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const log = re.getWorksheet("Certificate Log")
  check("Cert expiry guarded formula", String(log.getRow(2).getCell(8).value?.formula).startsWith('IF(B2="","",DATE'))
  const sum = re.getWorksheet("Summary")
  check("Summary COUNTIF cross-sheet quoted", String(sum.getRow(2).getCell(2).value?.formula).includes("'Certificate Log'!E:E"))
}
{
  const wb = renderSpec(buildCertificateLogLive([
    { id: "abc12345-x", learnerId: "l1", learnerName: "Sarah Okonkwo",
      organisation: "Greenfield Care Ltd", certificateNumber: "VC-CERT-2026-0001",
      courseTitle: "BLS", cpdHours: 6, issuedAt: "2026-01-15T00:00:00Z", expiresAt: null,
      verificationUuid: "OHGI1JNY", status: "active", daysToExpiry: 900 }]))
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const log = re.getWorksheet("Certificate Log")
  check("live cert number in A2", log.getRow(2).getCell(1).value === "VC-CERT-2026-0001")
  check("live organisation in D2", log.getRow(2).getCell(4).value === "Greenfield Care Ltd")
}
{
  const wb = renderSpec(buildTrainingMatrix())
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const m = re.getWorksheet("Matrix")
  check("Matrix BLS status AND formula", String(m.getRow(2).getCell(5).value?.formula).startsWith('IF(AND(C2<>""'))
}

{
  const matrix = {
    courses: [
      { courseId: "c-bls", title: "BLS", renewalMonths: 12 },
      { courseId: "c-ipc", title: "IPC", renewalMonths: 12 },
    ],
    staff: [
      { id: "s1", name: "Sarah Okonkwo", role: "trainer", cells: {
        "c-bls": { completedOn: "2026-01-10", dueOn: "2027-01-10", status: "current" },
        "c-ipc": { completedOn: "2024-01-10", dueOn: "2025-01-10", status: "overdue" },
      } },
    ],
  }
  const wb = renderSpec(buildTrainingMatrixLive(matrix))
  const buf = await wb.xlsx.writeBuffer()
  const re = new ExcelJS.Workbook(); await re.xlsx.load(buf)
  const m = re.getWorksheet("Matrix")
  check("live matrix header generalised (BLS Completed)", m.getRow(1).getCell(3).value === "BLS Completed")
  check("live matrix BLS status value Current", m.getRow(2).getCell(5).value === "✓ Current")
  check("live matrix IPC status value Overdue", m.getRow(2).getCell(8).value === "⚠ Overdue")
  check("live matrix overall compliance count = 1", m.getRow(2).getCell(9).value === 1)
  check("live matrix header navy fill", m.getRow(1).getCell(1).fill?.fgColor?.argb === "FF1b2e6b")
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
