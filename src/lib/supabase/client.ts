import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// Env var wins (rotate by updating VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
// and Vercel, no code change). The defaults are a safety net so the app still
// boots if the env var is not configured at build time — the publishable (anon)
// key is browser-safe by design (it ships in the bundle and is protected by
// RLS). Keep this default in sync whenever the key is rotated.
const DEFAULT_SUPABASE_URL = "https://mongirnapzzizmzcrkqp.supabase.co"
const DEFAULT_SUPABASE_KEY = "sb_publishable_VmCIonQ2-mXxEgHrtXEIaw_wKWt4fEd"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY

if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "[supabase] VITE_SUPABASE_PUBLISHABLE_KEY not set; using the built-in default. Set it in Vercel to control rotation.",
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
