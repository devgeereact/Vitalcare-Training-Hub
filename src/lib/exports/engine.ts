/**
 * Renders a declarative SheetSpec onto an ExcelJS worksheet: navy header, body
 * rows (values or per-row formulas), gold totals row, freeze pane, column
 * widths, and dropdowns. Pure with respect to data; it never fetches anything.
 */
import type { Cell, Worksheet } from "exceljs"
import type { CellValue, SheetRenderer, SheetSpec } from "./types"
import { styleBodyCell, styleHeaderCell, styleTotalsCell } from "./theme"

const DEFAULT_TEMPLATE_ROWS = 12

/** Replace `{r}` with the row number and drop a leading "=" (ExcelJS formula
 *  values omit the equals sign). */
function stampRow(template: string, rowNum: number): string {
  return template.replace(/\{r\}/g, String(rowNum)).replace(/^=/, "")
}

function stampLast(template: string, last: number): string {
  return template.replace(/\{last\}/g, String(last)).replace(/^=/, "")
}

/** Assign a value to a cell. A string starting with "=" becomes a formula. */
function setCellValue(cell: Cell, value: CellValue): void {
  if (value === null) return
  if (typeof value === "string" && value.startsWith("=")) {
    cell.value = { formula: value.slice(1) }
    return
  }
  cell.value = value
}

/** Build a renderer for one sheet. The Row generic is captured here so a
 *  workbook can hold sheets with different row shapes. */
export function sheet<Row>(spec: SheetSpec<Row>): SheetRenderer {
  return { name: spec.name, render: (ws) => renderSheet(ws, spec) }
}

function renderSheet<Row>(ws: Worksheet, spec: SheetSpec<Row>): void {
  // Column widths.
  spec.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width
  })

  // Header row.
  const header = ws.getRow(1)
  spec.columns.forEach((col, i) => {
    const cell = header.getCell(i + 1)
    cell.value = col.header
    styleHeaderCell(cell)
  })
  header.height = 20

  // Freeze the header row.
  ws.views = [{ state: "frozen", ySplit: 1 }]

  const hasData = spec.rows.length > 0
  const bodyCount = hasData
    ? spec.rows.length
    : spec.templateRowCount ?? DEFAULT_TEMPLATE_ROWS

  for (let r = 0; r < bodyCount; r++) {
    const rowNum = r + 2
    const row = ws.getRow(rowNum)
    spec.columns.forEach((col, i) => {
      const cell = row.getCell(i + 1)
      styleBodyCell(cell, col.align)

      if (hasData) {
        const value = col.value ? col.value(spec.rows[r], r) : null
        if (value !== null) {
          setCellValue(cell, value)
        } else if (col.formula) {
          cell.value = { formula: stampRow(col.formula.template, rowNum) }
        }
      } else if (col.formula) {
        cell.value = { formula: stampRow(col.formula.template, rowNum) }
      }

      if (col.numFmt) cell.numFmt = col.numFmt
      if (col.dropdown && col.dropdown.length > 0) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${col.dropdown.join(",")}"`],
        }
      }
    })
  }

  // Gold totals row.
  if (spec.totals && spec.totals.length > 0) {
    const lastDataRow = bodyCount + 1
    const totalsRowNum = bodyCount + 2
    const row = ws.getRow(totalsRowNum)
    spec.columns.forEach((_, i) => styleTotalsCell(row.getCell(i + 1)))
    for (const t of spec.totals) {
      const cell = row.getCell(t.col + 1)
      if (t.text !== undefined) {
        cell.value = t.text
      } else if (t.formula) {
        cell.value = { formula: stampLast(t.formula, lastDataRow) }
      }
      if (t.numFmt) cell.numFmt = t.numFmt
    }
  }
}
