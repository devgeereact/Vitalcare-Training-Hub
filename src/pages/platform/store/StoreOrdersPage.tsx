import { Package } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function StoreOrdersPage() {
  return (
    <PlannedModule
      icon={Package}
      title="Orders"
      description="Track purchases, payment status and fulfilment."
      features={[
        "View every order with payer, items and amount",
        "Confirm bank-transfer and PayPal payments",
        "Issue receipts and refunds against an order",
        "Export orders for accounting",
      ]}
    />
  )
}
