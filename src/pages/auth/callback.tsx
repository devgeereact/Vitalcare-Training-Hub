import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase/client"
import { AuthLoading } from "@/guards/AuthLoading"

/**
 * OAuth and email-link callback. The Supabase client parses the session from
 * the URL (detectSessionInUrl), then we route the user onward.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        console.error("[AuthCallback]", sessionError)
        setError("We could not complete sign in. Please try again.")
        return
      }
      const redirect = searchParams.get("redirect")
      const target = redirect ? decodeURIComponent(redirect) : "/platform"
      navigate(data.session ? target : "/sign-in", { replace: true })
    })

    return () => {
      active = false
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
