import jsPDF from "jspdf"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { QRCodeSVG } from "qrcode.react"
import { COMPANY, BRAND, LEADERSHIP, LOGOS } from "@/lib/constants"

export interface CertificatePdfData {
  learnerName: string
  courseTitle: string
  /**
   * Retained for call-site stability. No longer rendered on the certificate.
   * @deprecated CPD hours were removed from the certificate face.
   */
  cpdHours?: number
  issuedAt: string
  /** Optional expiry. When present, shown alongside the issue date. */
  expiresAt?: string | null
  verificationUuid: string
  signatoryName?: string
  signatoryRole?: string
  /** Optional template-driven section copy. Falls back to defaults. */
  titleText?: string
  introText?: string
  completionText?: string
  accreditationLine?: string
  footerText?: string
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Derive a short, human-friendly verification reference from the UUID. The
 * short form (VC-XXXX) is printed alongside the full UUID. Same input always
 * yields the same reference, so it stays stable for a given certificate.
 */
export function certVerificationRef(uuid: string): { short: string; full: string } {
  const clean = uuid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  const tail = clean.slice(-4).padStart(4, "0")
  return { short: `VC-${tail}`, full: uuid }
}

/**
 * The public verification URL encoded in the certificate QR code. Scanning it
 * opens the verify page pre-filled with this certificate's identifier.
 */
export function certVerifyUrl(uuid: string): string {
  return `https://${COMPANY.website}/verify?id=${uuid}`
}

/**
 * Rasterise the verification QR code to a PNG data URL for embedding in the
 * jsPDF certificate. The same QRCodeSVG component renders on screen, so the
 * printed and on-screen QR codes are identical. Browser-only (uses Image and
 * canvas); the certificate is always generated client-side.
 */
export async function certQrPngDataUrl(uuid: string, sizePx = 256): Promise<string> {
  const [nr, ng, nb] = rgb(BRAND.navy)
  const fg = `rgb(${nr},${ng},${nb})`
  const svg = renderToStaticMarkup(
    createElement(QRCodeSVG, {
      value: certVerifyUrl(uuid),
      size: sizePx,
      level: "M",
      bgColor: "#ffffff",
      fgColor: fg,
      marginSize: 2,
    }),
  )
  return svgStringToPng(svg, sizePx, "#ffffff")
}

/** Load an image source, rejecting if it fails to decode. */
function loadImage(src: string, w: number, h: number): Promise<HTMLImageElement> {
  const img = new Image()
  img.width = w
  img.height = h
  const done = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
  })
  img.src = src
  return done
}

/**
 * Rasterise an inline SVG string to a PNG data URL at the given square size.
 * `bg` is optional; omit to keep transparency (used for the seal so its ribbon
 * tails do not sit on a white box).
 */
async function svgStringToPng(
  svg: string,
  sizePx: number,
  bg?: string,
): Promise<string> {
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = await loadImage(svgUrl, sizePx, sizePx)
  const canvas = document.createElement("canvas")
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, sizePx, sizePx)
  }
  ctx.drawImage(img, 0, 0, sizePx, sizePx)
  return canvas.toDataURL("image/png")
}

/** Rasterise a same-origin image URL (the round logo SVG) to a PNG data URL. */
async function urlToPng(url: string, sizePx = 256): Promise<string> {
  const img = await loadImage(url, sizePx, sizePx)
  const canvas = document.createElement("canvas")
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  ctx.drawImage(img, 0, 0, sizePx, sizePx)
  return canvas.toDataURL("image/png")
}

/**
 * The gold medallion seal as an SVG string, matching the on-screen GoldSeal in
 * CertificatePreview so the printed and previewed seals are the same.
 */
