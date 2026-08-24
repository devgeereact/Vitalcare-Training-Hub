import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests run against the PRODUCTION BUILD, served by `vite preview`,
 * not the dev server.
 *
 * Development and production differ in exactly the places these tests care
 * about: code splitting, lazy route chunks, the SPA rewrite that makes a deep
 * link work, and minified output. A suite that passes on the dev server proves
 * very little about what gets deployed.
 *
 * Point E2E_BASE_URL at the live site to run the same checks against a real
 * deployment instead.
 */
const externalTarget = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: externalTarget ?? "http://localhost:5132",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  /**
   * Chromium at explicit widths rather than the iPhone device descriptors,
   * which need WebKit and a second browser download. The widths are the ones
   * the layout has to hold at. Install WebKit (`npx playwright install webkit`)
   * and add a Mobile Safari project when engine differences need covering.
   */
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    ...[320, 375, 390, 414, 430].map((width) => ({
      name: `mobile-${width}`,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width, height: 780 },
        isMobile: false,
        hasTouch: true,
      },
    })),
  ],
  // Only start a local server when testing the local build.
  webServer: externalTarget
    ? undefined
    : {
        command: "npm run build && npm run preview",
        url: "http://localhost:5132",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
