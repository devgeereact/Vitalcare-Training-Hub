import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase/client"
import { AuthLoading } from "@/guards/AuthLoading"

/**
 * OAuth, magic-link and email-link callback. The Supabase client establishes the
 * session from the URL (detectSessionInUrl, or a PKCE code exchange), which is
 * asynchronous. We wait for that to settle before routing onward, so a QR magic
 * link is not bounced to /sign-in by a race (which reads as being signed out).
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let settled = false

    const target = (() => {
      const redirect = searchParams.get("redirect")
      return redirect ? decodeURIComponent(redirect) : "/platform"
    })()

    const finish = (signedIn: boolean): void => {
      if (!active || settled) return
      settled = true
      navigate(signedIn ? target : "/sign-in", { replace: true })
    }

    async function run(): Promise<void> {
      // PKCE links carry a ?code= to exchange for a session.
      const code = searchParams.get("code")
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exErr) console.error("[AuthCallback] exchange", exErr)
      }

      // Already have a session (implicit/hash link parsed on init)?
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error("[AuthCallback]", sessionError)
        if (active) setError("We could not complete sign in. Please try again.")
        return
      }
      if (data.session) {
        finish(true)
        return
      }

      // Otherwise wait for detectSessionInUrl to fire SIGNED_IN, with a timeout
      // fallback so we never hang.
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session) finish(true)
      })
      const timer = window.setTimeout(async () => {
        const { data: again } = await supabase.auth.getSession()
        finish(Boolean(again.session))
      }, 5000)

      // Clean up the listener/timer once settled or unmounted.
      const cleanup = () => {
        sub.subscription.unsubscribe()
        window.clearTimeout(timer)
      }
      if (!active) cleanup()
      else cleanups.push(cleanup)
    }

    const cleanups: Array<() => void> = []
    void run()

    return () => {
      active = false
      cleanups.forEach((c) => c())
    }
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <a
          href="/sign-in"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    )
  }

  return <AuthLoading />
}
