import { beforeAll, describe, expect, it } from "vitest"

import { anonymousClient, canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * Public certificate verification, from the position of the anonymous visitor
 * who actually uses it: an employer holding a printed certificate.
 *
 * Three answers are possible and they are not interchangeable. A certificate
 * that has expired is genuine. One that has not been approved has never been
 * issued at all, and saying "genuine but out of date" about it makes a claim
 * the company has not made, with a named person attached to it.
 */
const enabled = canRun("admin", "learner")

interface VerifyRow {
  learner_name: string | null
  course_title: string | null
  cpd_hours: number | null
  issued_at: string | null
  expires_at: string | null
  verification_code: string
  is_valid: boolean
  state: "valid" | "expired" | "not_issued"
}

describe.skipIf(!enabled)("public certificate verification", () => {
  let admin: Session
  let learner: Session

  beforeAll(async () => {
    ;[admin, learner] = await Promise.all([signInAs("admin"), signInAs("learner")])
  })

  /**
   * One course per certificate. Migration 092 puts a unique index on live
   * certificates per learner and course, which is exactly right and means each
   * case here needs its own course rather than sharing one.
   */
  async function makeCourse(label: string): Promise<string> {
    const slug = `qa-verification-${label}-${Date.now().toString(36)}`
    const { data, error } = await admin.client
      .from("courses")
      .insert({
        title: `QA verification ${label} (do not publish)`,
        slug,
        summary: "Fixture course for the verification suite.",
        cpd_hours: 3,
        duration_mins: 30,
        is_published: false,
      })
      .select("id")
      .single()
    if (error) throw error
    return data.id as string
  }

  /** Create a certificate directly, as staff, in a known state. */
  async function makeCertificate(
    label: string,
    fields: {
      approved: boolean
      expiresAt: string | null
      deleted?: boolean
    },
  ): Promise<{ code: string; courseTitle: string }> {
    const courseId = await makeCourse(label)
    const { data, error } = await admin.client
      .from("learner_certificates")
      .insert({
        learner_id: learner.userId,
        course_id: courseId,
        cpd_hours: 3,
        approved: fields.approved,
        expires_at: fields.expiresAt,
        deleted_at: fields.deleted ? new Date().toISOString() : null,
      })
      .select("verification_code")
      .single()
    if (error) throw error
    return {
      code: data.verification_code as string,
      courseTitle: `QA verification ${label} (do not publish)`,
    }
  }

  async function verify(code: string): Promise<VerifyRow | null> {
    const { data, error } = await anonymousClient().rpc("verify_certificate", {
      p_code: code,
    })
    expect(error).toBeNull()
    return ((data ?? []) as VerifyRow[])[0] ?? null
  }

  it("reports an approved, in-date certificate as valid, with its details", async () => {
    const cert = await makeCertificate("valid", {
      approved: true,
      expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    })
    const row = await verify(cert.code)
    expect(row?.state).toBe("valid")
    expect(row?.is_valid).toBe(true)
    expect(row?.learner_name).toBeTruthy()
    expect(row?.course_title).toBe(cert.courseTitle)
  })

  it("reports an approved certificate past its expiry as expired, not invalid", async () => {
    const cert = await makeCertificate("expired", {
      approved: true,
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    })
    const row = await verify(cert.code)
    expect(row?.state).toBe("expired")
    expect(row?.is_valid).toBe(false)
    // Still genuine, so the holder is still named.
    expect(row?.learner_name).toBeTruthy()
  })

  it("reports an unapproved certificate as not issued, and withholds the learner", async () => {
    const cert = await makeCertificate("pending", { approved: false, expiresAt: null })
    const row = await verify(cert.code)
    expect(row?.state).toBe("not_issued")
    expect(row?.is_valid).toBe(false)
    expect(row?.learner_name).toBeNull()
    expect(row?.course_title).toBeNull()
    expect(row?.cpd_hours).toBeNull()
    expect(row?.issued_at).toBeNull()
  })

  it("treats a withdrawn certificate as no certificate at all", async () => {
    const cert = await makeCertificate("withdrawn", {
      approved: true,
      expiresAt: null,
      deleted: true,
    })
    expect(await verify(cert.code)).toBeNull()
  })

  it("an unknown code confirms nothing", async () => {
    expect(await verify("VC-ZZZZZZ")).toBeNull()
  })

  it("an approved certificate with no expiry is valid indefinitely", async () => {
    const cert = await makeCertificate("noexpiry", { approved: true, expiresAt: null })
    const row = await verify(cert.code)
    expect(row?.state).toBe("valid")
    expect(row?.expires_at).toBeNull()
  })

  it("verification does not open the certificate table to anonymous readers", async () => {
    const { data, error } = await anonymousClient()
      .from("learner_certificates")
      .select("id, learner_id")
    expect(data ?? []).toHaveLength(0)
    if (error) expect(error).not.toBeNull()
  })
})

describe.skipIf(enabled)("public certificate verification (skipped)", () => {
  it("is skipped without credentials", () => {
    expect(SKIP_REASON).toContain("Skipped is not passed")
  })
})
