import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { AuthShell } from "@/auth/cover/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { signOut, updatePassword } from "@/lib/supabase/auth"
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth.schema"

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

/**
 * How long to wait for the Supabase client to turn the link in the address bar
 * into a recovery session. It parses the URL on start-up, which is
 * asynchronous, so checking once immediately reports "no session" for a link
 * that is perfectly good.
 */
const SESSION_WAIT_MS = 5000

type LinkState = "checking" | "ready" | "expired" | "invalid"

/**
 * Read the error Supabase puts in the address bar when a recovery link cannot
 * be used. It arrives in the hash fragment for implicit links and the query
 * string for PKCE ones, so both are checked.
 */
function linkError(): { code: string; description: string } | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const query = new URLSearchParams(window.location.search)
  const error = hash.get("error") ?? query.get("error")
  if (!error) return null
  return {
    code: hash.get("error_code") ?? query.get("error_code") ?? error,
    description:
      hash.get("error_description") ?? query.get("error_description") ?? "",
  }
}

export default function CoverResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [linkState, setLinkState] = useState<LinkState>("checking")

  /**
   * Decide whether this page has a recovery session before showing the form.
   *
   * Without this the form appeared for everybody, including someone arriving
   * on an expired link. They chose a password, submitted it, and got
   * "Something went wrong. Please try again." from a session that was never
   * going to exist, with no way to tell that the link, not the password, was
   * the problem.
   */
  useEffect(() => {
    let active = true
    let settled = false

    const settle = (state: LinkState): void => {
      if (!active || settled) return
      settled = true
      setLinkState(state)
    }

    const failure = linkError()
    if (failure) {
      console.error("[CoverResetPasswordPage] link rejected", failure.code)
      settle(
        failure.code.includes("expired") || failure.code.includes("otp")
          ? "expired"
          : "invalid",
      )
      return
    }

    const cleanups: Array<() => void> = []

    async function run(): Promise<void> {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("[CoverResetPasswordPage] getSession", error)
        settle("invalid")
        return
      }
      if (data.session) {
        settle("ready")
        return
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) settle("ready")
      })
      const timer = window.setTimeout(async () => {
        const { data: again } = await supabase.auth.getSession()
        settle(again.session ? "ready" : "invalid")
      }, SESSION_WAIT_MS)

      cleanups.push(() => {
        sub.subscription.unsubscribe()
        window.clearTimeout(timer)
      })
    }

    void run()
    return () => {
      active = false
      cleanups.forEach((c) => c())
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    setFormError(null)
    const { error } = await updatePassword(values.password)
    if (error) {
      setFormError(error)
      return
    }
    // End the recovery session. Leaving it open signs the person in on a link
    // from their inbox, which is not what "set a new password" promised, and
    // it means the next screen disagrees with the one that sent them here.
    await signOut()
    toast.success("Password updated. Sign in with your new password.")
    navigate("/sign-in", { replace: true })
  }

  if (linkState === "checking") {
    return (
      <AuthShell
        heading="Set a new password"
        subheading="Checking your reset link."
      >
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <span className="sr-only">Checking your reset link</span>
        </div>
      </AuthShell>
    )
  }

  if (linkState !== "ready") {
    return (
      <AuthShell
        heading={
          linkState === "expired" ? "That link has expired" : "That link cannot be used"
        }
        subheading="Reset links are single use and time limited."
      >
        <div className="flex flex-col gap-6">
          <Alert variant="destructive">
            <ShieldAlert className="size-4" />
            <AlertDescription>
              {linkState === "expired"
                ? "This reset link has expired or has already been used. Request a new one and use the most recent email."
                : "We could not read this reset link. It may be incomplete, already used, or opened in a different browser from the one that requested it."}
            </AlertDescription>
          </Alert>
          <Button asChild className={`w-full ${FOCUS}`}>
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
          <Link
            to="/sign-in"
            className="text-center text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      heading="Set a new password"
      subheading="Choose a strong password you have not used before."
    >
      <div className="flex flex-col gap-6">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={`pr-10 ${FOCUS}`}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={FOCUS}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className={`w-full ${FOCUS}`}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        <Link
          to="/sign-in"
          className="text-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}
