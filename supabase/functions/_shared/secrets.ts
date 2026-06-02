// Shared secret resolver for Edge Functions.
// Prefers a value set via the Integrations page (integration_settings table),
// falling back to the deploy-time env secret. Requires a service-role client.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export async function getSecret(
  admin: SupabaseClient,
  name: string,
): Promise<string | undefined> {
  try {
    const { data } = await admin
      .from("integration_settings")
      .select("value")
      .eq("name", name)
      .maybeSingle()
    if (data?.value) return data.value
  } catch (err) {
    console.error("[getSecret]", name, err)
  }
  return Deno.env.get(name) ?? undefined
}
