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
  const code = clean.slice(-6).padStart(6, "0")
  return { short: `VC-${code}`, full: uuid }
}

/**
 * The public verification URL encoded in the certificate QR code. Scanning it
 * opens the verify page pre-filled with this certificate's identifier.
 */
export function certVerifyUrl(uuid: string): string {
  return `https://${COMPANY.website}/verify?id=${uuid}`
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

/** Load an image source, rejecting if it fails to decode. */
function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  const done = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
  })
  img.src = src
  return done
}

/**
 * Rasterise the verification QR code to a PNG data URL. The same QRCodeSVG
 * component renders on screen, so the printed and on-screen codes match. The
 * SVG is forced to carry an xmlns so it decodes as an <img> for the canvas.
 */
export async function certQrPngDataUrl(uuid: string, sizePx = 320): Promise<string> {
  const [nr, ng, nb] = rgb(BRAND.navy)
  const fg = `rgb(${nr},${ng},${nb})`
  let svg = renderToStaticMarkup(
    createElement(QRCodeSVG, {
      value: certVerifyUrl(uuid),
      size: sizePx,
      level: "M",
      bgColor: "#ffffff",
      fgColor: fg,
      marginSize: 2,
    }),
  )
  if (!svg.includes("xmlns")) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = await loadImage(svgUrl)
  const canvas = document.createElement("canvas")
  canvas.width = sizePx
  canvas.height = sizePx
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, sizePx, sizePx)
  ctx.drawImage(img, 0, 0, sizePx, sizePx)
  return canvas.toDataURL("image/png")
}

/**
 * Rasterise a same-origin image URL (the logo SVG) to a transparent PNG,
 * preserving its aspect ratio so it is never stretched.
 */
async function rasterImage(url: string): Promise<{ dataUrl: string; ratio: number }> {
  const img = await loadImage(url)
  const w = img.naturalWidth || 300
  const h = img.naturalHeight || 100
  const scale = 3
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { dataUrl: canvas.toDataURL("image/png"), ratio: w / h }
}

/**
 * Render the signatory name in the Dancing Script webfont to a transparent PNG,
 * so the printed signature is cursive and matches the on-screen preview. The
 * font is loaded by the app, so the canvas can use it directly.
 */
async function signaturePng(
  text: string,
): Promise<{ dataUrl: string; ratio: number }> {
  const fontPx = 64
  const font = `700 ${fontPx}px 'Dancing Script', cursive`
  try {
    await document.fonts.load(font, text)
  } catch {
    // Continue; if the font is unavailable the cursive fallback still draws.
  }
  const measure = document.createElement("canvas").getContext("2d")
  if (!measure) throw new Error("Canvas 2D context unavailable")
  measure.font = font
  const textW = Math.ceil(measure.measureText(text).width)
  const padX = 24
  const w = textW + padX * 2
  const h = Math.ceil(fontPx * 1.5)
  const scale = 2
  const canvas = document.createElement("canvas")
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  ctx.scale(scale, scale)
  ctx.font = font
  ctx.fillStyle = "#1b2e6b"
  ctx.textBaseline = "middle"
  ctx.fillText(text, padX, h / 2)
  return { dataUrl: canvas.toDataURL("image/png"), ratio: w / h }
}

/**
 * Generate and download an A4-landscape Vitalcare certificate, matching the
 * on-screen preview: a navy header band with the wordmark, a gold rule, a
 * centred body with the learner name between flanking rules, a three-column
 * footer (dates, signature, verification with QR) and a company bar.
 */
