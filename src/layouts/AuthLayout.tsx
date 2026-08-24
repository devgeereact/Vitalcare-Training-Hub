import { Outlet } from "react-router-dom"
import { Suspense } from "react"
import { RouteFallback } from "@/routes/route-fallback"
import { PageMeta } from "@/components/seo/PageMeta"

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Sign-in, registration and password reset must not be indexed. */}
      <PageMeta
        title="Sign in"
        description="Sign in to Vitalcare Training Hub."
        noIndex
      />
      <div className="w-full">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
