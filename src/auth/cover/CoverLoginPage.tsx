import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { AuthShell, GoogleButton } from "@/auth/cover/AuthShell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signInWithPassword, signInWithGoogle } from "@/lib/supabase/auth"
import { loginSchema, type LoginValues } from "@/lib/validations/auth.schema"

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"

export default function CoverLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    const { error } = await signInWithPassword(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    const redirect = searchParams.get("redirect")
    navigate(redirect ? decodeURIComponent(redirect) : "/platform", {
      replace: true,
    })
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
    <AuthShell heading="Welcome back" subheading="Sign in to your training workspace.">
      <div className="flex flex-col gap-6">
        <GoogleButton onClick={onGoogle} disabled={googleLoading || isSubmitting} />

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
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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

          <Button type="submit" disabled={isSubmitting} className={`w-full ${FOCUS}`}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Do not have an account?{" "}
          <Link
            to="/sign-up"
            className="text-primary underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
