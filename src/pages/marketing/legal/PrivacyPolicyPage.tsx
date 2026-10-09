import { LegalPage } from "@/pages/marketing/legal/LegalPage"

/**
 * DRAFT PENDING LEGAL SIGN-OFF.
 *
 * The sections describing what the software actually does were written from the
 * code: the vendors named below are the ones the application really contacts
 * (verified in tests/e2e/privacy.spec.ts and in supabase/functions), and the
 * data categories are the columns that really exist in supabase/migrations.
 *
 * Three things in here are business facts rather than code facts and are the
 * owner's to confirm before this is published: the ICO registration number, the
 * retention periods, and the transfer safeguard in place with each provider
 * outside the UK. See the privacy readiness report for the open list.
 */
export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      canonicalPath="/privacy-policy"
      title="Privacy Policy"
      updated="4 September 2026"
      intro="How Vitalcare Training Hub Ltd collects, uses and protects your personal data."
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            "Vitalcare Training Hub Ltd is the data controller for the personal data described in this policy. We are registered in England and Wales under company number 15718997, at 11 Halesworth Road, London SE13 7TJ.",
            "You can reach us by email at info@vitalcare.uk or by telephone on 020 8059 8757. Our ICO registration number is available on request.",
            "This policy covers our website at vitalcare.uk and the learning platform at vitalcare.uk/platform. It does not cover other websites we link to.",
          ],
        },
        {
          heading: "What personal data we collect",
          paragraphs: [
            "Identity data: your first and last name, job title and the organisation you work for. Contact data: your email address and telephone number.",
            "Account data: your password, held only as a hash by our authentication provider, and, if you sign in with Google, the name, email address and profile picture Google returns to us.",
            "Emergency contact data: the name and telephone number of a person you nominate. See the separate section below.",
            "Training records: your enrolments, lesson progress, assessment attempts and scores, attendance at sessions, and the certificates issued to you. Compliance records: which mandatory courses you have completed and when they are due for renewal.",
            "Communication data: enquiries you send us, messages and announcements inside the platform, and forum or blog posts you write.",
            "Payment data: invoices, orders and coupon use. Card details are never entered into or stored by this platform. For staff, payroll records hold pay period, gross pay, deductions and net pay. Bank details are not held here.",
            "Files you upload, including any documents attached to a course, a message or your profile.",
            "Technical data: our hosting and application providers keep server logs that record IP addresses, timestamps and requested pages, as any web service does.",
            "We do not ask for your date of birth, national insurance number, NHS number, health information or any other special category data. Please do not put such information into free text fields.",
          ],
        },
        {
          heading: "How we collect it",
          paragraphs: [
            "Directly from you, through the contact form, the sign-up form, your profile and settings pages, and anything you submit while learning.",
            "From your employer or training organisation, where they book training for you or create your account for you.",
            "Automatically, through the server logs kept by our hosting and application providers.",
          ],
        },
        {
          heading: "Emergency contact details",
          paragraphs: [
            "Your profile asks for an emergency contact. Those details belong to somebody else, and they will not have read this policy, so please tell them you have given us their name and number.",
            "We use them only to reach that person on your behalf if you become unwell during training. We do not contact them for any other reason and we do not market to them.",
          ],
        },
        {
          heading: "Lawful basis for processing",
          paragraphs: [
            "We deliver training, run your account and issue certificates on the basis of performance of a contract. We maintain training records for 7 years as a legal obligation linked to CPD and CQC requirements.",
            "We send course updates and service communications on the basis of our legitimate interests, and marketing communications on the basis of your consent, which you can withdraw at any time.",
            "We respond to enquiries, keep the platform secure and keep audit records of administrative actions on the basis of our legitimate interests.",
          ],
        },
        {
          heading: "How we use your data",
          paragraphs: [
            "To deliver training and manage bookings, to record progress and mark assessments, and to issue, record and verify CPD certificates.",
            "To let your employer or training manager see the compliance position of the staff they are responsible for, where your account belongs to their organisation.",
            "To send invoices and manage payments, to communicate with you about training and any changes, and to improve our courses.",
            "To keep the platform secure, investigate misuse and comply with legal obligations to bodies such as HMRC, the CQC and the ICO.",
          ],
        },
        {
          heading: "Certificate verification",
          paragraphs: [
            "Certificates we issue can be checked at vitalcare.uk/verify. Anyone holding a certificate number can confirm that it is genuine and see the holder's name, the course and the dates. That is the purpose of a verifiable certificate, and it is how an employer or a regulator checks one.",
            "No other part of your record is shown by the verification page.",
          ],
        },
        {
          heading: "Who processes your data for us",
          paragraphs: [
            "We do not sell personal data. We use the following providers, and each of them only handles data in order to run part of this service for us.",
            "Supabase hosts the database, the file storage and the sign-in system. This is where your account and training records live.",
            "Our web hosting provider serves the website itself and keeps standard server logs.",
            "Resend sends our transactional email, including account email and anything you send through the contact form.",
            "Google is used in several places, and only where you or an administrator has connected it: signing in with a Google account, Google Calendar for scheduling, Google Meet for online sessions, and Google Drive where an administrator has connected it for course files. Our pages also load typefaces from Google Fonts, which tells Google the IP address of every visitor.",
            "Zoom is used for virtual sessions where a session has been set up with it, and Jitsi Meet where a session uses that instead.",
            "Unsplash serves the photography on our public pages, which tells Unsplash the IP address of every visitor.",
            "OpenWeather supplies the weather shown on the platform dashboard. It receives the city name only, never your location.",
            "Google AI and OpenRouter run the optional writing assistant described below.",
            "We may also share data with a CPD accreditation body for certificate registration and verification, with our accountants and professional advisers, and with legal or regulatory bodies where the law requires it, limited to what is required.",
          ],
        },
        {
          heading: "Sending data outside the UK",
          paragraphs: [
            "Several of the providers above are based outside the United Kingdom, mainly in the United States and the European Union, so your data is processed outside the UK.",
            "Transfers of this kind are allowed only with a recognised safeguard in place, such as UK adequacy regulations or the UK International Data Transfer Addendum. If you want to know which one applies to a particular provider, ask us at info@vitalcare.uk and we will tell you.",
          ],
        },
        {
          heading: "The writing assistant",
          paragraphs: [
            "Parts of the platform offer to draft text for you, for example a profile biography or a course description. If you use it, the text you supply is sent to Google AI, or to OpenRouter if Google is unavailable, and their reply is shown to you.",
            "It is always optional, it only runs when you press the button, and it makes no decision about you. Nothing on this platform decides anything about you automatically, and nothing profiles you.",
            "Please do not paste personal data about other people into it.",
          ],
        },
        {
          heading: "How long we keep your data",
          paragraphs: [
            "We keep training records and certificates for 7 years from the date of training. We keep contact and enquiry data for people who do not become clients for 3 years from last contact.",
            "We keep financial records and invoices for 6 years to meet HMRC requirements. We keep marketing consent records until consent is withdrawn, plus a further 12 months.",
            "Deleted records are held in our provider's backups for a short period after deletion before those backups are overwritten in the normal cycle.",
          ],
        },
        {
          heading: "How we protect your data",
          paragraphs: [
            "The site is served over HTTPS. Access to the platform requires an account, and what each account can see is enforced by the database itself rather than by the screen you are shown, so a learner cannot reach another learner's records.",
            "Administrative actions are recorded in an audit log. Sessions lock after a period of inactivity. Keys and credentials for the services above are held server side and are never sent to your browser.",
            "No system is perfectly secure. If a breach affects your data and is likely to be a risk to you, we will tell you, and we will report it to the ICO where the law requires.",
          ],
        },
        {
          heading: "Cookies and what is stored on your device",
          paragraphs: [
            "We use no advertising cookies, no analytics and no tracking pixels. Browsing our public pages sets no cookies at all.",
            "The learning platform stores what it needs to keep you signed in and remember your settings. Our Cookie Policy lists every item by name and says what each one does.",
          ],
        },
        {
          heading: "Age",
          paragraphs: [
            "Our training is for people working or training to work in health and social care, and accounts are for adults. The platform is not designed for children and we do not knowingly collect data about anyone under 18.",
            "If you believe a child has created an account, tell us and we will remove it.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "Under UK GDPR you have the right to access your data, correct it, request erasure, restrict processing, request data portability, object to processing based on legitimate interests, and withdraw consent at any time.",
            "You can correct most of your own details yourself under Settings once you are signed in.",
            "Erasure has limits. Where we are required to keep a training record or a financial record for the periods above, we cannot delete it on request, and we will tell you which parts we have to keep and why.",
          ],
        },
        {
          heading: "Making a request",
          paragraphs: [
            "Email info@vitalcare.uk with the words 'data request' in the subject line, or write to us at the address above. Tell us what you want and, if it is not obvious, which account you mean.",
            "We will ask you enough to be sure the request really comes from you, usually by replying to the email address on the account. Please do not send us photographs of passports or other identity documents unless we ask for them.",
            "We answer within one month. If a request is complicated we may take longer, and we will tell you within that first month if so. There is no charge.",
            "If you are unhappy with how we handle your personal data, please tell us first so we can put it right.",
          ],
        },
        {
          heading: "Changes to this policy",
          paragraphs: [
            "The date at the top of this page is the date of the current version. If we change how we use your data in a way that affects you, we will say so here before the change takes effect, and we will contact account holders directly where the change is significant.",
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
            "You have the right to complain to the Information Commissioner's Office at any time. The ICO can be reached at ico.org.uk or on 0303 123 1113.",
          ],
        },
      ]}
    />
  )
}
