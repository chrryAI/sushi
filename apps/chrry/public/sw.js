// public/sw.js - Vite + Workbox Service Worker (Dev & Prod uyumlu)
// Vite HMR için dev modda pasif, prod'da tam offline-first SPA caching

const CACHE_VERSION = "{{CACHE_VERSION}}"

const IS_DEV =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname.includes("dev") ||
  location.hostname.includes("3000") // Vite dev server

// Dev modda Vite HMR bozulmasın diye hiçbir request intercept etme
if (IS_DEV) {
  addEventListener("install", () => self.skipWaiting())
  addEventListener("activate", () => self.clients.claim())
  console.log("[SW] Dev mode - Pasif (Vite HMR için)")
  self.__WB_MANIFEST = [] // Vite precache'i disable
}

// Workbox sadece prod'da yükle (CDN yerine vite-plugin-pwa ile bundle et)
if ("serviceWorker" in navigator && !IS_DEV) {
  // Vite plugin-pwa ile workbox otomatik bundle ediliyor
  if (typeof workbox !== "undefined") {
    workbox.setConfig({ debug: false })

    // 1. Vite manifest'ini precache (plugin-pwa otomatik inject)
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

    // 2. SPA Navigation - Offline index.html
    workbox.routing.registerRoute(
      ({ request }) => request.mode === "navigate",
      new workbox.strategies.NetworkFirst({
        cacheName: `pages-${CACHE_VERSION}`,
        plugins: [
          new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 10,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    )

    // 3. Vite assets (/assets/)
    workbox.routing.registerRoute(
      ({ url }) => url.pathname.startsWith("/assets/"),
      new workbox.strategies.CacheFirst({
        cacheName: `assets-${CACHE_VERSION}`,
        plugins: [
          new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 yıl
          }),
        ],
      }),
    )

    // 4. API Routes
    // AI & Messages: NetworkOnly (gerçek zamanlı)
    workbox.routing.registerRoute(
      ({ url }) => url.pathname.match(/^\/api\/(ai|messages)/),
      new workbox.strategies.NetworkOnly(),
    )

    // Diğer API: NetworkFirst (3s timeout, offline cache)
    workbox.routing.registerRoute(
      ({ url }) => url.pathname.startsWith("/api/"),
      new workbox.strategies.NetworkFirst({
        cacheName: `api-${CACHE_VERSION}`,
        networkTimeoutSeconds: 3,
        plugins: [
          new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5dk
          }),
        ],
      }),
    )

    // 5. Static: images, fonts, etc.
    workbox.routing.registerRoute(
      ({ request }) =>
        ["image", "font", "style", "script"].includes(request.destination),
      new workbox.strategies.CacheFirst({
        cacheName: `static-${CACHE_VERSION}`,
        plugins: [
          new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 300,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          }),
        ],
      }),
    )
  }
}

// Lifecycle Events (her iki modda da çalışır)
addEventListener("install", (event) => {
  self.skipWaiting() // Hemen aktif ol
})

addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.includes(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Push Notifications (opsiyonel)
addEventListener("push", (event) => {
  const { title, body, url } = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(title || "Notification", {
      body,
      icon: "/favicon.ico",
      data: { url },
    }),
  )
})

addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"))
})

// Vite HMR mesajları
addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})
