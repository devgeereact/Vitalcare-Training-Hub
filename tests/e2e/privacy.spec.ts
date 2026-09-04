import { expect, test } from "@playwright/test"

/**
 * What the public site actually does to a first-time visitor's browser.
 *
 * Static inspection cannot answer this. A cookie notice describes cookies and
 * storage that only exist once a page has run, and a third-party request can be
 * added by any dependency without anyone editing a policy. These tests read the
 * real network log and the real storage after a visit, so the Cookie Policy and
 * the Privacy Policy can be checked against behaviour rather than intention.
 *
 * They are also a regression guard. Adding an analytics tag, an embedded video,
 * a map or a font host to a public page fails this suite until the host is
 * listed below and the corresponding notice is updated.
 */

/** Public pages a visitor can reach without an account. */
const PUBLIC_ROUTES = ["/", "/our-courses", "/contact-us", "/cookie-policy"]

/**
 * Hosts the public site may contact before the visitor has made any choice.
 *
 * Every entry needs a reason, because every entry is a disclosure obligation:
 * the visitor's IP address and user agent reach that operator.
 */
const ALLOWED_HOSTS: Record<string, string> = {
  "fonts.googleapis.com": "Google Fonts stylesheet for DM Sans and DM Serif Display",
  "fonts.gstatic.com": "Google Fonts font files",
  "mongirnapzzizmzcrkqp.supabase.co": "Supabase, the application backend",
  "images.unsplash.com": "Marketing photography, see src/data/marketing-images.ts",
}

/**
 * Browser storage the public site is expected to write.
 *
 * Keys are matched exactly. Supabase writes its auth key only once a session
 * exists, so it does not appear on an anonymous visit and is not listed here.
 */
const EXPECTED_LOCAL_STORAGE = ["ui-theme", "theme"]
const EXPECTED_SESSION_STORAGE: string[] = []

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

test.describe("public site, before any consent choice", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} contacts only documented third parties`, async ({ page }) => {
      const seen = new Set<string>()

      page.on("request", (request) => {
        const host = hostOf(request.url())
        if (!host) return
        // The site's own origin under test, whichever port it is served on.
        if (host === "localhost" || host === "127.0.0.1") return
        seen.add(host)
      })

      await page.goto(route)
      await expect(page.locator("h1").first()).toBeVisible()

      const undocumented = [...seen].filter((h) => !(h in ALLOWED_HOSTS))
      expect(
        undocumented,
        `Undocumented third-party hosts contacted on ${route}. Add each one to ` +
          "ALLOWED_HOSTS with a reason, and disclose it in the Privacy Policy " +
          "and Cookie Policy before shipping.",
      ).toEqual([])
    })
  }

  test("writes no cookies on a first visit", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/")
    await expect(page.locator("h1").first()).toBeVisible()

    const cookies = await context.cookies()
    expect(
      cookies.map((c) => `${c.name} (${c.domain})`),
      "A cookie appeared on the public site. The Cookie Policy has to describe " +
        "it, and a non-essential one needs a consent choice first.",
    ).toEqual([])
  })

  test("writes only documented browser storage on a first visit", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1").first()).toBeVisible()

    const written = await page.evaluate(() => ({
      local: Object.keys(window.localStorage),
      session: Object.keys(window.sessionStorage),
    }))

    const unexpectedLocal = written.local.filter(
      (k) => !EXPECTED_LOCAL_STORAGE.includes(k),
    )
    const unexpectedSession = written.session.filter(
      (k) => !EXPECTED_SESSION_STORAGE.includes(k),
    )

    expect(
      unexpectedLocal,
      "Undocumented localStorage key on the public site. Storage on a device is " +
        "treated the same as a cookie under PECR, so it belongs in the Cookie Policy.",
    ).toEqual([])
    expect(unexpectedSession, "Undocumented sessionStorage key on the public site.").toEqual(
      [],
    )
  })
})

test.describe("legal pages", () => {
  const LEGAL_ROUTES = [
    "/privacy-policy",
    "/cookie-policy",
    "/terms-and-conditions",
    "/refund-policy",
  ]

  for (const route of LEGAL_ROUTES) {
    test(`${route} is reachable and has content`, async ({ page }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator("h1").first()).toBeVisible()
      // A legal page that renders its title and nothing else is worse than no
      // page at all, because it looks answered.
      const text = await page.locator("main").innerText()
      expect(text.length).toBeGreaterThan(500)
    })
  }

  test("every legal page is reachable from the marketing footer", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1").first()).toBeVisible()

    for (const route of LEGAL_ROUTES) {
      await expect(
        page.locator(`footer a[href="${route}"]`),
        `${route} is not linked from the footer`,
      ).toHaveCount(1)
    }
  })

  test("sign-up links to the terms and the privacy policy", async ({ page }) => {
    await page.goto("/sign-up")
    await expect(page.locator("h1, h2").first()).toBeVisible()

    // A visitor is asked to create an account and hand over their name, email
    // and password. The terms they are agreeing to and the notice describing
    // what happens to that data have to be readable at that moment, not only
    // from a marketing page they may never see again.
    await expect(page.locator('a[href="/terms-and-conditions"]')).toHaveCount(1)
    await expect(page.locator('a[href="/privacy-policy"]')).toHaveCount(1)
  })
})
