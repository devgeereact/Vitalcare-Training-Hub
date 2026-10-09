import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The data export answers a subject access request, so two properties matter
 * more than the shape of the file.
 *
 * It must ask only for the signed-in person's own rows. Row-level security is
 * the real boundary, but a query that filtered on the wrong column would send
 * a request for somebody else's records and rely entirely on the database to
 * refuse it. These tests read the filters that were actually applied.
 *
 * And a section it could not read must be named in the file. A partial export
 * that looks complete is worse than a failed one, because the person believes
 * they have everything.
 */

interface RecordedQuery {
  table: string
  column: string
  value: string
}

const recorded: RecordedQuery[] = []
let failingTables: string[] = []

vi.mock("@/lib/supabase/client", () => {
  function builder(table: string) {
    return {
      select: () => ({
        eq: (column: string, value: string) => {
          recorded.push({ table, column, value })
          const failed = failingTables.includes(table)
          const result = failed
            ? { data: null, error: { message: "denied" } }
            : { data: [{ id: `${table}-row` }], error: null }
          // The profile read chains .maybeSingle(); the rest are awaited
          // directly, so the object has to work both ways.
          return Object.assign(Promise.resolve(result), {
            maybeSingle: () =>
              Promise.resolve(
                failed
                  ? { data: null, error: { message: "denied" } }
                  : { data: { id: value, email: "learner@example.com" }, error: null },
              ),
          })
        },
      }),
    }
  }
  return { supabase: { from: (table: string) => builder(table) } }
})

const { buildPersonalDataExport } = await import("@/lib/queries/privacy.queries")

describe("buildPersonalDataExport", () => {
  beforeEach(() => {
    recorded.length = 0
    failingTables = []
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("asks only for rows belonging to the signed-in account", async () => {
    await buildPersonalDataExport("user-1")

    expect(recorded.length).toBeGreaterThan(0)
    for (const query of recorded) {
      expect(query.value).toBe("user-1")
    }
  })

  it("filters each table on the column that owns the row", async () => {
    await buildPersonalDataExport("user-1")

    const byTable = Object.fromEntries(recorded.map((q) => [q.table, q.column]))
    expect(byTable.profiles).toBe("id")
    expect(byTable.enrollments).toBe("learner_id")
    expect(byTable.lesson_progress).toBe("learner_id")
    expect(byTable.assessment_attempts).toBe("learner_id")
    expect(byTable.learner_certificates).toBe("learner_id")
    expect(byTable.attendance_records).toBe("learner_id")
    expect(byTable.session_bookings).toBe("learner_id")
    expect(byTable.notifications).toBe("user_id")
  })

  it("includes every section when each read succeeds", async () => {
    const result = await buildPersonalDataExport("user-1")

    expect(result.unavailable).toEqual([])
    expect(result.profile).not.toBeNull()
    expect(result.certificates).toEqual([{ id: "learner_certificates-row" }])
    expect(result.account_id).toBe("user-1")
  })

  it("names a section it could not read rather than omitting it silently", async () => {
    failingTables = ["learner_certificates"]

    const result = await buildPersonalDataExport("user-1")

    expect(result.unavailable).toContain("certificates")
    expect(result.certificates).toBeUndefined()
    // The rest of the export still arrives.
    expect(result.enrolments).toEqual([{ id: "enrollments-row" }])
  })
})
