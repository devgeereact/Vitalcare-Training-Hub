import { Outlet } from "react-router-dom"
import { Suspense } from "react"
import { RouteFallback } from "@/routes/route-fallback"

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
