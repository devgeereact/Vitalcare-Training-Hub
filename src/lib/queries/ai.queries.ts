import { supabase } from "@/lib/supabase/client"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/** Send the conversation to the ai-chat Edge Function and return the reply. */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { messages },
  })
  if (error) {
    console.error("[sendChat]", error)
    // invoke() sets `error` for ANY non-2xx, so the old code threw a fixed
    // "deploy the function" message and discarded the body. That sent us
    // hunting a deployment problem when the function was deployed and simply
    // out of Gemini credit. The real reason is in the response body.
    const body = await (error as { context?: Response }).context
      ?.json()
      .catch(() => null)
    if (body?.error) throw new Error(body.error as string)
    throw new Error(
      "The AI assistant could not be reached. Check the ai-chat function logs for the provider error.",
    )
  }
  if (data?.error) throw new Error(data.error)
  return data.reply as string
}

/** Persist a conversation for the current user (insert once, then update). */
export async function persistConversation(
  id: string | null,
  messages: ChatMessage[],
): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return id
  const title =
    messages.find((m) => m.role === "user")?.content.slice(0, 60) ?? "New chat"

  if (id) {
    const { error } = await supabase
      .from("ai_conversations")
      .update({ messages, title })
      .eq("id", id)
    if (error) console.error("[persistConversation:update]", error)
    return id
  }
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ user_id: auth.user.id, title, messages })
    .select("id")
    .single()
  if (error) {
    console.error("[persistConversation:insert]", error)
    return null
  }
  return data.id
}
