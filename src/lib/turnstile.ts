import { supabase } from "@/lib/supabase/client"

// Cloudflare Turnstile helpers. The public site key can be configured two ways:
//  - the Integrations page (stored in integration_settings, read at runtime via
//    the public get_public_config RPC), or
//  - a build-time VITE_TURNSTILE_SITE_KEY env var (fallback).
// The secret is never read here; it is verified server-side (contact-form edge
// function) and by Supabase Auth. The widget itself is rendered by the official
// @marsidev/react-turnstile component.

const ENV_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

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
