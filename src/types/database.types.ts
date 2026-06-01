/**
 * Supabase database types.
 *
 * Minimal definition covering the identity tables needed for auth. The full
 * schema (all 13 modules) is generated in Phase 3 and will replace this file.
 */

export type UserRole = "super_admin" | "admin" | "trainer" | "learner"

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  organisation_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
    }
  }
}
