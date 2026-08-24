import { beforeAll, describe, expect, it } from "vitest"

import { anonymousClient, canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * What one signed-in person can read about another.
 *
 * These are written as an attacker would run them: sign in as an ordinary user,
 * then ask the API directly for somebody else's records by id, by owner id and
 * in bulk. The user interface is not involved, because hiding a button is not
 * an access control.
 */
const enabled = canRun("learner", "otherUser", "trainer", "admin")

/**
 * Organisation scoping arrives with migration 092. Until it is applied a
 * trainer can read every learner record on the platform regardless of
 * organisation, so those assertions are skipped rather than failed, and the
 * skip says why. A skipped test is not a passing test.
 */
const orgScoped = process.env.MIGRATION_092_APPLIED === "1"

describe.skipIf(!enabled)("cross-user data isolation", () => {
  let learner: Session
  let other: Session
  let trainer: Session
  let admin: Session

  beforeAll(async () => {
    ;[learner, other, trainer, admin] = await Promise.all([
      signInAs("learner"),
      signInAs("otherUser"),
      signInAs("trainer"),
      signInAs("admin"),
    ])
  })

  describe("profiles", () => {
    it("a non-staff user sees only their own profile", async () => {
      const { data, error } = await learner.client.from("profiles").select("id, email")
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(1)
      expect(data![0].id).toBe(learner.userId)
    })

    it("asking for another user's profile by id returns nothing", async () => {
      const { data, error } = await learner.client
        .from("profiles")
        .select("id, email, phone")
        .eq("id", other.userId)
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(0)
    })

    it("an anonymous visitor cannot read any profile", async () => {
      const { data } = await anonymousClient().from("profiles").select("id, email")
      expect(data ?? []).toHaveLength(0)
    })

    it("a learner cannot promote themselves", async () => {
      const { data, error } = await learner.client
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", learner.userId)
        .select("id, role")
      // Either refused, or the role guard leaves it unchanged.
      const stillLearner =
        error !== null || (data ?? []).every((r) => r.role !== "super_admin")
      expect(stillLearner).toBe(true)
    })

    it("a learner cannot move themselves into another organisation", async () => {
      const { data: mine } = await learner.client
        .from("profiles")
        .select("organisation_id")
        .eq("id", learner.userId)
        .maybeSingle()
      const original = mine?.organisation_id ?? null
      await learner.client
        .from("profiles")
        .update({ organisation_id: "00000000-0000-0000-0000-000000000001" })
        .eq("id", learner.userId)
      const { data: after } = await learner.client
        .from("profiles")
        .select("organisation_id")
        .eq("id", learner.userId)
        .maybeSingle()
      expect(after?.organisation_id ?? null).toBe(original)
    })
  })

  describe("learner records", () => {
    const OWNED = [
      "enrollments",
      "lesson_progress",
      "assessment_attempts",
      "attendance_records",
      "session_bookings",
    ] as const

    for (const table of OWNED) {
      it(`${table}: a non-staff user reads only their own rows`, async () => {
        const { data, error } = await learner.client.from(table).select("*")
        expect(error).toBeNull()
        for (const row of (data ?? []) as { learner_id?: string }[]) {
          if (row.learner_id !== undefined) {
            expect(row.learner_id).toBe(learner.userId)
          }
        }
      })

      it(`${table}: asking for another user's rows returns nothing`, async () => {
        const { data, error } = await learner.client
          .from(table)
          .select("id")
          .eq("learner_id", other.userId)
        expect(error).toBeNull()
        expect(data ?? []).toHaveLength(0)
      })
    }

    it("attempt answers are readable only through an attempt you own", async () => {
      const { data, error } = await learner.client
        .from("attempt_answers")
        .select("attempt_id")
      expect(error).toBeNull()
      const attemptIds = [...new Set((data ?? []).map((r) => r.attempt_id))]
      if (attemptIds.length === 0) return
      const { data: mine } = await learner.client
        .from("assessment_attempts")
        .select("id")
        .in("id", attemptIds)
      expect(mine ?? []).toHaveLength(attemptIds.length)
    })
  })

  describe("assessment integrity", () => {
    it("a learner cannot read the answer key", async () => {
      const { data } = await learner.client.rpc("get_question_options", {
        p_assessment: "00000000-0000-0000-0000-000000000000",
      })
      // Nothing for a made-up assessment; the masking itself is checked below
      // against a real one.
      expect(data ?? []).toHaveLength(0)

      const { data: assessments } = await learner.client
        .from("assessments")
        .select("id")
        .eq("is_published", true)
        .limit(1)
      const id = assessments?.[0]?.id
      if (!id) return
      const { data: options } = await learner.client.rpc("get_question_options", {
        p_assessment: id,
      })
      const rows = (options ?? []) as { is_correct: boolean }[]
      if (rows.length === 0) return
      // Every option comes back marked incorrect for a learner: the key is
      // masked server-side rather than filtered in the browser.
      expect(rows.every((o) => o.is_correct === false)).toBe(true)
    })

    it("staff do see the answer key, which is what the quiz builder needs", async () => {
      const { data: assessments } = await trainer.client
        .from("assessments")
        .select("id")
        .limit(1)
      const id = assessments?.[0]?.id
      if (!id) return
      const { data: options } = await trainer.client.rpc("get_question_options", {
        p_assessment: id,
      })
      const rows = (options ?? []) as { is_correct: boolean }[]
      if (rows.length === 0) return
      expect(rows.some((o) => o.is_correct === true)).toBe(true)
    })

    it("a learner cannot insert an attempt directly, forging a pass", async () => {
      const { data: assessments } = await learner.client
        .from("assessments")
        .select("id")
        .eq("is_published", true)
        .limit(1)
      const id = assessments?.[0]?.id
      if (!id) return
      const { error } = await learner.client.from("assessment_attempts").insert({
        assessment_id: id,
        learner_id: learner.userId,
        score: 100,
        passed: true,
      })
      expect(error).not.toBeNull()
    })

    it("a learner cannot flip an existing attempt to passed", async () => {
      const { data: mine } = await learner.client
        .from("assessment_attempts")
        .select("id, passed")
        .limit(1)
      const attempt = mine?.[0]
      if (!attempt) return
      await learner.client
        .from("assessment_attempts")
        .update({ passed: true, score: 100 })
        .eq("id", attempt.id)
      const { data: after } = await learner.client
        .from("assessment_attempts")
        .select("passed")
        .eq("id", attempt.id)
        .maybeSingle()
      expect(after?.passed).toBe(attempt.passed)
    })
  })

  describe("privileged operations", () => {
    it("a learner cannot archive a course", async () => {
      const { data: courses } = await learner.client
        .from("courses")
        .select("id")
        .limit(1)
      const id = courses?.[0]?.id
      if (!id) return
      const { error } = await learner.client.rpc("archive_course", { p_course: id })
      expect(error).not.toBeNull()
    })

    it("a learner cannot confirm an order", async () => {
      const { error } = await learner.client.rpc("confirm_order", {
        p_order: "00000000-0000-0000-0000-000000000000",
      })
      // Refused outright, or the function itself refuses a non-staff caller.
      expect(error).not.toBeNull()
    })

    it("a learner cannot write a course", async () => {
      const { error } = await learner.client.from("courses").insert({
        title: "Injected by a learner",
      })
      expect(error).not.toBeNull()
    })

    it("a learner cannot read the audit log", async () => {
      const { data } = await learner.client.from("audit_logs").select("id")
      expect(data ?? []).toHaveLength(0)
    })
  })

  describe.skipIf(!orgScoped)("organisation scoping (migration 092)", () => {
    it("a trainer sees only their own organisation's learners", async () => {
      const { data: me } = await trainer.client
        .from("profiles")
        .select("organisation_id")
        .eq("id", trainer.userId)
        .maybeSingle()
      const { data } = await trainer.client
        .from("profiles")
        .select("id, organisation_id")
      for (const row of data ?? []) {
        expect(row.organisation_id).toBe(me?.organisation_id)
      }
    })

    it("an admin sees only their own organisation's certificates", async () => {
      const { data: me } = await admin.client
        .from("profiles")
        .select("organisation_id")
        .eq("id", admin.userId)
        .maybeSingle()
      const { data: certs } = await admin.client
        .from("learner_certificates")
        .select("learner_id")
      const owners = [...new Set((certs ?? []).map((c) => c.learner_id))]
      if (owners.length === 0) return
      const { data: profiles } = await admin.client
        .from("profiles")
        .select("id, organisation_id")
        .in("id", owners)
      for (const p of profiles ?? []) {
        expect(p.organisation_id).toBe(me?.organisation_id)
      }
    })

    it("every profile belongs to an organisation", async () => {
      const { data } = await admin.client
        .from("profiles")
        .select("id, organisation_id")
      for (const row of data ?? []) {
        expect(row.organisation_id).not.toBeNull()
      }
    })
  })
})

describe.skipIf(enabled)("cross-user data isolation (skipped)", () => {
  it("is skipped without credentials", () => {
    console.warn(SKIP_REASON)
    expect(true).toBe(true)
  })
})
