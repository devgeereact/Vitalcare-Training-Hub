import { useEffect, useMemo, useRef, useState } from "react"
import { parseMailBody } from "@/lib/email/mime"

/**
 * Render a stored mail body safely.
 *
 * HTML is shown inside a SANDBOXED iframe (no allow-scripts, no allow-same-origin)
 * so the original formatting is preserved while scripts, forms and same-origin
 * access are blocked. This is the safe way to display untrusted mail HTML without
 * pulling in a sanitiser dependency. The iframe height tracks its content on load.
 *
 * Plain-text bodies render in a pre-wrapped, word-breaking block.
 */
export default function MailBody({ raw }: { raw: string | null | undefined }) {
  const parsed = useMemo(() => parseMailBody(raw), [raw])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(240)

  const srcDoc = useMemo(() => {
    if (parsed.html === undefined) return ""
    // Wrap the message HTML with brand-aligned base styling and a <base
    // target> so any links open in a new tab rather than inside the sandbox.
    return `<!doctype html><html><head><meta charset="utf-8">
<base target="_blank">
<meta name="color-scheme" content="light">
<style>
  :root { color-scheme: light; }
  html,body { margin:0; padding:0; }
  body {
    font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 14px; line-height: 1.6; color: #0f172a;
    word-break: break-word; overflow-wrap: anywhere; padding: 4px 2px;
  }
  a { color: #1b2e6b; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  blockquote { margin: 0 0 0 0.75rem; padding-left: 0.75rem; border-left: 2px solid #e2e8f0; color: #64748b; }
  pre { white-space: pre-wrap; word-break: break-word; }
</style></head><body>${parsed.html}</body></html>`
  }, [parsed.html])

  useEffect(() => {
    if (parsed.html === undefined) return
    const frame = iframeRef.current
    if (!frame) return
    const measure = (): void => {
      try {
        const doc = frame.contentDocument
        if (doc?.body) {
          const next = Math.min(
            Math.max(doc.body.scrollHeight + 8, 120),
            2400,
          )
          setHeight(next)
        }
      } catch {
        // Sandboxed cross-origin access can throw; keep the current height.
      }
    }
    frame.addEventListener("load", measure)
    // A delayed re-measure catches late image layout shifts.
    const t = window.setTimeout(measure, 350)
    return () => {
      frame.removeEventListener("load", measure)
      window.clearTimeout(t)
    }
  }, [srcDoc, parsed.html])

  if (parsed.html !== undefined) {
    return (
      <iframe
        ref={iframeRef}
        title="Message content"
        sandbox=""
        srcDoc={srcDoc}
        className="w-full rounded-lg border border-border bg-white"
        style={{ height, maxHeight: 2400 }}
      />
    )
  }

  const text = parsed.text ?? ""
  return (
    <div className="whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
      {text || "(no content)"}
    </div>
  )
}
