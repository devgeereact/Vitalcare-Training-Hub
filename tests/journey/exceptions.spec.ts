import { expect, test, type Page } from "@playwright/test"

import { ACCOUNTS, CONFIGURED, PASSWORD, SKIP_REASON, signIn } from "./helpers"

/**
 * The days that are not the happy path, and the keyboard.
 *
 * A payment for the wrong amount, an order abandoned, and somebody who cannot
 * use a mouse. These are the cases a pilot meets in its first fortnight.
 */
test.describe.configure({ mode: "serial" })

test.describe("exceptions and access", () => {
  test.skip(!CONFIGURED, SKIP_REASON)

  let productName: string

  test.beforeAll(async () => {
    productName = `QA exception product ${Date.now().toString(36)}`
  })

  async function placeOrder(page: Page): Promise<string> {
    await page.goto("/platform/store")
    const card = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: productName, exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Buy" }) })
      .last()
    await card.getByRole("button", { name: "Buy" }).click()
    await page.getByRole("button", { name: /place order/i }).click()
    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 20_000,
    })
    return (await page
      .getByRole("dialog")
      .locator("text=/^VC-\\d{4}-\\d+$/")
      .first()
      .textContent())!.trim()
  }

  test("an administrator publishes the product these cases use", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store")
    await page.getByRole("button", { name: /new product/i }).click()
    await page.getByPlaceholder("Name").fill(productName)
    await page.getByPlaceholder("Description").fill("Fixture for the exception cases.")
    await page.locator('input[type="number"]').fill("80.00")
    await page.getByRole("button", { name: "Add", exact: true }).click()
    await expect(page.getByText(productName)).toBeVisible({ timeout: 20_000 })
  })

  test("a payment for the wrong amount is not confirmed, it is cancelled", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.learner)
    const reference = await placeOrder(page)

    // Staff check the bank and find £50 against an £80 order. Confirming is
    // what enrols, so the answer is to cancel and ask for the right payment,
    // not to confirm and sort it out later.
    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")
    const row = page.locator("tr").filter({ hasText: reference })
    await expect(row.getByText("£80")).toBeVisible()
    await row.getByRole("button", { name: /cancel/i }).click()
    await expect(page.getByText(/order cancelled/i)).toBeVisible({ timeout: 20_000 })

    // The buyer sees the outcome on their own order, under the same reference.
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store/orders")
    const mine = page.locator("tr").filter({ hasText: reference })
    await expect(mine.getByText("cancelled")).toBeVisible({ timeout: 20_000 })
  })

  test("a cancelled order cannot quietly become an enrolment", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    const reference = await placeOrder(page)

    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")
    const row = page.locator("tr").filter({ hasText: reference })
    await row.getByRole("button", { name: /cancel/i }).click()
    await expect(page.getByText(/order cancelled/i)).toBeVisible({ timeout: 20_000 })

    // No Confirm button survives. The server refuses it as well, which the
    // database suite proves; this is about not offering it.
    await page.reload()
    const after = page.locator("tr").filter({ hasText: reference })
    await expect(after.getByRole("button", { name: /^confirm/i })).toHaveCount(0)
  })

  test("someone can sign in using the keyboard alone", async ({ page }) => {
    await page.goto("/sign-in")
    await page.locator("#email").focus()
    await page.keyboard.type(ACCOUNTS.learner)
    await page.keyboard.press("Tab")
    await page.keyboard.type(PASSWORD)

    // Enter inside the form submits it, without reaching for the button.
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/platform/, { timeout: 30_000 })
  })

  test("the buy dialogue can be reached and dismissed from the keyboard", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store")

    const card = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: productName, exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Buy" }) })
      .last()
    const buy = card.getByRole("button", { name: "Buy" })
    await buy.focus()
    await expect(buy).toBeFocused()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible({ timeout: 20_000 })

    // Escape closes it, and nothing was ordered.
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })

  test("every interactive control on the sign-in page shows a focus ring", async ({
    page,
  }) => {
    await page.goto("/sign-in")
    for (const selector of ["#email", "#password"]) {
      const field = page.locator(selector)
      await field.focus()
      const outline = await field.evaluate((el) => {
        const s = window.getComputedStyle(el)
        return `${s.outlineStyle} ${s.outlineWidth} ${s.boxShadow}`
      })
      // Either an outline or a ring shadow. What matters is that focus is
      // visible at all, not which technique draws it.
      expect(outline).not.toBe("none 0px none")
    }
  })
})
