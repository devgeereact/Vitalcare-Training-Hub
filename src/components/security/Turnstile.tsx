import { useEffect, useRef } from "react"
import { TURNSTILE_SITE_KEY, loadTurnstileScript } from "@/lib/turnstile"

// Renders an invisible Cloudflare Turnstile widget and reports the token via
// onVerify. Emits "" when the token expires or errors so the caller can
// re-require it. Helpers live in @/lib/turnstile.

export default function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: "interaction-only",
          size: "flexible",
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onVerify(""),
          "error-callback": () => onVerify(""),
        })
      })
      .catch(() => onVerify(""))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={ref} className="mt-1" />
}
