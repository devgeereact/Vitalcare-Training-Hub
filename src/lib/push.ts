import { supabase } from "@/lib/supabase/client"

// VAPID public key is safe to ship to the browser. The matching private key
// lives only as the VAPID_PRIVATE secret in the send-push Edge Function.
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BKRoUnGuaFQJkW9vWIAefIgEwMZzlUYnYOGwDaKd-RlNvXjVc4u8geP5nOcnIjKz5NAB1CAY-55xkwGPY93mVrU"

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  try {
    return await navigator.serviceWorker.register("/sw.js")
  } catch (err) {
    console.error("[registerServiceWorker]", err)
    return null
  }
}

/** Ask permission, subscribe to push, and persist the subscription. */
export async function enablePush(userId: string): Promise<boolean> {
  if (!pushSupported()) throw new Error("Push is not supported on this device.")

  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Notification permission was declined.")

  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready)
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))

  const json = sub.toJSON()
  if (!json.endpoint || !json.keys) throw new Error("Could not read the subscription.")

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" },
  )
  if (error) {
    console.error("[enablePush]", error)
    throw new Error("Could not save your subscription.")
  }
  return true
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return false
    const sub = await reg.pushManager.getSubscription()
    return !!sub && Notification.permission === "granted"
  } catch {
    return false
  }
}
