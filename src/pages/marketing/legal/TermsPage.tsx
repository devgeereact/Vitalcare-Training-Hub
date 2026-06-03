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
            "These terms govern the provision of training services by Vitalcare Training Hub Ltd (company number 15718997), registered at 11 Halesworth Road, London SE13 7TJ.",
            "By booking a course or using our services you agree to these terms. These terms comply with the Consumer Rights Act 2015.",
          ],
        },
        {
          heading: "Our services",
          paragraphs: [
            "We provide CSTF-aligned, CPD-accredited healthcare training. Our training is delivered in two formats.",
            "Online self-paced courses include lessons, quizzes and an 80% pass mark. Live sessions are delivered online or in person at an arranged venue.",
          ],
        },
        {
          heading: "Making a booking",
          paragraphs: [
            "A contract forms when we confirm your booking in writing by email. The contract is between Vitalcare and the individual learner, or the organisation booking on behalf of its learners.",
            "You can book through vitalcare.uk, by email to info@vitalcare.uk, or by phone on 020 8059 8757.",
          ],
        },
        {
          heading: "Pricing and payment",
          paragraphs: [
            "Prices are as stated on vitalcare.uk at the time of booking. Vitalcare is not currently VAT registered, so no VAT is charged.",
            "Payment terms depend on the booking type. For an individual online booking, payment is due in full at the time of booking. For a group booking of fewer than 10 learners, payment is due in full on invoice within 30 days. For a group booking of 10 or more learners, a 50% deposit is due on confirmation and the remaining 50% on completion. For a corporate account, payment is as agreed in the service contract, with 30 days as the default.",
          ],
        },
        {
          heading: "Cancellation and refunds",
          paragraphs: [
            "For scheduled live sessions, the refund depends on how much notice you give. With 14 or more days notice you receive a full refund. With 7 to 13 days notice you receive a 50% refund. With less than 7 days notice, or on the same day, no refund is given.",
            "Rescheduling is free once per booking when you give 14 or more days notice. If Vitalcare cancels a session, we offer a full refund or an alternative date.",
            "Online self-paced access can be refunded before you begin the course. Full detail is set out in our Refund Policy.",
          ],
        },
        {
          heading: "What we provide",
          paragraphs: [
            "We give you access to course content for the enrolled period and one free resit if you do not meet the 80% pass mark on your first attempt.",
            "We issue a CPD-accredited certificate within 24 hours of successful completion and retain your training records for 7 years. Individual learners also receive free CV support and career guidance.",
          ],
        },
        {
          heading: "Your responsibilities",
          paragraphs: [
            "You must attend or log on at the agreed time, complete the course honestly, and not share assessment answers. You must behave respectfully towards trainers and other learners in live sessions.",
            "You must provide accurate registration information and tell us about any access requirements at least 5 working days before in-person training.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "All course content, materials, assessments and certificates are the property of Vitalcare Training Hub Ltd. Learners may not reproduce, share or adapt them without written permission.",
          ],
        },
        {
          heading: "Limitation of liability",
          paragraphs: [
            "Our total liability, whether in contract, tort or otherwise, shall not exceed the total fees paid for the relevant courses. We are not liable for indirect, consequential or special losses.",
            "Nothing in these terms limits our liability for death or personal injury caused by our negligence.",
          ],
        },
        {
          heading: "Data protection",
          paragraphs: [
            "We process personal data in line with our Privacy Policy and in compliance with UK GDPR and the Data Protection Act 2018.",
          ],
        },
        {
          heading: "Complaints",
          paragraphs: [
            "Please contact us first at info@vitalcare.uk or on 020 8059 8757. Complaints are handled under our complaints process.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.",
          ],
        },
      ]}
    />
  )
}
