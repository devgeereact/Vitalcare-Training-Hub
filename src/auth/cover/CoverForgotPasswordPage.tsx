import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MailCheck } from "lucide-react"

import { AuthShell } from "@/auth/cover/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendPasswordReset } from "@/lib/supabase/auth"
import Turnstile, { type TurnstileHandle } from "@/components/security/Turnstile"
import { turnstileEnabled } from "@/lib/turnstile"
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth.schema"

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function CoverForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const captchaRef = useRef<TurnstileHandle>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null)
    const { error } = await sendPasswordReset(values.email, captchaToken || undefined)
    captchaRef.current?.reset()
    setCaptchaToken("")
    if (error) {
      setFormError(error)
      return
    }
    setSent(true)
  }

  return (
    <AuthShell
      heading="Reset your password"
      subheading="We will email you a secure link to set a new password."
    >
      {sent ? (
        <div className="flex flex-col gap-6">
          <Alert>
            <MailCheck className="size-4" />
            <AlertDescription>
              If an account exists for that email, a reset link is on its way.
              Check your inbox and spam folder.
            </AlertDescription>
          </Alert>
          <Link
            to="/sign-in"
            className="text-center text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.uk"
                className={FOCUS}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <Turnstile ref={captchaRef} onVerify={setCaptchaToken} />

            <Button
              type="submit"
              disabled={isSubmitting || (turnstileEnabled() && !captchaToken)}
              className={`w-full ${FOCUS}`}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send reset link"
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
      )}
    </AuthShell>
  )
}
