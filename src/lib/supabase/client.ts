import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// Public project defaults. The Supabase URL and the publishable (anon) key are
// browser-safe by design (they ship in the client bundle and are protected by
// Row Level Security). They are used as a fallback so the app still boots if
// the VITE_ env vars are not configured at build time (e.g. on a fresh Vercel
// project). Set VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY to override.
const DEFAULT_SUPABASE_URL = "https://mongirnapzzizmzcrkqp.supabase.co"
const DEFAULT_SUPABASE_KEY = "sb_publishable_VmCIonQ2-mXxEgHrtXEIaw_wKWt4fEd"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // Do not throw: a missing env var must not white-screen the whole SPA
  // (including the public marketing site). Fall back to the public defaults.
  console.error(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set; using public project defaults",
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: "vitalcare-auth",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
