import { useLocation } from "react-router-dom"

/**
 * Page-level metadata for a single-page app.
 *
 * React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree into
 * <head>, and replaces any tag it already owns, so a component per page is all
 * this needs: no helmet library, no extra runtime.
 *
 * Every indexable public page must render one. Without it, a crawler sees the
 * same title, description and canonical URL on every course, category and blog
 * post, which reads as one page duplicated a few hundred times.
 *
 * Nothing private goes in here. Metadata is served to crawlers and social
 * scrapers, so a learner's name, an organisation or a certificate holder must
 * never reach it: pages that show those render with noIndex instead.
 */

const SITE_NAME = "Vitalcare Training Hub"
const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "https://vitalcare.uk"
).replace(/\/$/, "")
const DEFAULT_IMAGE = `${SITE_URL}/logos/logo-round-navy.svg`
const DEFAULT_DESCRIPTION =
  "CSTF-aligned, CPD-accredited healthcare training for NHS Trusts, care homes and healthcare professionals across the UK."

export interface PageMetaProps {
  /** The page's own title. The site name is appended unless this is the home page. */
  title: string
  description?: string
  /** Absolute path, e.g. "/our-courses/first-aid". Defaults to the current route. */
  canonicalPath?: string
  /** Absolute or root-relative image URL for social cards. */
  image?: string
  type?: "website" | "article"
  /** Keep this page out of search results. Use for anything personal or transactional. */
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  /** schema.org JSON-LD, serialised into a script tag. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  /** Set on the home page so the title is not "Vitalcare Training Hub | Vitalcare Training Hub". */
  isHome?: boolean
}

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

/** Trim a description to a length search engines will actually show. */
function clampDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= 160) return clean
  const cut = clean.slice(0, 157)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : 157)}...`
}

export function PageMeta({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  noIndex = false,
  publishedTime,
  modifiedTime,
  jsonLd,
  isHome = false,
}: PageMetaProps) {
  const { pathname } = useLocation()
  const fullTitle = isHome ? title : `${title} | ${SITE_NAME}`
  const desc = clampDescription(description || DEFAULT_DESCRIPTION)
  const canonical = absolute(canonicalPath ?? pathname)
  const ogImage = absolute(image ?? DEFAULT_IMAGE)
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_GB" />
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Serialised by us from our own data, never from user input rendered
          // as HTML, and < is escaped so it cannot close the script tag early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(block).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  )
}

export { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION }
