import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function FAQPage() {
  return (
    <LegalPage
      canonicalPath="/faq"
      title="Frequently asked questions"
      updated="1 June 2026"
      intro="Answers to the questions we are asked most often by training leads and learners."
      sections={[
        {
          heading: "How long do your courses take?",
          paragraphs: [
            "Durations vary by course. Our catalogue spans 190+ courses across 15 categories, so length depends on the subject and the depth required.",
            "Every course is designed to meet CSTF requirements with no filler. You cover what matters for the role and nothing that does not.",
          ],
        },
        {
          heading: "How are your courses delivered?",
          paragraphs: [
            "Courses are delivered online as self-paced learning, or in person through live sessions. You choose the format that fits your team and your rota.",
          ],
        },
        {
          heading: "Can I book a 1:1 session on a course?",
          paragraphs: [
            "Yes. After you join a course, you can request a one-to-one session with a trainer for that course. This is useful where a learner wants extra support or a focused walkthrough.",
          ],
        },
        {
          heading: "How are courses assessed?",
          paragraphs: [
            "Assessment varies by course. Practical courses such as basic life support and manual handling use practical demonstrations or scenario-based questioning, so we confirm competence rather than a percentage score.",
            "Online courses use quizzes with an 80% pass mark.",
          ],
        },
        {
          heading: "What happens if a learner does not pass?",
          paragraphs: [
            "We explain clearly what to work on, then offer one free resit. The resit usually takes place within two to four weeks.",
          ],
        },
        {
          heading: "Do your courses apply to the independent sector as well as the NHS?",
          paragraphs: [
            "Yes. Content applies to both NHS and independent care settings, including acute services, care homes, GP practices, supported living and community teams.",
          ],
        },
        {
          heading: "When will I receive my certificate?",
          paragraphs: [
            "Certificates are issued within 24 hours of completion and sent by email as a PDF.",
          ],
        },
        {
          heading: "What does the certificate show?",
          paragraphs: [
            "Each certificate carries the learner's full name, the course title, the completion date, the CPD hours, the CSTF reference and a unique verification ID.",
            "CPD hours are formally accredited and logged on every course.",
          ],
        },
        {
          heading: "How do I verify a certificate?",
          paragraphs: [
            "Go to vitalcare.uk/verify and enter the unique verification ID. The check takes seconds and confirms that the certificate is genuine, who completed the course and when.",
            "An employer, HR team or CQC inspector can run the same check.",
          ],
        },
        {
          heading: "How do I book?",
          paragraphs: [
            "Book at vitalcare.uk, by phone on 020 8059 8757, or by email at info@vitalcare.uk.",
          ],
        },
        {
          heading: "How does payment work?",
          paragraphs: [
            "Individual online bookings are paid in full at the point of booking. Group bookings are invoiced, with details set out in our Terms.",
          ],
        },
        {
          heading: "Do you offer group pricing?",
          paragraphs: [
            "Yes. Group pricing applies to four or more learners on the same date. Contact us for a quote.",
          ],
        },
        {
          heading: "What is your cancellation and refund policy?",
          paragraphs: [
            "You receive a full refund when you cancel 14 or more days before a scheduled session. Refunds reduce as the date approaches, as set out in our Refund Policy.",
            "You can transfer a place to a colleague. For online self-paced access, we can refund before you start the course.",
          ],
        },
        {
          heading: "Which organisations do you work with?",
          paragraphs: [
            "We work with NHS trusts, GP practices, care homes, supported-living providers, domiciliary agencies, hospices and dental practices.",
          ],
        },
        {
          heading: "What can you provide for CQC?",
          paragraphs: [
            "Our certificates are CSTF-aligned and verifiable. We can provide attendance records, assessment outcomes and trainer CVs to support a CQC inspection.",
          ],
        },
        {
          heading: "Do you offer ongoing contracts for organisations?",
          paragraphs: [
            "Yes. Rolling contracts are available with priority booking, agreed pricing and a named contact.",
            "We invoice on 14 to 30 day terms and work with NHS and local authority purchase orders.",
          ],
        },
        {
          heading: "Still have a question?",
          paragraphs: [
            "Call us on 020 8059 8757 or email info@vitalcare.uk. We aim to reply within one working day.",
          ],
        },
      ]}
    />
  )
}
