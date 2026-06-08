import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase/client"
import { getProfile, signOut as signOutHelper } from "@/lib/supabase/auth"
import type { Profile } from "@/types/database.types"
import { AuthContext, type AuthContextValue } from "@/contexts/auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const result = await getProfile(userId)
    setProfile(result)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      if (active) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        // Defer profile fetch to avoid deadlocks inside the callback.
        void loadProfile(nextSession?.user.id)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const handleSignOut = useCallback(async () => {
    await signOutHelper()
    setSession(null)
    setProfile(null)
  }, [])

  // Inactivity is handled by IdleLockProvider, which locks the UI behind a
  // password after 15 minutes while keeping the session valid. A second hard
  // auto sign-out here used to fight that and log people out unexpectedly
  // (including after a QR sign-in), so it has been removed for a seamless return.

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id)
  }, [loadProfile, session])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      signOut: handleSignOut,
      refreshProfile,
    }),
    [session, profile, loading, handleSignOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
