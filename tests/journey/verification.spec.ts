import { expect, test } from "@playwright/test"

import { CONFIGURED, SKIP_REASON } from "./helpers"

/**
 * Public certificate verification, as an employer meets it: not signed in,
 * holding a code off a printed certificate.
 */
test.describe("public certificate verification", () => {
  test.skip(!CONFIGURED, SKIP_REASON)

  test("an unknown code is refused without confirming anything", async ({ page }) => {
    await page.goto("/resources/verify-certificate?id=VC-ZZZZZZ")
    await expect(page.getByText(/no matching certificate/i)).toBeVisible({
      timeout: 30_000,
    })
  })

  test("something that is not a code is rejected before any lookup", async ({
    page,
  }) => {
    await page.goto("/resources/verify-certificate")
    await page.getByLabel(/verification code/i).fill("hello")
    await page.getByRole("button", { name: "Verify" }).click()
    await expect(
      page.getByText(/does not look like a verification code/i),
    ).toBeVisible({ timeout: 20_000 })
  })

  test("the short address in the credentialing phrase resolves", async ({ page }) => {
    await page.goto("/verify")
    await expect(page).toHaveURL(/resources\/verify-certificate/, { timeout: 30_000 })
  })
})
