import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { AuthLoading } from "@/guards/AuthLoading"
import type { UserRole } from "@/types/database.types"

/**
 * Restrict a subtree to specific roles. Assumes an authenticated session
 * (compose inside AuthGuard). Users without an allowed role are sent to the
 * dashboard. While a profile is still loading the loading state is shown.
 */
export function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) {
  const { role, loading } = useAuth()

  if (loading) return <AuthLoading />

  if (!role || !roles.includes(role)) {
    // Platform routes move under /platform/* in Phase 5; the shell is at / for now.
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
