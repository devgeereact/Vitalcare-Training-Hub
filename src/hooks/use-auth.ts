import { useContext } from "react"
import { AuthContext, type AuthContextValue } from "@/contexts/auth-context"

/** Access the authentication state. Must be used within <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
