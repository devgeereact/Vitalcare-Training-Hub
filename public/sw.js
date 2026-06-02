// Vitalcare Training Hub — service worker.
// Handles web-push delivery and notification clicks. Kept minimal: no offline
// caching, so it never serves stale app builds from Vercel.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: "Vitalcare", body: event.data ? event.data.text() : "" }
  }
  const title = payload.title || "Vitalcare Training Hub"
  const options = {
    body: payload.body || "",
    icon: "/logos/logo-round-navy.svg",
    badge: "/logos/logo-round-navy.svg",
    data: { url: payload.url || "/platform/notifications" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/platform/notifications"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
