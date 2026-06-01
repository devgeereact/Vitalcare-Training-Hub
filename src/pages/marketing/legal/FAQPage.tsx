import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function FAQPage() {
  return (
    <LegalPage
      title="Frequently asked questions"
      updated="1 June 2026"
      intro="Answers to the questions we are asked most often by training leads and learners."
      sections={[
        {
          heading: "What does CSTF-aligned mean?",
          paragraphs: [
            "Our statutory and mandatory courses map to the Core Skills Training Framework subjects and learning outcomes by staff group, so training is recognised across NHS organisations. Alignment supports portability but does not replace local competence assurance.",
          ],
        },
        {
          heading: "Are your courses CPD-accredited?",
          paragraphs: [
            "Yes. Courses are CPD-accredited with logged hours that support revalidation and professional portfolios.",
          ],
        },
        {
          heading: "How do I verify a certificate?",
          paragraphs: [
            "Every certificate carries a unique verification code. Enter it at vitalcare.uk/verify to confirm the learner, course and dates.",
          ],
        },
        {
          heading: "Can you train a whole team or organisation?",
          paragraphs: [
            "Yes. We support single learners through to multi-site groups, with central reporting and a named account contact for larger organisations.",
          ],
        },
        {
          heading: "Do you offer in-person training?",
          paragraphs: [
            "We deliver both self-paced online learning and live sessions, online or in person, scheduled around clinical work.",
          ],
        },
      ]}
    />
  )
}
