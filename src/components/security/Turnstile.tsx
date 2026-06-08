import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Turnstile as CfTurnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { turnstileSiteKey, loadPublicConfig } from "@/lib/turnstile"

// Official Cloudflare Turnstile React component, wrapped so the rest of the app
// keeps the simple onVerify(token) API and so the site key can resolve at
// runtime (Integrations page) or from the build-time env var. Exposes reset()
// because Turnstile tokens are single-use: the caller resets after each submit.

export interface TurnstileHandle {
  reset: () => void
}

const Turnstile = forwardRef<TurnstileHandle, { onVerify: (token: string) => void }>(
  function Turnstile({ onVerify }, ref) {
    const inner = useRef<TurnstileInstance>(null)
    const [siteKey, setSiteKey] = useState<string | undefined>(turnstileSiteKey())

    useEffect(() => {
      let cancelled = false
      loadPublicConfig().then(() => {
        if (!cancelled) setSiteKey(turnstileSiteKey())
      })
      return () => {
        cancelled = true
      }
    }, [])

    useImperativeHandle(ref, () => ({ reset: () => inner.current?.reset() }), [])

    if (!siteKey) return null
    return (
      <CfTurnstile
        ref={inner}
        siteKey={siteKey}
        onSuccess={(token) => onVerify(token)}
        onError={() => onVerify("")}
        onExpire={() => onVerify("")}
        options={{ size: "flexible" }}
        className="mt-1"
      />
    )
  },
)

export default Turnstile
