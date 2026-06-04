import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// The publishable (anon) key is the ONLY source of truth via the env var, so it
// can be rotated by updating VITE_SUPABASE_PUBLISHABLE_KEY (in .env.local and
// Vercel) with no code change. We deliberately do NOT bake a real key into the
// source: a hardcoded fallback goes stale the moment the key is rotated and then
// silently uses a revoked key. The URL never rotates, so it keeps a default.
const DEFAULT_SUPABASE_URL = "https://mongirnapzzizmzcrkqp.supabase.co"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
// createClient requires a non-empty key; use an obviously-invalid placeholder
// when the env var is missing so requests fail loud (401) instead of the app
// white-screening at construct time.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "MISSING_SUPABASE_PUBLISHABLE_KEY"

if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[supabase] VITE_SUPABASE_PUBLISHABLE_KEY is not set. Set it in .env.local and Vercel, then redeploy.",
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
