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
            "Vitalcare Training Hub Ltd is the data controller for the personal data described in this policy. We are registered in England and Wales under company number 15718997, at 11 Halesworth Road, London SE13 7TJ.",
            "You can reach us by email at info@vitalcare.uk or by telephone on 020 8059 8757. Our ICO registration number is available on request.",
          ],
        },
        {
          heading: "What personal data we collect",
          paragraphs: [
            "Identity data: your full name, job title and employer. Contact data: your email address, telephone number and postal address.",
            "Payment data: invoice details and bank transfer references. We do not store card data.",
            "Training records: course completion, assessment scores and certificate details. Usage data: the website pages you visit and any enquiry form submissions.",
            "Health-related data only where necessary, for example accessibility requirements for in-person training.",
          ],
        },
        {
          heading: "How we collect it",
          paragraphs: [
            "We collect personal data through our website forms (enquiry, booking and contact), by email and telephone, through in-person registration at training events, and from employers booking on behalf of learners.",
          ],
        },
        {
          heading: "Lawful basis for processing",
          paragraphs: [
            "We deliver training and issue certificates on the basis of performance of a contract. We maintain training records for 7 years as a legal obligation linked to CPD and CQC requirements.",
            "We send course updates and service communications on the basis of our legitimate interests, and marketing communications on the basis of your consent, which you can withdraw at any time.",
            "We respond to enquiries on the basis of our legitimate interests.",
          ],
        },
        {
          heading: "How we use your data",
          paragraphs: [
            "We use your data to deliver training and manage bookings, to issue, record and verify CPD certificates, and to send invoices and manage payments.",
            "We also use it to communicate with you about training and any changes, to improve our courses and services, and to comply with legal obligations to bodies such as HMRC, the CQC and the ICO.",
          ],
        },
        {
          heading: "Who we share data with",
          paragraphs: [
            "We do not sell personal data. We may share it with a CPD accreditation body for certificate registration and verification, under a data sharing agreement.",
            "We may share it with our IT and hosting providers for platform and website operation, under a data processing agreement, and with payment processors that are PCI-DSS compliant.",
            "We may share it with legal or regulatory bodies where required by law, limited to what is legally required.",
          ],
        },
        {
          heading: "How long we keep your data",
          paragraphs: [
            "We keep training records and certificates for 7 years from the date of training. We keep contact and enquiry data for non-clients for 3 years from last contact.",
            "We keep financial records and invoices for 6 years to meet HMRC requirements. We keep marketing consent records until consent is withdrawn, plus a further 12 months.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "Under UK GDPR you have the right to access your data, correct it, request erasure (subject to our legal obligations), restrict processing, request data portability, object to processing based on legitimate interests, and withdraw consent.",
            "To exercise any of these rights, contact us at info@vitalcare.uk.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "This website uses cookies. Please see our Cookie Policy for detail on the cookies we use and how to manage them.",
          ],
        },
        {
          heading: "How to contact us",
          paragraphs: [
            "For any question about this policy or your personal data, contact us at info@vitalcare.uk, by telephone on 020 8059 8757, or by post at 11 Halesworth Road, London SE13 7TJ.",
          ],
        },
        {
          heading: "How to complain",
          paragraphs: [
            "If you are unhappy with how we handle your personal data, you can complain to the Information Commissioner's Office (ICO) at ico.org.uk or by telephone on 0303 123 1113.",
          ],
        },
      ]}
    />
  )
}
