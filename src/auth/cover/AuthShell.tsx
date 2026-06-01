import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { COMPANY } from "@/lib/constants"

const TRUST_BADGES = ["CSTF aligned", "CPD accredited", "CQC compliant"] as const

/**
 * Split-screen authentication layout. Navy brand panel (left, 60% on desktop)
 * with the white logo and trust signals, white form panel (right, 40%).
 */
export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: string
  subheading?: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-5">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-10 text-white lg:flex lg:col-span-3">
        {/* Geometric pattern overlay, gold at low opacity */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        >
          <defs>
            <pattern
              id="auth-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M48 0H0V48"
                fill="none"
                stroke="#d4a843"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        <div className="relative z-10">
          <img
            src="/logos/logo-horizontal-white.svg"
            alt="Vitalcare Training Hub"
            width={240}
            height={60}
            className="h-14 w-auto"
          />
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-display text-3xl leading-tight">
            CSTF-aligned. CPD-accredited. Verified.
          </p>
          <p className="mt-4 text-white/80">
            Healthcare training for NHS Trusts, care homes and healthcare
            professionals, overseen by a registered nurse.
          </p>
          <ul className="mt-8 space-y-3">
            {TRUST_BADGES.map((badge) => (
              <li key={badge} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold">
                  <Check className="size-3.5" />
                </span>
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          {COMPANY.legalName}. Company No. {COMPANY.companyNumber}.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 md:p-10 lg:col-span-2">
        <div className="w-full max-w-sm">
          {/* Logo for mobile, where the brand panel is hidden */}
          <img
            src="/logos/logo-horizontal-navy.svg"
            alt="Vitalcare Training Hub"
            className="mb-8 h-10 w-auto lg:hidden"
          />
          <h1 className="font-display text-3xl text-foreground">{heading}</h1>
          {subheading ? (
            <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Standard Google sign-in button used across the auth pages. */
export function GoogleButton({
  onClick,
  disabled,
  label = "Continue with Google",
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 4.75 12 4.75z"
        />
      </svg>
      {label}
    </button>
  )
}
