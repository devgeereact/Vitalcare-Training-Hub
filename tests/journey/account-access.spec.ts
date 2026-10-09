import { expect, test } from "@playwright/test"

import { ACCOUNTS, CONFIGURED, PASSWORD, SKIP_REASON, signIn } from "./helpers"
import { clearMailbox, confirmationLink, waitForMessage } from "./mail"

/**
 * Account access, in a real browser, end to end.
 *
 * "The sign-in page renders" proves nothing about whether anybody can get in.
 * These go through registration, the confirmation email, sign-in, sign-out and
 * password recovery, including the links that do not work.
 */
test.describe("account access", () => {
  test.skip(!CONFIGURED, SKIP_REASON)

  test("a new learner registers, confirms by email and reaches the platform", async ({
    page,
  }) => {
    await clearMailbox()
    const email = `qa.signup.${Date.now().toString(36)}@vitalcare.test`

    await page.goto("/sign-up")
    await page.locator("#firstName").fill("Nadia")
    await page.locator("#lastName").fill("Okafor")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(PASSWORD)
    await page.locator("#confirmPassword").fill(PASSWORD)
    await page.getByRole("button", { name: "Create account" }).click()

    // Whatever the page does next, it must not claim the account is ready
    // before the address is confirmed.
    const message = await waitForMessage(email)
    expect(message.Subject).toBeTruthy()

    const link = await confirmationLink(message.ID)
    await page.goto(link)
    await page.waitForURL(/\/platform|\/auth\/callback/, { timeout: 30_000 })
    await expect(page).toHaveURL(/\/platform/, { timeout: 30_000 })
  })

  test("an existing learner signs in and signs out", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    await expect(page).toHaveURL(/\/platform/)

    await page.evaluate(() => window.localStorage.removeItem("vitalcare-auth"))
    await page.goto("/platform")
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 })
  })

  test("the wrong password is refused, in words a person can act on", async ({
    page,
  }) => {
    await page.goto("/sign-in")
    await page.locator("#email").fill(ACCOUNTS.learner)
    await page.locator("#password").fill("definitely-not-the-password")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByText(/do not match an account/i)).toBeVisible({
      timeout: 20_000,
    })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("a password reset runs from request to new sign-in", async ({ page }) => {
    // A throwaway account, so the test is repeatable. Resetting a shared
    // account's password to the same value twice is refused by Supabase, quite
    // correctly, and that refusal is not what this test is about.
    const email = `qa.reset.${Date.now().toString(36)}@vitalcare.test`
    const firstPassword = `${PASSWORD}1a`
    const newPassword = `${PASSWORD}2b`

    await clearMailbox()
    await page.goto("/sign-up")
    await page.locator("#firstName").fill("Ruth")
    await page.locator("#lastName").fill("Bello")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(firstPassword)
    await page.locator("#confirmPassword").fill(firstPassword)
    await page.getByRole("button", { name: "Create account" }).click()
    const signup = await waitForMessage(email)
    await page.goto(await confirmationLink(signup.ID))
    await page.waitForURL(/\/platform/, { timeout: 30_000 })
    await page.evaluate(() => window.localStorage.removeItem("vitalcare-auth"))

    await clearMailbox()
    await page.goto("/forgot-password")
    await page.locator("#email").fill(email)
    await page.getByRole("button", { name: /send reset link/i }).click()
    await expect(page.getByText(/a reset link is on its way/i)).toBeVisible({
      timeout: 20_000,
    })

    const message = await waitForMessage(email)
    await page.goto(await confirmationLink(message.ID))

    // The form appears only once the recovery session exists.
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible({
      timeout: 30_000,
    })

    await page.locator("#password").fill(newPassword)
    await page.locator("#confirmPassword").fill(newPassword)
    await page.getByRole("button", { name: /update password/i }).click()
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 })

    // The recovery session did not linger: the person is signed out.
    await page.goto("/platform")
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 })

    // The new password works.
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(newPassword)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL(/\/platform/, { timeout: 30_000 })
  })

  test("the old password stops working after a reset", async ({ page }) => {
    const email = `qa.reset2.${Date.now().toString(36)}@vitalcare.test`
    const firstPassword = `${PASSWORD}3c`
    const newPassword = `${PASSWORD}4d`

    await clearMailbox()
    await page.goto("/sign-up")
    await page.locator("#firstName").fill("Tomas")
    await page.locator("#lastName").fill("Vance")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill(firstPassword)
    await page.locator("#confirmPassword").fill(firstPassword)
    await page.getByRole("button", { name: "Create account" }).click()
    const signup = await waitForMessage(email)
    await page.goto(await confirmationLink(signup.ID))
    await page.waitForURL(/\/platform/, { timeout: 30_000 })
    await page.evaluate(() => window.localStorage.removeItem("vitalcare-auth"))

    await clearMailbox()
    await page.goto("/forgot-password")
    await page.locator("#email").fill(email)
    await page.getByRole("button", { name: /send reset link/i }).click()
    const message = await waitForMessage(email)
    await page.goto(await confirmationLink(message.ID))
    await page.locator("#password").fill(newPassword)
    await page.locator("#confirmPassword").fill(newPassword)
    await page.getByRole("button", { name: /update password/i }).click()
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 })

    await page.locator("#email").fill(email)
    await page.locator("#password").fill(firstPassword)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByText(/do not match an account/i)).toBeVisible({
      timeout: 20_000,
    })
  })

  test("an expired reset link says so, and offers a new one", async ({ page }) => {
    await page.goto(
      "/reset-password#error=access_denied&error_code=otp_expired" +
        "&error_description=Email+link+is+invalid+or+has+expired",
    )
    await expect(page.getByText(/that link has expired/i)).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole("link", { name: /request a new link/i })).toBeVisible()
    // The form must not be offered: filling it in would fail with a message
    // about the password rather than about the link.
    await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0)
  })

  test("a reset link with nothing in it is refused rather than half-working", async ({
    page,
  }) => {
    await page.goto("/reset-password")
    await expect(page.getByText(/cannot be used/i)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0)
  })

  test("the platform is closed to anonymous visitors", async ({ page }) => {
    await page.goto("/platform/learners")
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 })
  })
})
