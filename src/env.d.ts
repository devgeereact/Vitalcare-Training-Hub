/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_URL?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_OPENWEATHER_API_KEY?: string
  readonly VITE_GCAL_API_KEY?: string
  readonly VITE_GCAL_CALENDAR_ID?: string
  readonly VITE_GCAL_ENABLED?: string
  readonly VITE_ZOOM_SDK_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
