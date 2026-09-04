import { LegalPage } from "@/pages/marketing/legal/LegalPage"

/**
 * Every statement here was checked against the running application rather than
 * written from intention. The evidence is tests/e2e/privacy.spec.ts, which
 * loads the production build with a clean browser profile and reads the real
 * cookie jar, the real localStorage and sessionStorage, and the real network
 * log. That suite fails if a new cookie, a new stored key or a new third-party
 * host appears, which is what keeps this page true after it is written.
 */
export default function CookiePolicyPage() {
  return (
    <LegalPage
      canonicalPath="/cookie-policy"
      title="Cookie Policy"
      updated="4 September 2026"
      intro="What Vitalcare Training Hub Ltd stores on your device, and what it is for."
      sections={[
        {
          heading: "The short version",
          paragraphs: [
            "Browsing the public website sets no cookies at all. We use no advertising cookies, no analytics and no tracking pixels anywhere on this site or on the learning platform.",
            "We do store a small amount of information in your browser, and the law treats that the same way it treats cookies. This page lists all of it.",
          ],
        },
        {
          heading: "What we mean by cookies and similar technologies",
          paragraphs: [
            "A cookie is a small file a website asks your browser to keep. Browsers also offer two other stores, local storage and session storage, which work differently but do the same job of remembering something on your device.",
            "We use local storage and session storage rather than cookies for almost everything, so this policy covers all three.",
          ],
        },
        {
          heading: "The public website",
          paragraphs: [
            "Visiting our public pages sets no cookies.",
            "If you choose a light or dark appearance, that choice is saved in local storage under the keys ui-theme and theme, so the site looks the same next time. It stays until you clear your browser data.",
            "If you like a blog post, the key vc-liked-posts records which posts this browser has liked, so the same post cannot be liked repeatedly from one device. It holds post identifiers, not anything about you.",
          ],
        },
        {
          heading: "The learning platform",
          paragraphs: [
            "Signing in stores your session under the local storage key vitalcare-auth. This is what keeps you signed in as you move between pages. It is strictly necessary: without it the platform cannot work at all. Signing out removes it.",
            "The cookie sidebar_state remembers whether you left the navigation sidebar open or collapsed. It is set only inside the platform, lasts 7 days, and is read only by this site.",
            "Your notification preferences are held in local storage under vc-notif-session-reminders, vc-notif-certificate-alerts and vc-notif-announcements.",
            "Three keys live in session storage and disappear when you close the tab: vitalcare-session-locked, which keeps the screen locked after a period of inactivity even if you refresh; vc-chunk-reloaded, which lets the app recover once after a new version is released; and vitalcare-weather, which briefly caches the London weather shown on the dashboard.",
          ],
        },
        {
          heading: "Other services your browser contacts",
          paragraphs: [
            "Our pages load typefaces from Google Fonts (fonts.googleapis.com and fonts.gstatic.com) and photography from Unsplash (images.unsplash.com). Neither sets a cookie on our site, but making the request tells that provider your IP address, your browser and which page you were reading. Both operate outside the UK.",
            "The application data behind the site is served by Supabase. Video and documents inside a course are hosted by whichever service the course author used, and opening a lesson that contains one contacts that service directly.",
            "We do not control what those providers do with a request their servers receive. If this matters to you, your browser and its extensions can block them, and the site remains readable without the fonts and images.",
          ],
        },
        {
          heading: "Why we do not show a cookie banner",
          paragraphs: [
            "A banner is there to ask permission for optional cookies and tracking. We use none, and everything listed above is either strictly necessary for a service you asked for or a preference you set yourself, so there is nothing to ask about.",
            "If we ever add analytics or anything similar, we will ask first and this page will change before it happens.",
          ],
        },
        {
          heading: "Managing what is stored",
          paragraphs: [
            "Every browser can show and delete cookies and site data, usually under Privacy or Site settings. Clearing ours signs you out of the platform and forgets your appearance and notification choices. Nothing else is lost, because your training records live in your account rather than on your device.",
            "Blocking storage for this site altogether will stop you signing in.",
          ],
        },
        {
          heading: "Questions",
          paragraphs: [
            "Email info@vitalcare.uk or call 020 8059 8757. Our Privacy Policy explains what we do with personal data more broadly.",
          ],
        },
      ]}
    />
  )
}
