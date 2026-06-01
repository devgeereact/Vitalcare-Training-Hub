import { Outlet } from "react-router-dom"
import { Nav } from "@/components/marketing/Nav"
import { Footer } from "@/components/marketing/Footer"

/** Public marketing shell: nav, page content, footer. Light, no auth. */
export default function MarketingLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-foreground">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
