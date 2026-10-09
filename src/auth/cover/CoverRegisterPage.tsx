import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AuthShell, GoogleButton } from "@/auth/cover/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUpWithPassword, signInWithGoogle } from "@/lib/supabase/auth"
import { registerSchema, type RegisterValues } from "@/lib/validations/auth.schema"

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function CoverRegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null)
    const { error } = await signUpWithPassword(
      values.email,
      values.password,
      values.firstName,
      values.lastName,
    )
    if (error) {
      setFormError(error)
      return
    }
    toast.success("Account created. Check your email to confirm your address.")
    navigate("/sign-in", { replace: true })
  }

  const onGoogle = async () => {
    setFormError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setFormError(error)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Create your account"
      subheading="Join the Vitalcare training platform."
    >
      <div className="flex flex-col gap-6">
        <GoogleButton
          onClick={onGoogle}
          disabled={googleLoading || isSubmitting}
          label="Sign up with Google"
        />

        <div className="relative text-center text-sm">
          <span className="absolute inset-x-0 top-1/2 border-t border-border" />
          <span className="relative bg-background px-2 text-muted-foreground">
            or with email
          </span>
        </div>

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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                className={FOCUS}
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                className={FOCUS}
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

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

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm password</Label>
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${FOCUS}`}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/*
          The terms being agreed to, and the notice describing what happens to
          the name, email and password just handed over, have to be readable at
          the moment of signing up. Linking them only from the marketing footer
          asks people to accept terms they were never shown.
        */}
        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link
            to="/terms-and-conditions"
            className="text-primary underline underline-offset-4"
          >
            Terms and Conditions
          </Link>{" "}
          and confirm you have read our{" "}
          <Link
            to="/privacy-policy"
            className="text-primary underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
