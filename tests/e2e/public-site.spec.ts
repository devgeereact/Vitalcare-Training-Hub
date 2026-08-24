import { expect, test } from "@playwright/test"

/**
 * The public site, against the production build.
 *
 * These cover the things that only break once the app is built and served the
 * way it is deployed: the SPA rewrite behind a deep link, lazily loaded route
 * chunks, and per-page metadata that a crawler would read.
 */

test.describe("deep links and refresh", () => {
  const ROUTES = [
    "/",
    "/our-courses",
    "/about-us",
    "/contact-us",
    "/resources/blog",
    "/resources/accreditations",
    "/privacy-policy",
  ]

  for (const route of ROUTES) {
    test(`${route} loads directly, not only by navigation`, async ({ page }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBeLessThan(400)
      // A rewrite that served index.html for a missing asset would leave the
      // page blank with a console error rather than failing the navigation.
      await expect(page.locator("#root")).not.toBeEmpty()
      await expect(page.locator("h1").first()).toBeVisible()
    })
  }

  test("a nested route survives a reload", async ({ page }) => {
    await page.goto("/resources/accreditations")
    await expect(page.locator("h1").first()).toBeVisible()
    await page.reload()
    await expect(page.locator("h1").first()).toBeVisible()
    expect(page.url()).toContain("/resources/accreditations")
  })

  test("a missing build asset 404s instead of returning the app shell", async ({
    request,
  }) => {
    // `vite preview` always falls back to index.html. The rule that makes a
    // missing asset 404 lives in public/.htaccess and only applies on the real
    // server, so this is only meaningful against a deployment.
    test.skip(
      !process.env.E2E_BASE_URL,
      "Tests the .htaccess rule; run with E2E_BASE_URL against a deployment.",
    )
    // If this returns index.html with a 200, a browser holding a stale bundle
    // gets HTML where it expected JavaScript, and the chunk-reload recovery in
    // src/lib/chunk-reload.ts never sees the load error it waits for.
    const response = await request.get("/assets/does-not-exist-abc123.js")
    expect(response.status()).toBe(404)
  })
})

test.describe("page metadata", () => {
  test("each page carries its own title, description and canonical", async ({ page }) => {
    const seen = new Map<string, string>()
    for (const route of ["/", "/our-courses", "/about-us", "/resources/blog"]) {
      await page.goto(route)
      // index.html carries a bootstrap title that React replaces once the page
      // renders. Wait for this route's canonical tag before reading anything,
      // or the assertions race the first paint.
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${route === "/" ? "/$" : route}`),
      )

      const title = await page.title()
      const description = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute("content")

      expect(title, `${route} has a title`).toBeTruthy()
      expect(description, `${route} has a description`).toBeTruthy()

      // Exactly one description: a second, static one in index.html would
      // contradict the page's own and is picked up as often as not.
      await expect(page.locator('meta[name="description"]')).toHaveCount(1)

      // The whole point: no two pages may present the same title.
      const clash = seen.get(title)
      expect(clash, `${route} shares a title with ${clash}`).toBeUndefined()
      seen.set(title, route)
    }
  })

  test("Open Graph and Twitter tags are present for sharing", async ({ page }) => {
    await page.goto("/our-courses")
    for (const selector of [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
    ]) {
      await expect(page.locator(selector)).toHaveCount(1)
    }
  })

  test("the platform is marked noindex", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    )
  })

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt")
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toContain("Sitemap:")

    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    const xml = await sitemap.text()
    expect(xml).toContain("<urlset")
    // Nothing behind a sign-in belongs in a sitemap.
    expect(xml).not.toContain("/platform/")
    expect(xml).not.toContain("/sign-in")
  })
})

test.describe("the public 404", () => {
  test("offers routes a signed-out visitor can use, and not the dashboard", async ({
    page,
  }) => {
    await page.goto("/this-page-does-not-exist")
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /browse courses/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /dashboard/i })).toHaveCount(0)
  })

  test("is not indexable", async ({ page }) => {
    await page.goto("/this-page-does-not-exist")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    )
  })
})
