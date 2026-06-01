import { useAuth } from "@/hooks/use-auth"
import type { Profile, UserRole } from "@/types/database.types"

interface UseUserResult {
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isManager: boolean
  isTrainer: boolean
  isContentEditor: boolean
  isLearner: boolean
  isGuest: boolean
}

/** Convenience hook for the current user's profile and role flags. */
export function useUser(): UseUserResult {
  const { profile, role, loading } = useAuth()
  return {
    profile,
    role,
    loading,
    // admin-level access (org administration)
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isManager: role === "manager",
    isTrainer: role === "trainer",
    isContentEditor: role === "content_editor",
    isLearner: role === "learner",
    isGuest: role === "guest",
  }
}
