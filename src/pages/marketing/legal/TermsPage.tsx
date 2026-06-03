import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updated="1 June 2026"
      intro="The terms on which you may use Vitalcare Training Hub."
      sections={[
        {
          heading: "About these terms",
          paragraphs: [
            "These terms govern your use of the website and platform operated by Vitalcare Training Hub Ltd (company number 15718997). By using the service you accept these terms.",
          ],
        },
        {
          heading: "Accounts",
          paragraphs: [
            "You are responsible for keeping your account details secure and for activity under your account. Training records and certificates are personal to the named learner.",
          ],
        },
        {
          heading: "Acceptable use",
          paragraphs: [
            "You agree not to misuse the service, share access improperly, or attempt to copy or resell course content. Certificates may only be issued for training genuinely completed. Where a course includes an assessment, a certificate is issued only to a learner who demonstrates competence; if the standard is not met, we explain why and offer a resit.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "All course content, branding and materials remain the property of Vitalcare Training Hub Ltd or its licensors. You receive a limited licence to use them for your own training only.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "We provide training in good faith and to a professional standard, but we do not exclude liability that cannot be excluded by law. Our total liability is limited to the amount you paid for the relevant training.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction.",
          ],
        },
      ]}
    />
  )
}
