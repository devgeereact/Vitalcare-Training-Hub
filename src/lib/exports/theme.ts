/**
 * Brand styling for generated workbooks. ExcelJS needs ARGB colours (eight hex
 * digits, alpha first), so the brand hex values are prefixed with "FF". Passing
 * a raw "#1b2e6b" silently produces no fill.
 */
import type { Borders, Cell, Fill, Font } from "exceljs"
import { BRAND } from "@/lib/constants"

const NAVY_ARGB = `FF${BRAND.navy.slice(1)}`
const GOLD_ARGB = `FF${BRAND.gold.slice(1)}`
const BORDER_ARGB = "FFE2E8F0"

/** Number formats matching the original Vitalcare workbooks. */
export const FMT_MONEY = "#,##0.00"
export const FMT_DATE = "dd/mm/yyyy"
export const FMT_PERCENT = "0%"

const HEADER_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: NAVY_ARGB },
}
const HEADER_FONT: Font = {
  name: "Arial",
  size: 11,
  bold: true,
  color: { argb: "FFFFFFFF" },
}
const GOLD_FILL: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: GOLD_ARGB },
}
const GOLD_FONT: Font = { name: "Arial", size: 11, bold: true }
const BODY_FONT: Font = { name: "Arial", size: 11 }

function thinBorder(): Partial<Borders> {
  const side = { style: "thin" as const, color: { argb: BORDER_ARGB } }
  return { top: side, left: side, bottom: side, right: side }
}

/** Navy fill, white bold Arial, used on row 1 of every sheet. */
export function styleHeaderCell(cell: Cell): void {
  cell.fill = HEADER_FILL
  cell.font = HEADER_FONT
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false }
  cell.border = thinBorder()
}

/** Gold fill, bold, used on the TOTALS row. */
export function styleTotalsCell(cell: Cell): void {
  cell.fill = GOLD_FILL
  cell.font = GOLD_FONT
  cell.border = thinBorder()
}

/** Light border + Arial body font for a fillable data cell. */
export function styleBodyCell(cell: Cell, align?: "left" | "center" | "right"): void {
  cell.font = BODY_FONT
  cell.alignment = { vertical: "middle", horizontal: align ?? "left" }
  cell.border = thinBorder()
}
