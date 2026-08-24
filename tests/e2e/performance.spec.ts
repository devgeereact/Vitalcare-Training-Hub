import { expect, test } from "@playwright/test"

import { ready } from "./ready"

/**
 * A performance budget for the public homepage, enforced against the
 * production build.
 *
 * The homepage used to ship the entire training platform: 4.37MB of
 * JavaScript, 1.25MB compressed, before it became usable. Route-level code
 * splitting brought that down, and these numbers exist so it cannot creep back
 * without somebody deciding to raise them.
 *
 * Budgets are transfer sizes for the initial document load, not lab scores, so
 * they are stable across machines. The throttled run below reports Core Web
 * Vitals for information rather than asserting them, because a wall-clock
 * assertion on shared hardware is a flaky test rather than a useful one.
 */

// Uncompressed transfer sizes: `vite preview` serves the build without
// compression, so these are raw bytes. The real server compresses, and the
// equivalent figures there are roughly a third of these. Before route
// splitting the same measurement was 4,370kB.
const JS_BUDGET_BYTES = 1300 * 1024
const CSS_BUDGET_BYTES = 200 * 1024
const REQUEST_BUDGET = 25

test.describe("homepage budget", () => {
  test("first load stays inside the JavaScript and CSS budgets", async ({ page }) => {
    const js: Record<string, number> = {}
    const css: Record<string, number> = {}

    page.on("response", async (response) => {
      const url = response.url()
      const type = response.request().resourceType()
      if (type !== "script" && type !== "stylesheet") return
      const header = response.headers()["content-length"]
      let size = header ? Number(header) : 0
      if (!size) {
        try {
          size = (await response.body()).byteLength
        } catch {
          size = 0
        }
      }
      if (type === "script") js[url] = size
      else css[url] = size
    })

    await page.goto("/")
    await page.waitForLoadState("load")
    await ready(page)

    const jsTotal = Object.values(js).reduce((a, b) => a + b, 0)
    const cssTotal = Object.values(css).reduce((a, b) => a + b, 0)

    const detail = Object.entries(js)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([url, size]) => `  ${(size / 1024).toFixed(0)}kB ${url.split("/").pop()}`)
      .join("\n")

    expect(
      jsTotal,
      `JavaScript on first load is ${(jsTotal / 1024).toFixed(0)}kB.\nLargest:\n${detail}`,
    ).toBeLessThanOrEqual(JS_BUDGET_BYTES)
    expect(cssTotal).toBeLessThanOrEqual(CSS_BUDGET_BYTES)
  })

  test("the homepage does not open an unreasonable number of connections", async ({
    page,
  }) => {
    let requests = 0
    page.on("request", () => {
      requests += 1
    })
    await page.goto("/")
    await page.waitForLoadState("load")
    await ready(page)
    expect(requests).toBeLessThanOrEqual(REQUEST_BUDGET)
  })

  test("the platform bundle is not fetched by a visitor who never signs in", async ({
    page,
  }) => {
    const fetched: string[] = []
    page.on("request", (r) => {
      if (r.resourceType() === "script") fetched.push(r.url())
    })
    await page.goto("/")
    await page.waitForLoadState("load")
    await ready(page)

    // These belong to the signed-in platform and to features behind a click.
    // A marketing visitor downloading any of them is the regression this whole
    // exercise was about.
    for (const forbidden of [
      "vendor-spreadsheet",
      "vendor-editor",
      "vendor-calendar",
      "vendor-pdf",
      "vendor-charts",
      "vendor-docx",
      "AppLayout",
      "CourseBuilderPage",
      "DashboardPage",
    ]) {
      const leaked = fetched.filter((u) => u.includes(forbidden))
      expect(leaked, `${forbidden} was fetched on the public homepage`).toHaveLength(0)
    }
  })
})

test.describe("measured, not asserted", () => {
  test("reports Core Web Vitals on a throttled connection", async ({ page, browser }) => {
    test.slow()
    const context = await browser.newContext()
    const throttled = await context.newPage()
    const client = await context.newCDPSession(throttled)

    // Roughly a mid-range phone on 4G, which is what a care worker checking
    // course dates actually has.
    await client.send("Network.enable")
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    })
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 })

    const started = Date.now()
    await throttled.goto("/", { waitUntil: "load" })
    // The paint entry can land fractionally after the load event.
    await throttled
      .waitForFunction(
        () => performance.getEntriesByType("paint").length > 0,
        undefined,
        { timeout: 10_000 },
      )
      .catch(() => undefined)

    const metrics = await throttled.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined
      const paints = performance.getEntriesByType("paint")
      const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime
      return {
        firstContentfulPaint: fcp ?? null,
        domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
        loadEvent: nav?.loadEventEnd ?? null,
        transferred: nav?.transferSize ?? null,
      }
    })

    console.log(
      `Throttled homepage (4x CPU, 1.6Mbps, 150ms RTT): ` +
        `FCP ${Math.round(metrics.firstContentfulPaint ?? 0)}ms, ` +
        `DOMContentLoaded ${Math.round(metrics.domContentLoaded ?? 0)}ms, ` +
        `load ${Math.round(metrics.loadEvent ?? 0)}ms, ` +
        `wall clock ${Date.now() - started}ms`,
    )

    // The one thing worth asserting: the page paints something. A blank screen
    // on a slow connection is a failure whatever the numbers say.
    expect(metrics.firstContentfulPaint).not.toBeNull()
    await context.close()
  })
})
