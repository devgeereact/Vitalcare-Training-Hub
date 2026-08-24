import { LegalPage } from "@/pages/marketing/legal/LegalPage"

export default function CookiePolicyPage() {
  return (
    <LegalPage
      canonicalPath="/cookie-policy"
      title="Cookie Policy"
      updated="1 June 2026"
      intro="How Vitalcare Training Hub Ltd uses cookies and similar technologies."
      sections={[
        {
          heading: "What cookies are",
          paragraphs: [
            "Cookies are small files stored on your device that help a website work and remember your preferences.",
          ],
        },
        {
          heading: "Cookies we use",
          paragraphs: [
            "We use strictly necessary cookies to keep you signed in and to keep the platform secure. These are required for the service to function.",
            "We use a small number of preference cookies to remember settings such as your chosen theme. We do not use advertising cookies.",
          ],
        },
        {
          heading: "Managing cookies",
          paragraphs: [
            "You can control or delete cookies through your browser settings. Blocking strictly necessary cookies may stop parts of the platform working.",
          ],
        },
      ]}
    />
  )
}