export async function downloadCertificatePdf(data: CertificatePdfData): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const W = 297
  const H = 210
  const cx = W / 2
  const [nr, ng, nb] = rgb(BRAND.navy)
  const [gr, gg, gb] = rgb(BRAND.gold)
  const grey = 110
  const ink = 51

  // Page.
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, "F")

  // Margin for the gold border frame.
  const M = 7

  // Navy header band, inset to sit inside the frame.
  const bandH = 36
  doc.setFillColor(nr, ng, nb)
  doc.rect(M, M, W - 2 * M, bandH, "F")

  // White wordmark, centred in the band, aspect preserved.
  try {
    const { dataUrl, ratio } = await rasterImage(LOGOS.horizontalWhite)
    const logoH = 24
    const logoW = logoH * ratio
    doc.addImage(
      dataUrl,
      "PNG",
      cx - logoW / 2,
      M + (bandH - logoH) / 2,
      logoW,
      logoH,
    )
  } catch (err) {
    console.error("[downloadCertificatePdf:logo]", err)
  }

  // Gold rule beneath the band.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(1.1)
  doc.line(24, M + bandH + 0.6, W - 24, M + bandH + 0.6)

  // Title.
  doc.setFont("times", "bold")
  doc.setFontSize(27)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.titleText?.trim() || "Certificate of Completion", cx, 62, {
    align: "center",
  })

  // Intro.
  doc.setFont("times", "italic")
  doc.setFontSize(12.5)
  doc.setTextColor(grey, grey, grey)
  doc.text(data.introText?.trim() || "This is to certify that", cx, 72, {
    align: "center",
  })

  // Learner name with flanking rules.
  doc.setFont("times", "bold")
  doc.setFontSize(30)
  doc.setTextColor(nr, ng, nb)
  const nameY = 88
  doc.text(data.learnerName, cx, nameY, { align: "center" })
  const nameW = doc.getTextWidth(data.learnerName)
  const ruleY = nameY - 3
  doc.setDrawColor(150, 160, 185)
  doc.setLineWidth(0.5)
  const gap = nameW / 2 + 8
  if (cx - gap > 40) doc.line(40, ruleY, cx - gap, ruleY)
  if (cx + gap < W - 40) doc.line(cx + gap, ruleY, W - 40, ruleY)

  // Completion line.
  doc.setFont("times", "italic")
  doc.setFontSize(12.5)
  doc.setTextColor(grey, grey, grey)
  doc.text(data.completionText?.trim() || "has successfully completed", cx, 101, {
    align: "center",
  })

  // Course.
  doc.setFont("times", "bold")
  doc.setFontSize(17)
  doc.setTextColor(nr, ng, nb)
  doc.text(data.courseTitle, cx, 110, { align: "center", maxWidth: W - 100 })

  // Framework / accreditation.
  doc.setFont("times", "italic")
  doc.setFontSize(11)
  doc.setTextColor(grey, grey, grey)
  doc.text(
    data.accreditationLine?.trim() || "CSTF-aligned, CPD-accredited",
    cx,
    118,
    { align: "center" },
  )

  // Gold divider.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(0.5)
  doc.line(48, 127, W - 48, 127)

  // ── Three-column footer ──
  // Left: dates.
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(nr, ng, nb)
  doc.text("ISSUED", 30, 145, { charSpace: 0.6 })
  doc.setFont("times", "normal")
  doc.setFontSize(11)
  doc.setTextColor(ink, ink, ink)
  doc.text(fmt(data.issuedAt), 30, 151)
  if (data.expiresAt) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(nr, ng, nb)
    doc.text("EXPIRES", 30, 159, { charSpace: 0.6 })
    doc.setFont("times", "normal")
    doc.setFontSize(11)
    doc.setTextColor(ink, ink, ink)
    doc.text(fmt(data.expiresAt), 30, 165)
  }

  // Centre: signature, rendered from the Dancing Script webfont so it is
  // cursive and matches the preview.
  const signName = data.signatoryName?.trim() || LEADERSHIP.clinicalDirector.name
  const signRole = data.signatoryRole?.trim() || LEADERSHIP.clinicalDirector.role
  try {
    const sig = await signaturePng(signName)
    const sigH = 12
    const sigW = Math.min(sigH * sig.ratio, 72)
    doc.addImage(sig.dataUrl, "PNG", cx - sigW / 2, 140, sigW, sigH)
  } catch (err) {
    console.error("[downloadCertificatePdf:signature]", err)
    doc.setFont("times", "italic")
    doc.setFontSize(19)
    doc.setTextColor(nr, ng, nb)
    doc.text(signName, cx, 151, { align: "center" })
  }
  doc.setDrawColor(ink, ink, ink)
  doc.setLineWidth(0.4)
  doc.line(cx - 34, 153, cx + 34, 153)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(nr, ng, nb)
  doc.text(signName, cx, 159, { align: "center" })
  doc.setFont("times", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(grey, grey, grey)
  doc.text(signRole, cx, 164, { align: "center" })
  doc.text(COMPANY.legalName, cx, 169, { align: "center" })

  // Right: verification, with QR at the far right and the code to its left.
  const ref = certVerificationRef(data.verificationUuid)
  const qrSize = 24
  const qrX = W - 30 - qrSize
  const qrY = 141
  try {
    const qrPng = await certQrPngDataUrl(data.verificationUuid)
    doc.addImage(qrPng, "PNG", qrX, qrY, qrSize, qrSize)
  } catch (err) {
    console.error("[downloadCertificatePdf:qr]", err)
    doc.setDrawColor(nr, ng, nb)
    doc.setLineWidth(0.3)
    doc.rect(qrX, qrY, qrSize, qrSize)
  }
  const codeRight = qrX - 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(nr, ng, nb)
  doc.text("VERIFICATION CODE", codeRight, 147, { align: "right", charSpace: 0.6 })
  doc.setFontSize(13)
  doc.text(ref.short, codeRight, 153, { align: "right" })
  doc.setFont("times", "italic")
  doc.setFontSize(8)
  doc.setTextColor(grey, grey, grey)
  doc.text("Scan the code to verify", codeRight, 158, { align: "right" })

  // Company bar, inset to sit inside the frame.
  doc.setFillColor(246, 247, 251)
  doc.rect(M, H - M - 18, W - 2 * M, 18, "F")
  doc.setDrawColor(225, 228, 236)
  doc.setLineWidth(0.3)
  doc.line(M, H - M - 18, W - M, H - M - 18)
  doc.setFont("times", "normal")
  doc.setFontSize(9)
  doc.setTextColor(grey, grey, grey)
  doc.text(
    data.footerText?.trim() ||
      `${COMPANY.legalName} · Company No. ${COMPANY.companyNumber} · Verify at ${COMPANY.website}/verify`,
    cx,
    H - M - 6,
    { align: "center" },
  )

  // Gold border frame with a thin navy keyline, drawn last so it sits on top.
  doc.setDrawColor(gr, gg, gb)
  doc.setLineWidth(2.4)
  doc.rect(M, M, W - 2 * M, H - 2 * M)
  doc.setDrawColor(nr, ng, nb)
  doc.setLineWidth(0.4)
  doc.rect(M + 2.4, M + 2.4, W - 2 * M - 4.8, H - 2 * M - 4.8)

  doc.save(`vitalcare-certificate-${data.verificationUuid.slice(0, 8)}.pdf`)
}
