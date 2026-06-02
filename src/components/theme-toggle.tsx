"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUIThemeStore } from "@/store/ui-theme.store"

const LIGHT_THEME = "vitalcare-default"
const DARK_THEME = "dark-clinical"

/**
 * Light/dark toggle that stays on-brand: it switches between the Vitalcare
 * light theme and the Dark Clinical theme via the UI theme store (never the
 * bland base theme), so the app always returns to Vitalcare colours.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useUIThemeStore()
  const isDark = theme === DARK_THEME

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full [&_svg]:size-5 h-10 w-10 p-0 focus-visible:ring-2 focus-visible:ring-brand-gold"
            onClick={() => setTheme(isDark ? LIGHT_THEME : DARK_THEME)}
            aria-label="Toggle theme"
          >
            <Sun
              className={`transition-all ${
                isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
              }`}
            />
            <Moon
              className={`absolute transition-all ${
                isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
