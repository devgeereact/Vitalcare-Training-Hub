import { useMutation, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase/client"
import { trainersKeys } from "@/lib/queries/trainers.queries"
import { orgKeys } from "@/lib/queries/org.queries"

interface SetVerificationInput {
  userId: string
  verified: boolean
}

/**
 * Set or clear a user's verified state. Backed by the super-admin-only
 * `set_user_verification` RPC, so the database rejects the call for anyone
 * else. On success the staff and trainer lists are refreshed so the badge
 * updates immediately.
 */
export function useSetVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, verified }: SetVerificationInput) => {
      // The RPC is not in the generated types; cast the args. Call it directly
      // on `supabase` so `this` stays bound (a detached rpc reads `this.rest`
      // and crashes with "Cannot read properties of undefined").
      const { error } = await supabase.rpc("set_user_verification" as never, {
        target_id: userId,
        make_verified: verified,
      } as never)
      if (error) {
        console.error("[useSetVerification]", error)
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trainersKeys.all })
      void qc.invalidateQueries({ queryKey: orgKeys.staff() })
    },
  })
}
