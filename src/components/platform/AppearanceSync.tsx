import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSavedTheme } from "@/lib/queries/appearance.queries"
import { useUIThemeStore } from "@/store/ui-theme.store"

/**
 * Applies the signed-in user's saved theme (from their profile) once it loads,
 * so the appearance choice follows them across devices. Renders nothing.
 */
export default function AppearanceSync(): null {
  const { session } = useAuth()
  const { data: savedTheme } = useSavedTheme(session?.user.id)
  const setTheme = useUIThemeStore((s) => s.setTheme)
  const applied = useRef<string | null>(null)

  useEffect(() => {
    if (!savedTheme) return
    // Apply once per distinct saved value to avoid fighting manual changes.
    if (applied.current === savedTheme) return
    applied.current = savedTheme
    setTheme(savedTheme)
  }, [savedTheme, setTheme])

  return null
}
