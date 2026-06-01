import { useUIThemeStore } from "@/store/ui-theme.store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Settings } from "lucide-react"

const VITALCARE_THEMES = [
  {
    id: "vitalcare-default",
    label: "Vitalcare",
    preview: "bg-gradient-to-br from-[#1b2e6b] to-[#d4a843]",
  },
  {
    id: "dark-clinical",
    label: "Dark Clinical",
    preview: "bg-gradient-to-br from-slate-900 to-slate-700",
  },
  {
    id: "light-professional",
    label: "Light Pro",
    preview: "bg-gradient-to-br from-gray-50 to-gray-200",
  },
  {
    id: "navy-minimal",
    label: "Navy Minimal",
    preview: "bg-gradient-to-br from-[#1b2e6b] to-[#142054]",
  },
]

export default function ThemeCustomizer() {
  const { theme, setTheme } = useUIThemeStore()

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                size="icon"
                aria-label="Theme customizer"
                className="rounded-full h-10 w-10 fixed bottom-20 right-4 z-50 md:bottom-4 shadow-lg cursor-pointer [&_svg]:size-5 hover:bg-primary/90 transition focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
              >
                <Settings className="animate-spin [animation-duration:6s]" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">Theme customizer</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="font-display">Theme customizer</SheetTitle>
        </SheetHeader>

        <p className="mt-2 px-1 text-sm text-muted-foreground">
          Choose how the platform looks. Your choice is saved on this device.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 px-1">
          {VITALCARE_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`relative h-20 rounded-lg cursor-pointer transition hover:scale-[1.03] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2 ${
                theme === t.id ? "ring-2 ring-[#d4a843] scale-[1.03]" : ""
              } ${t.preview}`}
            >
              <span className="absolute bottom-1 left-1.5 text-[11px] font-medium text-white bg-black/40 px-2 py-0.5 rounded">
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 px-1">
          <button
            type="button"
            onClick={() => setTheme("vitalcare-default")}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:ring-offset-2"
          >
            Reset to Vitalcare
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
