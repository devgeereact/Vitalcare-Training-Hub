import { Link } from "react-router-dom"
import { AlertTriangle, X } from "lucide-react"
import { useState } from "react"

import { useAuth } from "@/hooks/use-auth"

function isComplete(p: {
  first_name: string | null
  last_name: string | null
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
} | null): boolean {
  if (!p) return true
  return (
    !!p.first_name?.trim() &&
    !!p.last_name?.trim() &&
    !!p.phone?.trim() &&
    !!p.emergency_contact_name?.trim() &&
    !!p.emergency_contact_phone?.trim()
  )
}

/** Persistent nudge until the profile (incl. emergency contact) is complete. */
export default function ProfileCompletionBanner() {
  const { profile } = useAuth()
  const [hidden, setHidden] = useState(false)

  if (hidden || isComplete(profile)) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-warning/30 bg-warning/10 px-6 py-2 text-sm">
      <AlertTriangle className="size-4 text-warning" />
      <span className="text-foreground">
        Your profile is incomplete. Add your phone and an emergency contact.
      </span>
      <Link
        to="/platform/settings"
        className="font-medium text-brand-navy underline-offset-2 hover:underline"
      >
        Complete profile
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setHidden(true)}
        className="ml-auto text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
