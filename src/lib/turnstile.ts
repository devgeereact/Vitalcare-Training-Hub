import { supabase } from "@/lib/supabase/client"

// Cloudflare Turnstile helpers. The public site key can be configured two ways:
//  - the Integrations page (stored in integration_settings, read at runtime via
//    the public get_public_config RPC), or
//  - a build-time VITE_TURNSTILE_SITE_KEY env var (fallback).
// The secret is never read here; it is verified server-side (contact-form edge
// function) and by Supabase Auth.

const ENV_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
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

let runtimeSiteKey: string | undefined
let configPromise: Promise<void> | null = null

/** Fetch public config (Turnstile site key) once. Safe pre-auth: the RPC only
 *  exposes whitelisted public values. */
export function loadPublicConfig(): Promise<void> {
  if (configPromise) return configPromise
  configPromise = (async () => {
    try {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: Record<string, string> | null; error: unknown }>
      const { data } = await rpc("get_public_config")
      if (data && typeof data.TURNSTILE_SITE_KEY === "string" && data.TURNSTILE_SITE_KEY) {
        runtimeSiteKey = data.TURNSTILE_SITE_KEY
      }
    } catch {
      /* ignore — fall back to env */
    }
  })()
  return configPromise
}

/** The active site key: runtime config wins, else the build-time env var. */
export function turnstileSiteKey(): string | undefined {
  return runtimeSiteKey || ENV_SITE_KEY
}

/** Whether Turnstile is configured. When false, forms must not block on it. */
export function turnstileEnabled(): boolean {
  return !!turnstileSiteKey()
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
