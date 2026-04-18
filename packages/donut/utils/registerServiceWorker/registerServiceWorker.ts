// import console from "../../utils/log"
import * as utils from ".."

// Utility to convert VAPID key - MUST be defined before use
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  if (!base64String) {
    throw new Error("base64String is undefined or empty")
  }

  // Ensure the base64 string is properly padded
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  // Check if base64 is valid before decoding
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new Error("Invalid base64 string")
  }

  // Decode base64 to binary string
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  // Ensure the buffer is explicitly typed as ArrayBuffer, not ArrayBufferLike
  return new Uint8Array(outputArray.buffer as ArrayBuffer)
}

const registerServiceWorker = async (
  FRONTEND_URL = utils.FRONTEND_URL,
): Promise<ServiceWorkerRegistration | null> => {
  // NEVER run SW in dev mode — it intercepts Vite module requests and breaks HMR
  const isDev =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.includes("dev")

  // if (isDev && "serviceWorker" in navigator) {
  //   console.log("[SW] Dev mode detected — unregistering any existing SW")
  //   const regs = await navigator.serviceWorker.getRegistrations()
  //   for (const reg of regs) {
  //     await reg.unregister()
  //     console.log("[SW] Unregistered:", reg.scope)
  //   }
  //   return null
  // }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        `${FRONTEND_URL}/sw.js`,
        {
          scope: "/",
          type: "classic", // Explicitly disable module mode
          updateViaCache: "none", // Always check for SW updates
        },
      )

      // Listen for new service worker installation FIRST (before calling update)
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        // Track if this is an update (not first install)
        const isUpdate = !!navigator.serviceWorker.controller

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && isUpdate) {
            // New version waiting - notify user or auto-reload after delay
            // Don't reload immediately on mobile to prevent loops
            console.log("[SW] New version available, waiting...")

            // On mobile, wait for user interaction or page hide/show
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
              navigator.userAgent,
            )

            if (isMobile) {
              // Mobile: Wait for visibility change or manual refresh
              // Don't auto-reload to prevent loops
              console.log(
                "[SW] Mobile detected - waiting for manual refresh or visibility change",
              )

              // Optionally notify the app (can be listened by UI)
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: "SW_UPDATE_AVAILABLE",
                })
              }
            } else {
              // Desktop: Safe to reload after a delay
              setTimeout(() => {
                if (newWorker.state === "installed") {
                  // Tell SW to skip waiting, then reload
                  newWorker.postMessage({ type: "SKIP_WAITING" })
                }
              }, 3000)
            }
          } else if (newWorker.state === "activated") {
            console.log(
              "[SW] Activated:",
              isUpdate ? "updated" : "first install",
            )
          }
        })
      })

      // Listen for controller change (new SW took over)
      // Only reload if explicitly triggered by user or after navigation
      let reloading = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Controller changed")

        // Prevent double reloads on mobile
        if (!reloading && document.visibilityState === "hidden") {
          reloading = true
          // Page is hidden, safe to reload when visible again
          window.addEventListener(
            "visibilitychange",
            () => {
              if (
                document.visibilityState === "visible" &&
                !window.location.hash.includes("no-reload")
              ) {
                window.location.reload()
              }
            },
            { once: true },
          )
        }
      })

      // Check for updates AFTER setting up listeners
      try {
        await registration.update()
      } catch (updateError) {
        console.log(
          "Service worker update check failed (will retry on next load):",
          updateError,
        )
      }

      return registration
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return null
    }
  } else {
    return null
  }
}

/**
 * Manually check for service worker updates
 */
export const checkForServiceWorkerUpdate = async (): Promise<boolean> => {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      return true
    }
  }
  return false
}

export const subscribeToPushNotifications = async (
  registration: ServiceWorkerRegistration,
  publicVapidKey: string,
  userGesture?: boolean, // ✅ Gesture kontrolü
): Promise<PushSubscription | null> => {
  console.log("[Push] Starting subscribe...", {
    vapid: !!publicVapidKey,
    gesture: !!userGesture,
    permission: Notification.permission,
  })

  if (!publicVapidKey) throw new Error("VAPID missing")
  if (!registration) throw new Error("SW missing")

  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("[Push] Permission denied:", permission)
      return null
    }

    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      console.log("[Push] ✅ Existing:", existing.endpoint)
      return existing
    }

    const applicationServerKey = urlBase64ToUint8Array(publicVapidKey)

    // ✅ 3 retry + 30sn timeout + userGesture check
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Push] Attempt ${attempt}/3 (gesture: ${userGesture})`)

        const subscription = await Promise.race([
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              applicationServerKey as ArrayBufferView<ArrayBuffer>,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout after 30s (attempt ${attempt})`)),
              30000,
            ),
          ),
        ])

        console.log("✅ SUBSCRIBED:", subscription.endpoint)
        return subscription
      } catch (error: any) {
        console.warn(`[Push] Attempt ${attempt} failed:`, error.message)
        if (attempt === 3 || !userGesture) throw error
        await new Promise((r) => setTimeout(r, 2000)) // 2s bekle
      }
    }
    return null
  } catch (error: any) {
    console.error("❌ Push failed:", error.message)
    throw error
  }
}

export default registerServiceWorker
