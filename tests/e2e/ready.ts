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
