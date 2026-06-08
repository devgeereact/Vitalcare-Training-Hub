import { useEffect, useState, useRef } from "react"
import { turnstileSiteKey, loadPublicConfig, loadTurnstileScript } from "@/lib/turnstile"

// Renders an invisible Cloudflare Turnstile widget and reports the token via
// onVerify. The site key resolves at runtime (Integrations page) or from the
// build-time env var. Emits "" when the token expires or errors.

export default function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [siteKey, setSiteKey] = useState<string | undefined>(turnstileSiteKey())

  // Ensure runtime config is loaded, then pick up the site key.
  useEffect(() => {
    let cancelled = false
    loadPublicConfig().then(() => {
      if (!cancelled) setSiteKey(turnstileSiteKey())
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
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
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={ref} className="mt-1" />
}
