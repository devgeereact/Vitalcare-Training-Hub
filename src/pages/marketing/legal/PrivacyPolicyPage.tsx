import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="1 June 2026"
      intro="How Vitalcare Training Hub Ltd collects, uses and protects your personal data."
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            "Vitalcare Training Hub Ltd (company number 15718997), 11 Halesworth Road, London SE13 7TJ, is the data controller for personal data processed through this website and platform. Contact us at info@vitalcare.uk.",
          ],
        },
        {
          heading: "Data we collect",
          paragraphs: [
            "We collect the details you provide when you create an account, enrol on training or contact us, including your name, email address, organisation and training records.",
            "We also collect limited technical data such as your device type and pages visited, to keep the service secure and working well.",
          ],
        },
        {
          heading: "How we use your data",
          paragraphs: [
            "We use your data to deliver training, issue and verify certificates, communicate with you about your account, and meet our legal obligations.",
            "We process your data under the lawful bases of contract, legitimate interests and, where required, consent.",
          ],
        },
        {
          heading: "Sharing and storage",
          paragraphs: [
            "We share data only with the providers that run our service (for example, hosting and email delivery) and with your organisation where it administers your training. We do not sell your data.",
            "Data is stored securely and retained only as long as needed for training records and legal requirements.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You have the right to access, correct, erase or restrict the use of your personal data, and to complain to the Information Commissioner's Office. To exercise these rights, email info@vitalcare.uk.",
          ],
        },
      ]}
    />
  )
}
