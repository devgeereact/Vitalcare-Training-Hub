import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Nav } from "@/components/marketing/Nav"
import { Footer } from "@/components/marketing/Footer"

/** Reset scroll to the top whenever the route changes. */
function ScrollToTop(): null {
  const { pathname } = useLocation()

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })
  }, [pathname])

  return null
}

/** Public marketing shell: nav, page content, footer. Light, no auth. */
export default function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-foreground">
      <ScrollToTop />
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
