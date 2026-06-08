import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// The `theme` column on profiles is added in migration 074 and is not yet in the
// generated database types, so the row is read/written through a narrow cast.
type ThemeRow = { theme: string | null }

export const appearanceKeys = {
  theme: (userId: string) => ["appearance", "theme", userId] as const,
}

/** The signed-in user's saved theme, or null if none stored yet. */
export function useSavedTheme(userId: string | undefined) {
  return useQuery({
    queryKey: appearanceKeys.theme(userId ?? "anon"),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", userId!)
        .maybeSingle()
      if (error) {
        console.error("[useSavedTheme]", error)
        return null
      }
      return (data as ThemeRow | null)?.theme ?? null
    },
  })
}

/** Persist the user's theme choice to their profile (follows them everywhere). */
export function useSaveTheme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, theme }: { userId: string; theme: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ theme } as never)
        .eq("id", userId)
      if (error) throw error
    },
    onSuccess: (_d, { userId, theme }) => {
      qc.setQueryData(appearanceKeys.theme(userId), theme)
    },
  })
}
