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
    throw new Error(
      "The AI assistant is unavailable. Deploy the ai-chat Edge Function and set its API keys, then try again.",
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
