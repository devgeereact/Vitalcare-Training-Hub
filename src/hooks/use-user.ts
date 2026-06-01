import { useAuth } from "@/hooks/use-auth"
import type { Profile, UserRole } from "@/types/database.types"

interface UseUserResult {
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isTrainer: boolean
  isLearner: boolean
}

/** Convenience hook for the current user's profile and role flags. */
export function useUser(): UseUserResult {
  const { profile, role, loading } = useAuth()
  return {
    profile,
    role,
    loading,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isTrainer: role === "trainer",
    isLearner: role === "learner",
  }
}
