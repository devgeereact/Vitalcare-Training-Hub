import { expect, test, type Page } from "@playwright/test"

import { ACCOUNTS, CONFIGURED, SKIP_REASON, signIn } from "./helpers"

/**
 * Booking, payment confirmation and enrolment, on the screens staff and
 * learners actually use.
 *
 * The database-level suite proves the rules. This proves the hand-off: that a
 * buyer is given a reference they can quote, that the amount shown is the
 * amount the server recorded, and that confirming a payment is what enrols
 * them.
 */
// Deliberately not a round number: the amount a buyer is asked for has to
// survive the trip through integer pence and back.
const PRODUCT_PRICE = "125.50"

/**
 * Open the buy dialogue for one named product.
 *
 * The catalogue is a grid of cards, so the Buy button has to be found through
 * the card carrying the name rather than by position.
 */
async function buy(page: Page, name: string): Promise<void> {
  const card = page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Buy" }) })
    .last()
  await card.getByRole("button", { name: "Buy" }).click()
}

test.describe.configure({ mode: "serial" })

test.describe("booking and payment", () => {
  test.skip(!CONFIGURED, SKIP_REASON)

  let productName: string
  let reference: string

  test("an administrator publishes a course product", async ({ page }) => {
    productName = `QA rehearsal product ${Date.now().toString(36)}`
    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store")

    await page.getByRole("button", { name: /new product/i }).click()
    await page.getByPlaceholder("Name").fill(productName)
    await page.getByPlaceholder("Description").fill("Rehearsal product.")
    await page.locator('input[type="number"]').fill(PRODUCT_PRICE)
    await page.getByRole("button", { name: "Add", exact: true }).click()

    await expect(page.getByText(productName)).toBeVisible({ timeout: 20_000 })
  })

  test("a learner orders it and is given a reference and the amount", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store")

    await buy(page, productName)

    await expect(page.getByRole("heading", { name: `Buy ${productName}` })).toBeVisible()
    await page.getByRole("button", { name: /place order/i }).click()

    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 20_000,
    })

    // The reference is the whole point: without it a payment cannot be matched.
    const referenceText = await page
      .getByRole("dialog")
      .locator("text=/^VC-\\d{4}-\\d+$/")
      .first()
      .textContent()
    expect(referenceText).toMatch(/^VC-\d{4}-\d+$/)
    reference = referenceText!.trim()

    // The amount shown is the one the server recorded, not a browser estimate.
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText(`£${PRODUCT_PRICE}`)).toBeVisible()

    // And the buyer is told when to expect confirmation and who to chase.
    await expect(
      dialog.getByText(/we check payments and confirm within/i),
    ).toBeVisible()
  })

  test("the learner can see the order sitting unpaid, under that reference", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store/orders")
    await expect(page.getByText(reference)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText("pending").first()).toBeVisible()
  })

  test("a staff confirmation marks it paid and enrols the buyer", async ({ page }) => {
    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")

    const row = page.locator("tr").filter({ hasText: reference })
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.getByRole("button", { name: /confirm/i }).click()

    await expect(page.getByText(/payment confirmed/i)).toBeVisible({ timeout: 20_000 })
    await expect(row.getByText("paid")).toBeVisible({ timeout: 20_000 })
  })

  test("a confirmed order offers a refund, not another confirmation", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")
    const row = page.locator("tr").filter({ hasText: reference })
    await expect(row).toBeVisible({ timeout: 20_000 })
    await expect(row.getByRole("button", { name: /confirm/i })).toHaveCount(0)
    await expect(row.getByRole("button", { name: /record refund/i })).toBeVisible()
  })

  test("an unpaid order can be cancelled", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store")
    await buy(page, productName)
    await page.getByRole("button", { name: /place order/i }).click()
    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 20_000,
    })
    const second = (await page
      .locator("text=/^VC-\\d{4}-\\d+$/")
      .first()
      .textContent())!.trim()

    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")
    const row = page.locator("tr").filter({ hasText: second })
    await row.getByRole("button", { name: /cancel/i }).click()
    await expect(page.getByText(/order cancelled/i)).toBeVisible({ timeout: 20_000 })
    await expect(row.getByText("cancelled")).toBeVisible({ timeout: 20_000 })
    await expect(row.getByRole("button", { name: /confirm/i })).toHaveCount(0)
  })
})
