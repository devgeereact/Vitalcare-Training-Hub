// Cloudflare Turnstile helpers (non-component module so the widget file can
// fast-refresh cleanly). The site key is public; the secret is verified
// server-side (contact-form edge function) and by Supabase Auth.

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null
export function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = SCRIPT
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Turnstile failed to load"))
    document.head.appendChild(s)
  })
  return scriptPromise
}

/** Whether Turnstile is configured. When false, forms must not block on it. */
export function turnstileEnabled(): boolean {
  return !!TURNSTILE_SITE_KEY
}
