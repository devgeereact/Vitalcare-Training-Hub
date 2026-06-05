/**
 * Single entry point that turns a WorkbookSpec into a downloaded .xlsx. ExcelJS
 * and file-saver are imported dynamically so the ~250 KB ExcelJS bundle lands in
 * its own lazy chunk, fetched only when an admin clicks Download.
 */
import type { WorkbookSpec } from "./types"

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export async function downloadWorkbook(spec: WorkbookSpec): Promise<void> {
  const [{ Workbook }, { saveAs }] = await Promise.all([
    import("exceljs"),
    import("file-saver"),
  ])

  const wb = new Workbook()
  wb.creator = spec.creator
  wb.created = new Date()

  for (const sheet of spec.sheets) {
    const ws = wb.addWorksheet(sheet.name)
    sheet.render(ws)
  }

  const buffer = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buffer], { type: XLSX_MIME }), spec.fileName)
}
