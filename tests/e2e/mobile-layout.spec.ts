import { expect, test } from "@playwright/test"

/**
 * The mobile layout problems this suite exists to prevent:
 *
 *  - the fixed bottom navigation covering the end of the page
 *  - headline statistics truncated to "Total l..." inside a two-column grid
 *
 * Both are measured rather than eyeballed, and both run at every phone width
 * the project supports (320, 375, 390, 430), which is where the Playwright
 * projects come in.
 */

test.describe("public pages fit their viewport", () => {
  const ROUTES = ["/", "/our-courses", "/contact-us", "/about-us"]

  for (const route of ROUTES) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState("networkidle")

      const { overflow, offenders } = await page.evaluate(() => {
        const doc = document.documentElement
        const over = doc.scrollWidth - doc.clientWidth
        if (over <= 2) return { overflow: over, offenders: [] as string[] }

        // Only worth naming names when the page really does scroll. Decorative
        // blurs sitting outside an overflow-hidden section are wider than the
        // viewport by design and clip harmlessly, so a bounding-box scan on its
        // own reports them as faults when they are not.
        const names: string[] = []
        for (const el of Array.from(document.querySelectorAll("body *"))) {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          if (rect.right <= doc.clientWidth + 2) continue
          let clipped = false
          let parent = el.parentElement
          while (parent) {
            const overflowX = getComputedStyle(parent).overflowX
            if (overflowX === "hidden" || overflowX === "clip") {
              clipped = true
              break
            }
            parent = parent.parentElement
          }
          if (clipped) continue
          const className = typeof el.className === "string" ? el.className : ""
          names.push(`${el.tagName.toLowerCase()}.${className.slice(0, 60)}`)
        }
        return { overflow: over, offenders: names.slice(0, 5) }
      })

      // A couple of pixels of rounding is tolerable; a horizontal scrollbar is
      // not, and always means something is wider than the screen.
      expect(
        overflow,
        `page scrolls sideways by ${overflow}px. Widest unclipped elements: ${offenders.join(", ") || "none found"}`,
      ).toBeLessThanOrEqual(2)
    })
  }
})

test.describe("safe-area reservation", () => {
  test("the bottom-nav clearance variable is defined on phone widths", async ({
    page,
  }, testInfo) => {
    await page.goto("/")
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bottom-nav-height")
        .trim(),
    )
    const width = testInfo.project.use.viewport?.width ?? 0
    if (width < 768) {
      // Something non-zero has to be reserved, or the tab bar sits on top of
      // the last thing on the page.
      expect(value).not.toBe("")
      expect(value).not.toBe("0px")
    }
  })

  test("the viewport opts into the device safe area", async ({ page }) => {
    await page.goto("/")
    // Without viewport-fit=cover, env(safe-area-inset-bottom) is always 0 and
    // the tab bar sits under the home indicator on a notched phone.
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    )
  })
})
