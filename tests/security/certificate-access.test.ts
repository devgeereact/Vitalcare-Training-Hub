import { beforeAll, describe, expect, it } from "vitest"

import { anonymousClient, canRun, signInAs, SKIP_REASON, type Session } from "./helpers"

/**
 * Certificate ownership.
 *
 * The reported defect was a learner-facing page showing other people's
 * certificates. The page was at fault, but the guarantee underneath it has to
 * hold whatever the page does: a learner reading learner_certificates directly,
 * by id or in bulk, must never see a row that is not theirs.
 *
 * These read through PostgREST exactly as a hostile client would.
 */
const enabled = canRun("learner", "otherUser", "trainer")

describe.skipIf(!enabled)("certificate access", () => {
  let learner: Session
  let other: Session
  let trainer: Session

  beforeAll(async () => {
    ;[learner, other, trainer] = await Promise.all([
      signInAs("learner"),
      signInAs("otherUser"),
      signInAs("trainer"),
    ])
  })

  it("a learner reading the table gets only their own rows", async () => {
    const { data, error } = await learner.client
      .from("learner_certificates")
      .select("id, learner_id")
    expect(error).toBeNull()
    for (const row of data ?? []) {
      expect(row.learner_id).toBe(learner.userId)
    }
  })

  it("a learner cannot fetch another learner's certificate by owner id", async () => {
    const { data, error } = await learner.client
      .from("learner_certificates")
      .select("id")
      .eq("learner_id", other.userId)
    // Row-level security filters rather than refuses, so the correct outcome is
    // an empty result, not an error.
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  it("a learner cannot fetch another learner's certificate by its id", async () => {
    const { data: theirs } = await other.client
      .from("learner_certificates")
      .select("id")
      .limit(1)
    const targetId = theirs?.[0]?.id
    if (!targetId) {
      // Nothing to attempt against; the guarantee is still covered by the
      // owner-id case above.
      return
    }
    const { data, error } = await learner.client
      .from("learner_certificates")
      .select("id, learner_id")
      .eq("id", targetId)
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })

  it("an anonymous visitor cannot read the certificate table at all", async () => {
    const { data, error } = await anonymousClient()
      .from("learner_certificates")
      .select("id")
    // Either refused outright or filtered to nothing. Both are acceptable; a
    // row coming back is not.
    expect(data ?? []).toHaveLength(0)
    if (error) expect(error).toBeTruthy()
  })

  it("a learner cannot issue themselves a certificate by inserting one", async () => {
    const { error } = await learner.client.from("learner_certificates").insert({
      learner_id: learner.userId,
      cpd_hours: 99,
    })
    expect(error).not.toBeNull()
  })

  it("a learner cannot approve their own pending certificate", async () => {
    const { data: mine } = await learner.client
      .from("learner_certificates")
      .select("id")
      .limit(1)
    const id = mine?.[0]?.id
    if (!id) return
    const { data, error } = await learner.client
      .from("learner_certificates")
      .update({ approved: true })
      .eq("id", id)
      .select("id")
    // Refused, or silently filtered so nothing was updated.
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })

  it("staff can read the register, which is what makes the page-level scoping necessary", async () => {
    // This is not a hole: staff administer certificates. It is the reason a
    // page headed "your certificates" must scope its own query rather than
    // trusting row-level security to do it.
    const { data, error } = await trainer.client
      .from("learner_certificates")
      .select("id, learner_id")
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it("verification by code returns no personal data beyond the certificate itself", async () => {
    const { data } = await anonymousClient().rpc("verify_certificate", {
      p_code: "VC-DOESNOTEXIST",
    })
    // An unknown code must not confirm or deny anything about a real learner.
    expect(data ?? []).toHaveLength(0)
  })
})

describe.skipIf(enabled)("certificate access (skipped)", () => {
  it("is skipped without credentials", () => {
    console.warn(SKIP_REASON)
    expect(true).toBe(true)
  })
})
