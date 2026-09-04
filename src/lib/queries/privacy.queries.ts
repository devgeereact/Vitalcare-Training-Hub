import { supabase } from "@/lib/supabase/client"

/**
 * A copy of everything this account holds about the signed-in person.
 *
 * Every query below filters on the signed-in user's own id and runs through the
 * ordinary client, so row-level security is the real boundary: even if this
 * code asked for someone else's rows, the database would not return them. That
 * is deliberate. An export that ran with elevated rights would turn a data
 * portability feature into a way of reading other people's training records.
 *
 * It answers the access and portability rights in one action, and it is the
 * only part of a subject access request that can be honestly automated. Erasure
 * cannot, because training and financial records have retention periods that a
 * self-service button must not override, so that route stays a request to a
 * human.
 */

/**
 * The sections of the export, each fetching one table's rows for this person.
 *
 * Written out one by one rather than looped over a list of table names: the
 * generated database types tie each table to its own columns, so a loop
 * collapses them to the columns every table shares and `learner_id` stops
 * type-checking. Explicit calls keep the column names checked against the
 * schema, which is the part worth catching at compile time.
 */
function ownedSections(
  userId: string,
): { label: string; fetch: () => PromiseLike<{ data: unknown[] | null; error: unknown }> }[] {
  return [
    {
      label: "enrolments",
      fetch: () => supabase.from("enrollments").select("*").eq("learner_id", userId),
    },
    {
      label: "lesson_progress",
      fetch: () => supabase.from("lesson_progress").select("*").eq("learner_id", userId),
    },
    {
      label: "assessment_attempts",
      fetch: () =>
        supabase.from("assessment_attempts").select("*").eq("learner_id", userId),
    },
    {
      label: "certificates",
      fetch: () =>
        supabase.from("learner_certificates").select("*").eq("learner_id", userId),
    },
    {
      label: "attendance",
      fetch: () =>
        supabase.from("attendance_records").select("*").eq("learner_id", userId),
    },
    {
      label: "session_bookings",
      fetch: () =>
        supabase.from("session_bookings").select("*").eq("learner_id", userId),
    },
    {
      label: "notifications",
      fetch: () => supabase.from("notifications").select("*").eq("user_id", userId),
    },
  ]
}

export interface PersonalDataExport {
  exported_at: string
  account_id: string
  /** Anything the export could not read, so a partial file never looks complete. */
  unavailable: string[]
  profile: unknown
  [section: string]: unknown
}

export async function buildPersonalDataExport(
  userId: string,
): Promise<PersonalDataExport> {
  const unavailable: string[] = []

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("[buildPersonalDataExport] profile", profileError)
    unavailable.push("profile")
  }

  const result: PersonalDataExport = {
    exported_at: new Date().toISOString(),
    account_id: userId,
    unavailable,
    profile: profile ?? null,
  }

  for (const { label, fetch } of ownedSections(userId)) {
    const { data, error } = await fetch()
    if (error) {
      // A table this account has no rights to read is not a failure worth
      // aborting on, but the file has to say so rather than quietly omit it.
      console.error(`[buildPersonalDataExport] ${label}`, error)
      unavailable.push(label)
      continue
    }
    result[label] = data ?? []
  }

  return result
}

/** Save the export as a JSON file. JSON because it has to be readable by another
 *  system, which is the point of the portability right. */
export function downloadPersonalDataExport(data: PersonalDataExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `vitalcare-my-data-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
