/**
 * Branded workbook spec types.
 *
 * A workbook is described declaratively (sheets, columns, formulas, totals) and
 * rendered to a styled .xlsx by the engine. Specs hold no ExcelJS runtime, so
 * builders stay free of the heavy dependency; only the download entry point
 * lazy-imports ExcelJS.
 */
import type { Worksheet } from "exceljs"

/** A value that can sit in a cell. A string beginning with "=" is treated as a
 *  formula by the engine, which lets a `value` function emit per-row formulas. */
export type CellValue = string | number | boolean | Date | null

/** A formula stamped once per data row. `{r}` becomes the worksheet row number
 *  (e.g. "=H{r}*I{r}" -> "=H2*I2"). */
export interface FormulaTemplate {
  readonly template: string
}

export interface ColumnSpec<Row> {
  readonly header: string
  /** Excel column width units. */
  readonly width: number
  /** e.g. "#,##0.00", "dd/mm/yyyy", "0%". */
  readonly numFmt?: string
  readonly align?: "left" | "center" | "right"
  /** Maps a data row to a cell value. Return null to leave the cell blank (the
   *  engine then falls back to `formula` if present). */
  readonly value?: (row: Row, index: number) => CellValue
  /** Per-row formula. Used for blank templates, and as a fallback when `value`
   *  returns null. */
  readonly formula?: FormulaTemplate
  /** Picklist applied to body cells via data validation. */
  readonly dropdown?: readonly string[]
}

export interface TotalsCellSpec {
  /** 0-based column index this cell sits under. */
  readonly col: number
  /** "=SUM(G2:G{last})" — `{last}` becomes the final data row number. */
  readonly formula?: string
  /** Literal label, e.g. "TOTALS". */
  readonly text?: string
  readonly numFmt?: string
}

export interface SheetSpec<Row> {
  /** Tab name. Excel caps this at 31 characters. */
  readonly name: string
  readonly columns: ReadonlyArray<ColumnSpec<Row>>
  /** Data rows. Empty array renders a blank styled template. */
  readonly rows: ReadonlyArray<Row>
  /** Gold totals row appended after the data. */
  readonly totals?: ReadonlyArray<TotalsCellSpec>
  /** Blank styled rows emitted when `rows` is empty. Default 12. */
  readonly templateRowCount?: number
}

/** A sheet ready to render onto a worksheet. The generic Row type is captured
 *  inside the closure so the workbook can hold sheets of mixed row types. */
export interface SheetRenderer {
  readonly name: string
  readonly render: (ws: Worksheet) => void
}

export interface WorkbookSpec {
  readonly fileName: string
  readonly creator: string
  readonly sheets: ReadonlyArray<SheetRenderer>
}
