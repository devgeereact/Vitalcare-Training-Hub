import { Ticket } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function StoreCouponsPage() {
  return (
    <PlannedModule
      icon={Ticket}
      title="Coupons"
      description="Discount codes for campaigns and partner organisations."
      features={[
        "Percentage or fixed-amount discount codes",
        "Usage limits, expiry dates and per-course scope",
        "Track redemptions against each code",
        "Partner codes for negotiated organisation rates",
      ]}
    />
  )
}
