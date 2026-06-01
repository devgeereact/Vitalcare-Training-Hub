import { useEffect } from "react"
import { useUIThemeStore } from "@/store/ui-theme.store"

const CUSTOM_THEMES = [
  "vitalcare-default",
  "dark-clinical",
  "light-professional",
  "navy-minimal",
  // legacy template themes (cleared if previously applied)
  "dark-blue",
  "classic-light",
  "gaussian-black",
  "semi-dark",
]

export default function UIThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useUIThemeStore()

  useEffect(() => {
  const html = document.documentElement

  // remove all custom themes
  CUSTOM_THEMES.forEach((t) => html.classList.remove(t))

  if (theme) {
    // remove next-themes classes
    html.classList.remove("dark", "light")

    // apply custom theme
    html.classList.add(theme)
  }

  // ✅ if theme is "", do nothing → next-themes takes over
}, [theme])

  return <>{children}</>
}