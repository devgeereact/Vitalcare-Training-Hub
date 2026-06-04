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
      // The RPC is not in the generated types; call it through a narrow cast.
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>
      const { error } = await rpc("set_user_verification", {
        target_id: userId,
        make_verified: verified,
      })
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
