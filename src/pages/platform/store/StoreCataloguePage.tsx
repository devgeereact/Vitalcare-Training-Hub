import { ShoppingBag } from "lucide-react"
import PlannedModule from "@/components/platform/PlannedModule"

export default function StoreCataloguePage() {
  return (
    <PlannedModule
      icon={ShoppingBag}
      title="Store catalogue"
      description="Sell courses and training bundles to individuals and organisations."
      features={[
        "Publish individual courses and bundled packages",
        "Set prices per seat or per organisation licence",
        "Checkout by bank transfer and PayPal (no card processing)",
        "Automatic enrolment on confirmed payment",
      ]}
    />
  )
}
