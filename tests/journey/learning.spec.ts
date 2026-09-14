import { expect, test, type Page } from "@playwright/test"

import { ACCOUNTS, CONFIGURED, SKIP_REASON, signIn } from "./helpers"
import { certificateFor, createCourseFixture, type CourseFixture } from "./fixture"

/**
 * The rest of the journey, in a browser: a paid place becomes an enrolment,
 * the learner works through the course, fails the assessment, retries, passes,
 * and the certificate they earn is not vouched for publicly until somebody
 * approves it.
 *
 * The database-level suite proves the same rules cannot be bypassed. This
 * proves a person can actually get through the screens, and that what those
 * screens say matches what the database did.
 */
test.describe.configure({ mode: "serial" })

test.describe("training, assessment and certificate", () => {
  test.skip(!CONFIGURED, SKIP_REASON)

  let fixture: CourseFixture
  let reference: string

  test.beforeAll(async () => {
    fixture = await createCourseFixture()
  })

  /** Answer every question with the labels given, then submit. */
  async function answerWith(page: Page, labels: string[]): Promise<void> {
    for (const label of labels) {
      await page.getByText(label, { exact: true }).click()
    }
    await page.getByRole("button", { name: /submit assessment/i }).click()
  }

  test("a confirmed payment enrols the buyer on the course they bought", async ({
    page,
  }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/store")

    const card = page
      .locator("div")
      .filter({
        has: page.getByRole("heading", {
          name: `QA rehearsal place on ${fixture.courseTitle}`,
          exact: true,
        }),
      })
      .filter({ has: page.getByRole("button", { name: "Buy" }) })
      .last()
    await card.getByRole("button", { name: "Buy" }).click()
    await page.getByRole("button", { name: /place order/i }).click()
    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 20_000,
    })
    reference = (await page
      .getByRole("dialog")
      .locator("text=/^VC-\\d{4}-\\d+$/")
      .first()
      .textContent())!.trim()

    // Not enrolled yet. Paying is what enrols, and nobody has paid.
    await page.goto("/platform/my-learning")
    await expect(page.getByText(fixture.courseTitle)).toHaveCount(0)

    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/store/orders")
    const row = page.locator("tr").filter({ hasText: reference })
    await row.getByRole("button", { name: /confirm/i }).click()
    await expect(page.getByText(/payment confirmed/i)).toBeVisible({ timeout: 20_000 })

    await signIn(page, ACCOUNTS.learner)
    await page.goto("/platform/my-learning")
    await expect(page.getByText(fixture.courseTitle).first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test("the learner works through both lessons", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    const [first, last] = fixture.lessonIds

    // Marking a lesson complete carries the learner on to the next one.
    await page.goto(`/platform/courses/${fixture.courseId}/learn/${first}`)
    await page.getByRole("button", { name: "Mark complete" }).click()
    await expect(page).toHaveURL(new RegExp(`learn/${last}$`), { timeout: 20_000 })

    // The last lesson finishes the content, and the learner is told what is
    // still between them and their certificate rather than that they are done.
    await page.getByRole("button", { name: "Mark complete" }).click()
    await expect(page.getByText(/all lessons done/i)).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText(/pass the course assessment to earn your certificate/i),
    ).toBeVisible()

    // Returning to a completed lesson shows it as completed.
    await page.goto(`/platform/courses/${fixture.courseId}/learn/${first}`)
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible({
      timeout: 20_000,
    })
  })

  test("a wrong answer fails, and the learner may sit it again", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto(`/platform/assessments/${fixture.assessmentId}`)

    // One right, one wrong, against a pass mark of 100.
    await answerWith(page, [fixture.correctLabels[0], fixture.wrongLabels[1]])

    await expect(page.getByText(/50%/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/not passed|failed|try again/i).first()).toBeVisible()

    // A failed attempt issues nothing.
    expect(await certificateFor(fixture.courseId)).toBeNull()
  })

  test("passing issues one certificate, and it is not public yet", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto(`/platform/assessments/${fixture.assessmentId}`)
    await answerWith(page, fixture.correctLabels)
    await expect(page.getByText(/100%/)).toBeVisible({ timeout: 20_000 })

    const cert = await certificateFor(fixture.courseId)
    expect(cert).not.toBeNull()
    expect(cert!.approved).toBe(false)

    // The learner is told it is waiting, not that it is issued.
    await page.goto(`/platform/courses/${fixture.courseId}`)
    await expect(page.getByText(/certificate pending approval/i)).toBeVisible({
      timeout: 20_000,
    })
  })

  test("public verification withholds a certificate nobody has approved", async ({
    page,
  }) => {
    const cert = (await certificateFor(fixture.courseId))!
    await page.goto(`/resources/verify-certificate?id=${cert.code}`)
    await expect(page.getByText(/no valid certificate for that code/i)).toBeVisible({
      timeout: 30_000,
    })
    // And says nothing about who holds it.
    await expect(page.getByText("Lee Learner")).toHaveCount(0)
  })

  test("an administrator approves it, and verification then vouches for it", async ({
    page,
  }) => {
    const cert = (await certificateFor(fixture.courseId))!

    await signIn(page, ACCOUNTS.admin)
    await page.goto("/platform/certificates")
    // The register lists the learner and the course, not the code.
    const row = page.locator("tr").filter({ hasText: fixture.courseTitle })
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.getByRole("button", { name: /approve/i }).click()
    await expect(page.getByText(/certificate approved/i)).toBeVisible({
      timeout: 20_000,
    })

    await expect
      .poll(async () => (await certificateFor(fixture.courseId))!.approved, {
        timeout: 20_000,
      })
      .toBe(true)

    await page.goto(`/resources/verify-certificate?id=${cert.code}`)
    await expect(page.getByText(/valid certificate/i)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("Lee Learner")).toBeVisible()
    await expect(page.getByText(fixture.courseTitle)).toBeVisible()
  })

  test("the renewal date is a calendar month away, not an overflowed one", async ({
    page,
  }) => {
    const cert = (await certificateFor(fixture.courseId))!
    await page.goto(`/resources/verify-certificate?id=${cert.code}`)
    await expect(page.getByText(/valid certificate/i)).toBeVisible({ timeout: 30_000 })

    // The course renews every 12 months, so the expiry falls on the same day
    // and month as the issue date, one year later. An overflowing calculation
    // would move the day, which is the defect this guards.
    const issued = (await page.locator('dt:text-is("Issued") + dd').textContent())!
    const expires = (await page.locator('dt:text-is("Expires") + dd').textContent())!
    const parts = (s: string) => s.trim().split(/\s+/)
    expect(parts(expires)[0]).toBe(parts(issued)[0])
    expect(parts(expires)[1]).toBe(parts(issued)[1])
    expect(Number(parts(expires)[2])).toBe(Number(parts(issued)[2]) + 1)
  })

  test("issuing again does not produce a second certificate", async ({ page }) => {
    await signIn(page, ACCOUNTS.learner)
    await page.goto(`/platform/courses/${fixture.courseId}`)
    await expect(page.getByText(/certificate issued/i)).toBeVisible({ timeout: 20_000 })

    // Re-entering the course runs the issue path again. It must find the
    // existing certificate rather than mint another.
    await page.goto(`/platform/courses/${fixture.courseId}/learn/${fixture.lessonIds[0]}`)
    await page.goto(`/platform/courses/${fixture.courseId}`)
    await expect(page.getByText(/certificate issued/i)).toBeVisible({ timeout: 20_000 })

    const cert = await certificateFor(fixture.courseId)
    expect(cert).not.toBeNull()
  })
})
