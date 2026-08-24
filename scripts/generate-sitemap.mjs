#!/usr/bin/env node
/**
 * Build public/sitemap.xml from the routes that are actually public.
 *
 * Static routes and the category and sector slugs come from the source of
 * truth in src/data. Course and blog URLs come from the database, because only
 * published records belong in a sitemap: listing a draft course invites a
 * crawler to a 404 and costs crawl budget.
 *
 * Nothing behind a sign-in is ever emitted. Certificate verification URLs are
 * excluded by design: they resolve to a named individual's training record.
 *
 * If the database cannot be reached the static routes are still written, and
 * the script says so rather than silently shipping a half sitemap.
 *
 * Usage:  node scripts/generate-sitemap.mjs
 * Runs as part of `npm run build`.
 */
import { readFileSync, writeFileSync } from "node:fs"

const SITE = (process.env.VITE_SITE_URL || "https://vitalcare.uk").replace(/\/$/, "")

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // Absent .env.local is fine: the static half of the sitemap still builds.
  }
}
loadEnv(".env.local")

/** Pull an array of slugs out of a source file without importing TypeScript. */
function slugsFrom(file, afterMarker) {
  const src = readFileSync(file, "utf8")
  const start = src.indexOf(afterMarker)
  if (start === -1) return []
  const body = src.slice(start)
  return [...body.matchAll(/slug:\s*["']([a-z0-9-]+)["']/g)].map((m) => m[1])
}

const categorySlugs = slugsFrom("src/data/courses.ts", "export const COURSE_CATEGORIES")
const sectorSlugs = slugsFrom("src/data/sectors.ts", "export const SECTORS")

const STATIC_ROUTES = [
  ["/", 1.0, "weekly"],
  ["/our-courses", 0.9, "weekly"],
  ["/about-us", 0.7, "monthly"],
  ["/contact-us", 0.7, "monthly"],
  ["/resources/accreditations", 0.7, "monthly"],
  ["/resources/blog", 0.8, "weekly"],
  ["/resources/events", 0.7, "weekly"],
  ["/resources/verify-certificate", 0.5, "yearly"],
  ["/faq", 0.5, "monthly"],
  ["/privacy-policy", 0.3, "yearly"],
  ["/cookie-policy", 0.3, "yearly"],
  ["/refund-policy", 0.3, "yearly"],
  ["/terms-and-conditions", 0.3, "yearly"],
]

async function fromDatabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return { courses: [], posts: [], reachable: false }
  const headers = { apikey: key, Authorization: `Bearer ${key}` }
  try {
    const [cRes, bRes] = await Promise.all([
      fetch(`${url}/rest/v1/courses?select=slug,updated_at&is_published=eq.true&deleted_at=is.null`, { headers }),
      fetch(`${url}/rest/v1/blog_posts?select=slug,published_at&status=eq.published`, { headers }),
    ])
    const courses = cRes.ok ? await cRes.json() : []
    const posts = bRes.ok ? await bRes.json() : []
    return { courses, posts, reachable: cRes.ok }
  } catch {
    return { courses: [], posts: [], reachable: false }
  }
}

function urlEntry(path, priority, changefreq, lastmod) {
  return [
    "  <url>",
    `    <loc>${SITE}${path}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n")
}

const { courses, posts, reachable } = await fromDatabase()

const entries = [
  ...STATIC_ROUTES.map(([p, pr, cf]) => urlEntry(p, pr, cf)),
  ...categorySlugs.map((s) => urlEntry(`/our-courses/${s}`, 0.8, "weekly")),
  ...sectorSlugs.map((s) => urlEntry(`/training-solutions/${s}`, 0.8, "monthly")),
  // Sorted by slug, not by whatever order the database returned. Without this
  // the file reorders itself whenever a row is touched, so every build produces
  // a diff that says nothing and hides the ones that do.
  ...courses
    .filter((c) => c.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((c) => urlEntry(`/our-courses/course/${c.slug}`, 0.7, "monthly", c.updated_at)),
  ...posts
    .filter((p) => p.slug)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((p) => urlEntry(`/resources/blog/${p.slug}`, 0.6, "monthly", p.published_at)),
]

writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
)

console.log(
  `sitemap.xml written: ${entries.length} URLs ` +
    `(${STATIC_ROUTES.length} static, ${categorySlugs.length} categories, ` +
    `${sectorSlugs.length} sectors, ${courses.length} courses, ${posts.length} posts)`,
)
if (!reachable) {
  console.warn(
    "! The database was not reachable, so no course or blog URLs are included.\n" +
      "  Re-run with .env.local present before deploying, or the catalogue will not be indexed.",
  )
}
