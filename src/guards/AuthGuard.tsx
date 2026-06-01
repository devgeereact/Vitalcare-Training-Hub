import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { AuthLoading } from "@/guards/AuthLoading"

/**
 * Gate a subtree behind an authenticated Supabase session.
 * Unauthenticated users are sent to /sign-in with a redirect back.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />

  if (!session) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />
  }

  return <>{children}</>
}
