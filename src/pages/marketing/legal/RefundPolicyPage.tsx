import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="1 June 2026"
      intro="Our approach to refunds for training purchased from Vitalcare Training Hub Ltd."
      sections={[
        {
          heading: "Cooling-off period",
          paragraphs: [
            "If you have not started a course, you may request a full refund within 14 days of purchase. Once a course has been accessed or a certificate issued, the cooling-off right no longer applies.",
          ],
        },
        {
          heading: "Live and in-person sessions",
          paragraphs: [
            "Bookings for live or in-person sessions can be cancelled for a full refund up to 7 days before the session. Cancellations within 7 days may be transferred to another date where possible.",
          ],
        },
        {
          heading: "How to request a refund",
          paragraphs: [
            "Email info@vitalcare.uk with your order details. We aim to process eligible refunds within 14 days to the original payment method.",
          ],
        },
        {
          heading: "Organisation agreements",
          paragraphs: [
            "Group and corporate purchases are governed by the terms of the relevant agreement, which take precedence over this policy.",
          ],
        },
      ]}
    />
  )
}
