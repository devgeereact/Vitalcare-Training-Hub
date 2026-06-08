import { supabase } from "@/lib/supabase/client"
import type { Profile } from "@/types/database.types"

/** Sign in with email and password. */
export async function signInWithPassword(
  email: string,
  password: string,
  captchaToken?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  })
  if (error) {
    console.error("[signInWithPassword]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Register a new account. Profile creation is handled by a database trigger. */
export async function signUpWithPassword(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  captchaToken?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      ...(captchaToken ? { captchaToken } : {}),
    },
  })
  if (error) {
    console.error("[signUpWithPassword]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Start the Google OAuth flow. Returns control to /auth/callback on success. */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) {
    console.error("[signInWithGoogle]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Send a password reset email. */
export async function sendPasswordReset(
  email: string,
  captchaToken?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
    ...(captchaToken ? { captchaToken } : {}),
  })
  if (error) {
    console.error("[sendPasswordReset]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Set a new password for the signed-in (recovery) session. */
export async function updatePassword(
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error("[updatePassword]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Sign out the current user. */
export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("[signOut]", error)
    return { error: friendlyAuthError(error.message) }
  }
  return { error: null }
}

/** Fetch the profile row for a given user id. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .is("deleted_at", null)
    .single()
  if (error) {
    console.error("[getProfile]", error)
    return null
  }
  return data
}

/** Map raw Supabase auth messages to plain English, UK-spelled copy. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) {
    return "Those details do not match an account. Check your email and password."
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email address before signing in. Check your inbox."
  }
  if (m.includes("user already registered")) {
    return "An account already exists for that email. Try signing in instead."
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (m.includes("captcha")) {
    return "The security check could not be verified. Refresh the page and try again."
  }
  return "Something went wrong. Please try again."
}
