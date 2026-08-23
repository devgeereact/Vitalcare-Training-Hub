import type { PostgrestError } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase/client"

/**
 * Call a Postgres function (an RPC) and get back the usual `{ data, error }`.
 *
 * The generated database types do not describe this project's functions, so
 * call sites used to work around the types by casting `supabase.rpc` to a plain
 * function and calling it on its own:
 *
 *     const rpc = supabase.rpc as unknown as (fn: string, args: object) => ...
 *     const { data } = await rpc("issue_course_certificate", { p_course: id })
 *
 * That detaches the method from the client. supabase-js reads `this.rest`
 * inside `rpc`, so the detached call threw "Cannot read properties of undefined
 * (reading 'rest')" before any request was sent, and every RPC in the app
 * failed: certificates were never issued, quiz questions loaded with no
 * options, coupons never redeemed. The throw is a TypeError rather than a
 * returned `error`, so callers that only checked `error` saw nothing.
 *
 * Keeping the call on the client object is the whole fix. Route RPCs through
 * here rather than casting at the call site.
 */
export async function callRpc<T>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const client = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: T | null; error: PostgrestError | null }>
  }
  return client.rpc(fn, args)
}
