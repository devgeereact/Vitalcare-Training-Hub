import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface TrainerRow {
  id: string
  profileId: string
  name: string
  email: string
  bio: string
  specialisms: string[]
  sessionsCount: number
  isVerified: boolean
}

export const trainersKeys = {
  all: ["trainers"] as const,
  list: () => [...trainersKeys.all, "list"] as const,
}

export function useTrainers() {
  return useQuery({
    queryKey: trainersKeys.list(),
    queryFn: async (): Promise<TrainerRow[]> => {
      // Trainers are profiles with role trainer; trainer_profiles holds the
      // extended bio/specialisms (may not exist yet for every trainer).
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, full_name, is_verified")
        .eq("role", "trainer")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error) {
        console.error("[useTrainers]", error)
        throw error
      }
      const list = profiles ?? []
      if (list.length === 0) return []

      const ids = list.map((p) => p.id)
      const [{ data: tp }, { data: sessions }] = await Promise.all([
        supabase
          .from("trainer_profiles")
          .select("profile_id, bio, specialisms")
          .in("profile_id", ids),
        supabase
          .from("training_sessions")
          .select("trainer_id")
          .in("trainer_id", ids)
          .is("deleted_at", null),
      ])
      const extById = new Map((tp ?? []).map((t) => [t.profile_id, t]))
      const sessionCount = new Map<string, number>()
      for (const s of sessions ?? []) {
        if (!s.trainer_id) continue
        sessionCount.set(s.trainer_id, (sessionCount.get(s.trainer_id) ?? 0) + 1)
      }

      return list.map((p) => {
        const ext = extById.get(p.id)
        return {
          id: p.id,
          profileId: p.id,
          name:
            p.full_name ||
            [p.first_name, p.last_name].filter(Boolean).join(" ") ||
            "Unnamed trainer",
          email: p.email,
          bio: ext?.bio ?? "",
          specialisms: (ext?.specialisms as string[] | null) ?? [],
          sessionsCount: sessionCount.get(p.id) ?? 0,
          isVerified: !!p.is_verified,
        }
      })
    },
  })
}
