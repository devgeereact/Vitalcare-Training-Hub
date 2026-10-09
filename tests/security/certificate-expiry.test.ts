import { beforeAll, describe, expect, it } from "vitest"

import { canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * Certificates expire when the course says they do.
 *
 * Migration 093 gave `issue_course_certificate` an expiry. It did not give one
 * to `sync_course_completion`, the trigger-driven function in 091 that also
 * creates certificates, and which runs first. So a course with a twelve-month
 * renewal period went on issuing certificates that never expired: no reminder,
 * no renewal, and a compliance register saying everybody is in date for ever.
 * 097 closes that. These assertions fail if either path loses its expiry again.
 */
const enabled = canRun("admin", "learner")

describe.skipIf(!enabled)("certificate expiry", () => {
  let admin: Session
  let learner: Session

  beforeAll(async () => {
    ;[admin, learner] = await Promise.all([signInAs("admin"), signInAs("learner")])
  })

  /**
   * A one-lesson course, enrolled, ready to be completed. No assessment, so
   * completing the lesson is the whole of it.
   */
  async function buildCourse(renewalMonths: number | null): Promise<{
    courseId: string
    lessonId: string
  }> {
    const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const { data: course, error: cErr } = await admin.client
      .from("courses")
      .insert({
        title: `QA expiry ${stamp} (do not publish)`,
        slug: `qa-expiry-${stamp}`,
        summary: "Fixture course for the certificate expiry suite.",
        cpd_hours: 1,
        duration_mins: 10,
        renewal_months: renewalMonths,
        is_published: false,
      })
      .select("id")
      .single()
    if (cErr) throw cErr

    const { data: module, error: mErr } = await admin.client
      .from("modules")
      .insert({ course_id: course.id, title: "Module one", position: 0 })
      .select("id")
      .single()
    if (mErr) throw mErr

    const { data: lesson, error: lErr } = await admin.client
      .from("lessons")
      .insert({
        module_id: module.id,
        title: "Lesson one",
        type: "text",
        content: "<p>Fixture.</p>",
        position: 0,
      })
      .select("id")
      .single()
    if (lErr) throw lErr

    const { error: eErr } = await admin.client
      .from("enrollments")
      .insert({ course_id: course.id, learner_id: learner.userId, status: "not_started" })
    if (eErr) throw eErr

    return { courseId: course.id, lessonId: lesson.id }
  }

  /** Complete the lesson as the learner, which fires the completion trigger. */
  async function complete(lessonId: string): Promise<void> {
    const { error } = await learner.client
      .from("lesson_progress")
      .insert({ lesson_id: lessonId, learner_id: learner.userId, completed: true })
    if (error) throw error
  }

  async function certificate(courseId: string) {
    const { data, error } = await admin.client
      .from("learner_certificates")
      .select("issued_at, expires_at")
      .eq("course_id", courseId)
      .eq("learner_id", learner.userId)
      .is("deleted_at", null)
      .maybeSingle()
    if (error) throw error
    return data
  }

  it("gives a certificate an expiry when the course renews", async () => {
    const { courseId, lessonId } = await buildCourse(12)
    await complete(lessonId)

    const cert = await certificate(courseId)
    expect(cert).not.toBeNull()
    expect(cert!.expires_at).not.toBeNull()

    // Twelve calendar months after issue: same day, same month, next year.
    const issued = new Date(cert!.issued_at as string)
    const expires = new Date(cert!.expires_at as string)
    expect(expires.getUTCFullYear()).toBe(issued.getUTCFullYear() + 1)
    expect(expires.getUTCMonth()).toBe(issued.getUTCMonth())
    expect(expires.getUTCDate()).toBe(issued.getUTCDate())
  })

  it("leaves a certificate with no expiry when the course does not renew", async () => {
    const { courseId, lessonId } = await buildCourse(null)
    await complete(lessonId)

    const cert = await certificate(courseId)
    expect(cert).not.toBeNull()
    expect(cert!.expires_at).toBeNull()
  })

  it("treats a renewal period of zero as no renewal", async () => {
    const { courseId, lessonId } = await buildCourse(0)
    await complete(lessonId)

    const cert = await certificate(courseId)
    expect(cert).not.toBeNull()
    expect(cert!.expires_at).toBeNull()
  })

  it("a certificate that has expired fails public verification as expired", async () => {
    const { courseId, lessonId } = await buildCourse(12)
    await complete(lessonId)

    // Push it into the past and approve it, as an administrator would have.
    const { error } = await admin.client
      .from("learner_certificates")
      .update({
        expires_at: new Date(Date.now() - 86_400_000).toISOString(),
        approved: true,
      })
      .eq("course_id", courseId)
      .eq("learner_id", learner.userId)
    expect(error).toBeNull()

    const { data: row } = await admin.client
      .from("learner_certificates")
      .select("verification_code")
      .eq("course_id", courseId)
      .eq("learner_id", learner.userId)
      .single()

    const { data: verified } = await admin.client.rpc("verify_certificate", {
      p_code: row!.verification_code,
    })
    const result = (verified ?? [])[0] as { state: string; is_valid: boolean }
    expect(result.state).toBe("expired")
    expect(result.is_valid).toBe(false)
  })
})

describe.skipIf(enabled)("certificate expiry (skipped)", () => {
  it("is skipped without credentials", () => {
    expect(SKIP_REASON).toContain("Skipped is not passed")
  })
})
