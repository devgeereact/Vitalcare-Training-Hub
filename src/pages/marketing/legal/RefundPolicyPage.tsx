import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="1 June 2026"
      intro="How refunds and rescheduling work for training purchased from Vitalcare Training Hub Ltd."
      sections={[
        {
          heading: "Our approach",
          paragraphs: [
            "We want every learner to get value from their training. This policy explains how refunds and rescheduling work for our online self-paced courses and for scheduled live sessions, whether those sessions run online or in person.",
            "It sits alongside our Terms and Conditions. Your statutory rights under the Consumer Rights Act 2015 are unaffected.",
          ],
        },
        {
          heading: "Online self-paced courses",
          paragraphs: [
            "You can request a full refund before you start the course, that is, before you first access the course content.",
            "Once you have begun the course, the fee is non-refundable, because access to the content has already been provided.",
            "If a course is faulty or not as described, contact us and we will put it right or refund you.",
          ],
        },
        {
          heading: "Scheduled live sessions",
          paragraphs: [
            "Refunds for live sessions depend on the notice you give before the session date. With 14 or more days notice, you receive a full refund. With 7 to 13 days notice, you receive a 50% refund. With less than 7 days notice, or on the day, no refund applies.",
            "You may transfer your place to a colleague at no charge.",
          ],
        },
        {
          heading: "Rescheduling",
          paragraphs: [
            "You can reschedule a live session once per booking, free of charge, with at least 14 days notice.",
          ],
        },
        {
          heading: "If we cancel",
          paragraphs: [
            "If Vitalcare cancels a session, you receive a full refund or an alternative date, whichever you prefer.",
          ],
        },
        {
          heading: "Group and organisation bookings",
          paragraphs: [
            "Group and corporate bookings are governed by the relevant service agreement, which takes precedence over this policy.",
            "Deposit and balance terms are set out in your agreement and in the Terms and Conditions.",
          ],
        },
        {
          heading: "How to request a refund",
          paragraphs: [
            "Email info@vitalcare.uk or call 020 8059 8757 with your booking reference.",
            "We aim to acknowledge your request within one working day and to process approved refunds within 14 days to the original payment method.",
          ],
        },
      ]}
    />
  )
}
