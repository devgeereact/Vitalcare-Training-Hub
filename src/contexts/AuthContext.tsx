import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  // True while the profile for a newly signed-in user is in flight. Role guards
  // read `loading`, and without this they would see `loading: false, role: null`
  // in the gap between the session arriving and the profile landing, and bounce
  // a legitimate admin off the page they just signed in to reach.
  const [profileLoading, setProfileLoading] = useState(false)
  // Whose profile is currently held. A token refresh re-fires onAuthStateChange
  // for the same user; reloading there must not flash the loading screen.
  const profileUserId = useRef<string | null>(null)

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      profileUserId.current = null
      setProfile(null)
      setProfileLoading(false)
      return
    }
    const isNewUser = profileUserId.current !== userId
    if (isNewUser) setProfileLoading(true)
    try {
      const result = await getProfile(userId)
      profileUserId.current = userId
      setProfile(result)
    } finally {
      if (isNewUser) setProfileLoading(false)
    }
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
      loading: loading || profileLoading,
      signOut: handleSignOut,
      refreshProfile,
    }),
    [session, profile, loading, profileLoading, handleSignOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
