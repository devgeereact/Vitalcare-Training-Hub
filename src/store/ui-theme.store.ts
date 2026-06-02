import { create } from "zustand"

const DEFAULT_THEME = "vitalcare-default"

// Themes that were removed: any persisted value here is migrated to the default.
const REMOVED_THEMES = new Set([
  "light-professional",
  "dark-blue",
  "classic-light",
  "gaussian-black",
  "semi-dark",
])

function resolveInitialTheme(): string {
  const stored = localStorage.getItem("ui-theme")
  if (!stored || REMOVED_THEMES.has(stored)) {
    localStorage.setItem("ui-theme", DEFAULT_THEME)
    return DEFAULT_THEME
  }
  return stored
}

type UIThemeState = {
  theme: string
  setTheme: (theme: string) => void
}

export const useUIThemeStore = create<UIThemeState>((set) => ({
  theme: resolveInitialTheme(),

  setTheme: (theme) => {
    // Never let a removed theme be applied.
    const next = REMOVED_THEMES.has(theme) ? DEFAULT_THEME : theme
    localStorage.setItem("ui-theme", next)

    // force update (important)
    set({ theme: "" })

    setTimeout(() => {
      set({ theme: next })
    }, 0)
  },
}))
