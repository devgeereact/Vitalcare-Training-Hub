import { Check } from "lucide-react"

const BADGES = [
  "CSTF Aligned",
  "CPD Accredited",
  "CQC Compliant",
  "Registered Nurse Oversight",
] as const

/** Gold tick + navy text trust signals (no background pills). */
export function TrustBadges() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {BADGES.map((badge) => (
        <li
          key={badge}
          className="flex items-center gap-2 text-sm font-medium text-brand-navy"
        >
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-gold/15"
            aria-hidden="true"
          >
            <Check className="size-3.5 text-brand-gold" />
          </span>
          {badge}
        </li>
      ))}
    </ul>
  )
}
