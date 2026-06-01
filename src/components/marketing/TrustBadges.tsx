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
        <li key={badge} className="flex items-center gap-2 text-sm font-medium text-brand-navy">
          <Check className="size-4 text-brand-gold" aria-hidden="true" />
          {badge}
        </li>
      ))}
    </ul>
  )
}
