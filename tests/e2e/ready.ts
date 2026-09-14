import type { Page } from "@playwright/test"

/**
 * Wait until a page is genuinely ready to be measured.
 *
 * Deliberately NOT `waitForLoadState("networkidle")`. That never settles
 * against the deployed site: Cloudflare, the font host and any long-lived
 * connection keep traffic flowing, so a suite that depends on it passes
 * locally and times out the moment it is pointed at production, which is
 * exactly when it matters most.
 *
 * Instead: the document is parsed, the page has rendered its own heading (React
 * has mounted and the route chunk has arrived), and nothing is still animating.
 * All three are properties of the page rather than of the network.
 */
export async function ready(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded")

  // React has mounted and the lazily loaded route has painted its heading.
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 15_000 })

  // Measuring colour mid-fade reports a colour nobody ever sees.
  await page
    .waitForFunction(
      () =>
        typeof document.getAnimations !== "function" ||
        document.getAnimations().every((a) => a.playState !== "running"),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => {
      // A permanently running decorative animation is not a reason to fail;
      // measure what is on screen.
    })
}

/**
 * Trigger every scroll-in animation, then wait for them all to finish.
 *
 * Sections animate on `whileInView`, so they sit in their starting state until
 * something scrolls them into view. axe-core scrolls the page itself while it
 * scans, which starts those animations *after* `ready` has returned, and then
 * measures colour part-way through a fade: it reported body text as #e1e4e8 on
 * white, a colour nobody ever sees, and called it a contrast failure. WebKit
 * lost that race more often than Chromium, but it was always there.
 *
 * Scrolling the whole page first, then settling, means axe measures the page
 * as it finally looks.
 */
export async function settleInView(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight
    const total = document.body.scrollHeight
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    window.scrollTo(0, 0)
  })

  // Wait for the fades themselves, not for a fixed delay. An element caught
  // part-way through one has a computed opacity strictly between 0 and 1, and
  // that is exactly the state axe must not measure. Framer Motion drives some
  // values outside the Web Animations API, so `getAnimations` alone is not
  // enough to tell.
  await page
    .waitForFunction(
      () => {
        const running =
          typeof document.getAnimations === "function" &&
          document.getAnimations().some((a) => a.playState === "running")
        if (running) return false
        return ![...document.querySelectorAll("body *")].some((el) => {
          const opacity = Number(window.getComputedStyle(el).opacity)
          return opacity > 0 && opacity < 1
        })
      },
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {
      // A deliberately translucent element, or a permanently running
      // decorative animation, is not a reason to fail the scan.
    })
}
