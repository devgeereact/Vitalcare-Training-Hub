import { expect, type Page } from "@playwright/test"

/**
 * Shared plumbing for the operational rehearsal.
 *
 * Everything here runs against an isolated local stack seeded by
 * `scripts/seed-local-test-data.mjs`. The accounts use the reserved `.test`
 * domain, which cannot receive real mail.
 */

export const PASSWORD = process.env.JOURNEY_PASSWORD ?? ""

export const ACCOUNTS = {
  admin: "qa.admin@vitalcare.test",
  learner: "qa.learner@vitalcare.test",
  trainer: "qa.trainer@vitalcare.test",
} as const

export const CONFIGURED = Boolean(
  process.env.JOURNEY_SUPABASE_URL && process.env.JOURNEY_SUPABASE_KEY && PASSWORD,
)

export const SKIP_REASON =
  "Set JOURNEY_SUPABASE_URL, JOURNEY_SUPABASE_KEY and JOURNEY_PASSWORD, " +
  "pointed at an isolated local stack. Skipped is not passed."

/**
 * Sign in through the real form and wait for the platform to load.
 *
 * Any existing session is discarded first. These specs switch between a
 * learner and an administrator inside one test, and signing in over a live
 * session left the page on /sign-in with no navigation: the form submitted
 * against a session that was already there.
 */
export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/sign-in")
  await page.evaluate(() => {
    try {
      window.localStorage.removeItem("vitalcare-auth")
    } catch {
      // A browser with storage blocked has no session to clear.
    }
  })
  await page.goto("/sign-in")
  await page.locator("#email").fill(email)
  await page.locator("#password").fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL(/\/platform/, { timeout: 30_000 })
}

export async function signOutViaStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem("vitalcare-auth")
  })
  await page.context().clearCookies()
}

/** Fail loudly on a page that rendered an error boundary instead of content. */
export async function expectNoCrash(page: Page): Promise<void> {
  await expect(page.locator("body")).not.toContainText("Something went wrong", {
    timeout: 1000,
  })
}
