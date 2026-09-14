import { defineConfig, devices } from "@playwright/test"

/**
 * The operational rehearsal: the signed-in journey, in a real browser, against
 * an isolated local database.
 *
 * Kept apart from `playwright.config.ts` on purpose. That suite tests the
 * public site and can be pointed at the deployed one. This suite signs in,
 * places orders and confirms payments, so it must never run anywhere but a
 * database whose contents do not matter.
 *
 * Set up the target first:
 *
 *   supabase start
 *   # apply supabase/migrations, then:
 *   node scripts/seed-local-test-data.mjs
 *
 * Then run:
 *
 *   JOURNEY_SUPABASE_URL=http://127.0.0.1:54321 \
 *   JOURNEY_SUPABASE_KEY=<local publishable key> \
 *   JOURNEY_PASSWORD=<the password you seeded> \
 *   npx playwright test --config playwright.journey.config.ts
 *
 * It refuses to start against anything that is not on the loopback address.
 */
const target = process.env.JOURNEY_SUPABASE_URL ?? ""
const key = process.env.JOURNEY_SUPABASE_KEY ?? ""

if (target && !/^http:\/\/(127\.0\.0\.1|localhost):/.test(target)) {
  throw new Error(
    `JOURNEY_SUPABASE_URL must be a local address. Refusing to rehearse ` +
      `against ${target}: this suite writes orders and confirms payments.`,
  )
}

const PORT = 5133

export default defineConfig({
  testDir: "./tests/journey",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-375",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 780 },
        hasTouch: true,
      },
    },
  ],
  // The production build, against the isolated database. Building here rather
  // than reusing dist/ means the bundle under test is the one these settings
  // produce, not whatever was built last.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      VITE_SUPABASE_URL: target,
      VITE_SUPABASE_PUBLISHABLE_KEY: key,
    },
  },
})