function sealSvgMarkup(): string {
  const teeth = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const cx = (60 + Math.cos(a) * 54.5).toFixed(2)
    const cy = (60 + Math.sin(a) * 54.5).toFixed(2)
    return `<circle cx="${cx}" cy="${cy}" r="2.4" fill="#c79a38"/>`
  }).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <radialGradient id="sf" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stop-color="#e8c26a"/>
        <stop offset="55%" stop-color="#d4a843"/>
        <stop offset="100%" stop-color="#a9842f"/>
      </radialGradient>
      <linearGradient id="sr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#22387f"/>
        <stop offset="100%" stop-color="#142054"/>
      </linearGradient>
    </defs>
    <path d="M44 96 L34 118 L48 110 L52 120 L60 98 Z" fill="url(#sr)"/>
    <path d="M76 96 L86 118 L72 110 L68 120 L60 98 Z" fill="url(#sr)"/>
    ${teeth}
    <circle cx="60" cy="60" r="52" fill="url(#sf)"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="#fff6e0" stroke-opacity="0.55" stroke-width="0.8"/>
    <circle cx="60" cy="60" r="40" fill="none" stroke="#8c6b22" stroke-width="0.5" stroke-dasharray="1 2"/>
    <circle cx="60" cy="60" r="35" fill="none" stroke="#fff6e0" stroke-opacity="0.6" stroke-width="0.7"/>
    <text x="60" y="58" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#142054">VC</text>
    <text x="60" y="78" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="6.5" letter-spacing="1.5" fill="#142054" fill-opacity="0.85">VERIFIED</text>
  </svg>`
}

/** RGB triplet for a hex colour, used by jsPDF's numeric draw/text setters. */
function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/** Draw a decorative corner flourish anchored at (x, y) towards (sx, sy). */
function drawCorner(doc: jsPDF, x: number, y: number, sx: number, sy: number): void {
  const [gr, gg, gb] = rgb(BRAND.gold)
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.7)
  doc.line(x, y, x + 16 * sx, y)
  doc.line(x, y, x, y + 16 * sy)
  doc.setFillColor(gr, gg, gb)
  doc.circle(x + 4 * sx, y + 4 * sy, 0.9, "F")
}

/** Generate and download an A4-landscape Vitalcare certificate. */
export async function downloadCertificatePdf(data: CertificatePdfData): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297
  const H = 210
  const [nr, ng, nb] = rgb(BRAND.navy)
  const [gr, gg, gb] = rgb(BRAND.gold)

  // Warm paper tint.
  doc.setFillColor(253, 252, 247)
  doc.rect(0, 0, W, H, "F")

  // Outer gold frame.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(2.2)
  doc.rect(9, 9, W - 18, H - 18)
  // Thin navy keyline.
  doc.setDrawColor(nr, ng, nb)
  doc.setLineWidth(0.5)
  doc.rect(13, 13, W - 26, H - 26)
  // Hairline gold inner rule.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.3)
  doc.rect(15, 15, W - 30, H - 30)

  // Corner flourishes (inside the frame).
  drawCorner(doc, 19, 19, 1, 1)
  drawCorner(doc, W - 19, 19, -1, 1)
  drawCorner(doc, 19, H - 19, 1, -1)
  drawCorner(doc, W - 19, H - 19, -1, -1)

  // Crest: the round Vitalcare logo, top centre (matches the on-screen
  // preview). If it fails to rasterise the certificate still renders.
  const logoSize = 16
  try {
    const logoPng = await urlToPng(LOGOS.roundNavy, 256)
    doc.addImage(logoPng, "PNG", W / 2 - logoSize / 2, 18, logoSize, logoSize)
  } catch (err) {
    console.error("[downloadCertificatePdf:logo]", err)
  }

  // Heading.
  doc.setTextColor(nr, ng, nb)
  doc.setFont("times", "normal")
  doc.setFontSize(32)
  doc.text(data.titleText?.trim() || "Certificate of Completion", W / 2, 48, {
    align: "center",
  })

  // Gold divider under the title.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.6)
  doc.line(W / 2 - 26, 53, W / 2 - 4, 53)
  doc.line(W / 2 + 4, 53, W / 2 + 26, 53)
  doc.setFillColor(gr, gg, gb)
  doc.rect(W / 2 - 1.3, 51.7, 2.6, 2.6, "F")

  // Recital: intro line.
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  doc.text(
    (data.introText?.trim() || "This is to certify that").toUpperCase(),
    W / 2,
    62,
    { align: "center", charSpace: 1.4 },
  )

  // Learner name (hero).
  doc.setFont("times", "bold")
  doc.setFontSize(38)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.learnerName, W / 2, 80, { align: "center" })

  // Gold underline beneath the name.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.8)
  doc.line(W / 2 - 55, 86, W / 2 + 55, 86)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  doc.text(
    (data.completionText?.trim() || "has successfully completed").toUpperCase(),
    W / 2,
    99,
    { align: "center", charSpace: 1.4 },
  )

  doc.setFont("times", "bold")
  doc.setFontSize(20)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.courseTitle, W / 2, 112, { align: "center", maxWidth: W - 90 })

  // Issue date line (no CPD hours).
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(110, 110, 110)
  // ASCII separators dodge jsPDF's limited Unicode handling in standard fonts.
  const metaParts = [`Issued ${fmt(data.issuedAt)}`]
  if (data.expiresAt) metaParts.push(`Valid to ${fmt(data.expiresAt)}`)
  doc.text(metaParts.join("   -   "), W / 2, 124, { align: "center" })

  // Accreditation line.
  doc.setFontSize(9)
  doc.setTextColor(nr, ng, nb)
  doc.text(
    data.accreditationLine?.trim() ||
      "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify",
    W / 2,
    130,
    { align: "center" },
  )

  // Central seal, rasterised from the same SVG used on screen so the printed
  // and previewed medallions match. 30mm square places the circle centre at
  // y158, with the ribbon tails below.
  const sealSize = 30
  try {
    const sealPng = await svgStringToPng(sealSvgMarkup(), 320)
    doc.addImage(sealPng, "PNG", W / 2 - sealSize / 2, 143, sealSize, sealSize)
  } catch (err) {
    console.error("[downloadCertificatePdf:seal]", err)
  }

  // Signatory (left). The on-screen preview renders the name in the Dancing
  // Script cursive webfont. jsPDF cannot easily embed that font, so the PDF
  // uses Times italic as the closest available pen-signature approximation.
  const signName = data.signatoryName?.trim() || LEADERSHIP.clinicalDirector.name
  const signRole = data.signatoryRole?.trim() || LEADERSHIP.clinicalDirector.role
  doc.setFont("times", "italic")
  doc.setFontSize(15)
  doc.setTextColor(nr, ng, nb)
  doc.text(signName, 42, 166)
  doc.setDrawColor(nr, ng, nb)
  doc.setLineWidth(0.4)
  doc.line(40, 168, 110, 168)
  doc.setFontSize(10)
  doc.setTextColor(nr, ng, nb)
  doc.setFont("helvetica", "bold")
  doc.text(signName, 40, 174)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(110, 110, 110)
  doc.text(signRole, 40, 179)
  doc.text(COMPANY.legalName, 40, 184)

  // Verification (right): scannable QR plus the certificate code and UUID.
  // The QR encodes the verify URL so a scan opens the verification page
  // pre-filled. No plain verify link is printed; the QR carries it instead.
  const ref = certVerificationRef(data.verificationUuid)
  const qrSize = 22
  const qrX = W - 19 - qrSize
  const qrY = 150
  try {
    const qrPng = await certQrPngDataUrl(data.verificationUuid)
    doc.addImage(qrPng, "PNG", qrX, qrY, qrSize, qrSize)
  } catch (err) {
    // If rasterising fails, fall back to a bordered placeholder so the layout
    // stays intact; the printed code below still allows manual verification.
    console.error("[downloadCertificatePdf:qr]", err)
    doc.setDrawColor(nr, ng, nb)
    doc.setLineWidth(0.3)
    doc.rect(qrX, qrY, qrSize, qrSize)
  }
  // Code text sits to the left of the QR, right-aligned against it.
  const codeRight = qrX - 4
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(nr, ng, nb)
  doc.text(ref.short, codeRight, 158, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.text("Scan to verify", codeRight, 163, { align: "right" })
  doc.setFontSize(6.5)
  doc.text(data.verificationUuid, codeRight, 168, { align: "right" })

  // Footer.
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(
    data.footerText?.trim() ||
      `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber}`,
    W / 2,
    194,
    { align: "center" },
  )

  doc.save(`vitalcare-certificate-${data.verificationUuid.slice(0, 8)}.pdf`)
}
