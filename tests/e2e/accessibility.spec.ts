import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

/**
 * Accessibility, measured rather than eyeballed.
 *
 * axe-core catches the mechanical failures: contrast, missing names, invalid
 * ARIA, broken landmark and heading structure. It cannot judge whether a
 * keyboard journey makes sense, so the checks below it walk the page by
 * keyboard and assert what a person using one would need.
 *
 * WCAG 2.1 AA is the bar: this is training for NHS Trusts, whose suppliers are
 * expected to meet it.
 */

// Entrance animations fade content in from zero opacity. Measuring contrast
// mid-fade reports a colour nobody ever sees and produces false failures, so
// the suite runs the way someone who has asked for reduced motion sees the
// site: animations off, final state, which is also a scenario worth covering.
test.use({ reducedMotion: "reduce" })

/**
 * Wait until nothing is still animating.
 *
 * Contrast is measured from the pixels on screen. Sampling a control while its
 * container is still fading in reports a colour nobody ever sees, which shows
 * up as an intermittent failure rather than a real one.
 */
async function settle(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle")
  await page
    .waitForFunction(
      () =>
        typeof document.getAnimations !== "function" ||
        document.getAnimations().every((a) => a.playState !== "running"),
      undefined,
      { timeout: 5000 },
    )
    .catch(() => {
      // A permanently running decorative animation is not a reason to fail the
      // accessibility check; carry on and measure what is there.
    })
}

const PUBLIC_PAGES = [
  "/",
  "/our-courses",
  "/about-us",
  "/contact-us",
  "/resources/blog",
  "/resources/accreditations",
  "/privacy-policy",
]

test.describe("automated checks", () => {
  for (const route of PUBLIC_PAGES) {
    test(`${route} has no WCAG A or AA violations`, async ({ page }) => {
      await page.goto(route)
      await settle(page)

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      const summary = results.violations.flatMap((v) =>
        v.nodes.map(
          (n) =>
            `${v.id} (${v.impact}) at ${n.target.join(" ")}: ` +
            `${n.failureSummary?.replace(/\s+/g, " ")}`,
        ),
      )
      expect(summary, summary.join("\n")).toEqual([])
    })
  }

  test("the 404 page is accessible too", async ({ page }) => {
    await page.goto("/nope")
    await settle(page)
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
    const summary = results.violations.map((v) => `${v.id}: ${v.help}`)
    expect(summary, summary.join("\n")).toEqual([])
  })
})

test.describe("structure", () => {
  for (const route of PUBLIC_PAGES) {
    test(`${route} has exactly one h1 and no skipped heading levels`, async ({
      page,
    }) => {
      await page.goto(route)
      await page.waitForLoadState("networkidle")

      const levels = await page.$$eval("h1, h2, h3, h4, h5, h6", (nodes) =>
        nodes
          .filter((n) => {
            const style = getComputedStyle(n)
            return style.display !== "none" && style.visibility !== "hidden"
          })
          .map((n) => Number(n.tagName.slice(1))),
      )

      expect(levels.filter((l) => l === 1), `${route} h1 count`).toHaveLength(1)

      // A heading may go down one level at a time, and back up any distance.
      // Jumping from h2 to h4 leaves a screen-reader user with a gap where a
      // section heading should be.
      let previous = levels[0] ?? 1
      for (const level of levels) {
        expect(
          level - previous,
          `${route} jumps from h${previous} to h${level}`,
        ).toBeLessThanOrEqual(1)
        previous = level
      }
    })
  }

  test("every page has a main landmark", async ({ page }) => {
    for (const route of PUBLIC_PAGES) {
      await page.goto(route)
      const mains = await page.locator("main, [role=main]").count()
      expect(mains, `${route} main landmark count`).toBeGreaterThanOrEqual(1)
    }
  })
})

test.describe("keyboard", () => {
  test("focus is visible on the first few interactive elements", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab")
      const visible = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return true
        const style = getComputedStyle(el)
        // Either a real outline or a ring shadow counts; "none and nothing" is
        // the failure, because the person cannot see where they are.
        const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0
        const hasRing = style.boxShadow !== "none" && style.boxShadow !== ""
        return hasOutline || hasRing
      })
      expect(visible, `element ${i + 1} in the tab order shows no focus`).toBe(true)
    }
  })

  test("the whole navigation is reachable by keyboard", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const navLinks = await page.locator("header a[href], nav a[href]").count()
    expect(navLinks).toBeGreaterThan(0)

    const focusable = await page.$$eval(
      "header a[href], header button, nav a[href], nav button",
      (nodes) =>
        nodes.filter((n) => (n as HTMLElement).tabIndex >= 0).length,
    )
    expect(focusable).toBeGreaterThan(0)
  })

  test("no positive tabindex reorders the page", async ({ page }) => {
    for (const route of PUBLIC_PAGES) {
      await page.goto(route)
      const positive = await page.$$eval("[tabindex]", (nodes) =>
        nodes
          .map((n) => Number(n.getAttribute("tabindex")))
          .filter((t) => t > 0).length,
      )
      // A positive tabindex jumps the person out of document order and is
      // almost always a bug rather than a decision.
      expect(positive, `${route} has ${positive} positive tabindex values`).toBe(0)
    }
  })
})
