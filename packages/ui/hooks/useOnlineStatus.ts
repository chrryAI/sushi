import { useEffect, useState } from "react"
import { useAuth } from "../context/providers"
import { isTauri } from "../platform/detection"
import { API_URL, apiFetch, FRONTEND_URL } from "../utils"
import useLocalStorage from "./useLocalStorage"

const THROTTLE_MS = 5000 // 5 seconds

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastCheck, setLastCheck] = useLocalStorage(
    "vex_health_check_throttle",
    0,
  )
  const [isChecking, setIsChecking] = useLocalStorage(
    "vex_health_check_in_progress",
    false,
  )

  const { user, guest } = useAuth()

  useEffect(() => {
    // Skip if window or addEventListener is not available (React Native)
    if (typeof window === "undefined" || !window.addEventListener) {
      return
    }

    function updateStatus() {
      // Skip navigator.onLine in Tauri - it's unreliable
      // We use API health checks instead
      if (!isTauri()) {
        setIsOnline(navigator.onLine)
      }
    }

    async function checkConnection() {
      // Skip health check if no user or guest (not authenticated)
      if (!user && !guest) {
        return
      }

      const now = Date.now()

      // Throttle: skip if called too soon OR if already checking
      if (now - lastCheck < THROTTLE_MS || isChecking) {
        return
      }

      setLastCheck(now)
      setIsChecking(true)

      try {
        // In Tauri, only check API health (no frontend server)
        if (isTauri()) {
          // Tauri: only check API
          const apiResponse = await apiFetch(`${API_URL}/health`, {
            method: "HEAD",
            cache: "no-store",
          }).catch(() => null)

          setIsOnline(apiResponse?.ok ?? false)
        } else {
          // Web/Extension: check both API and frontend health
          const [apiResponse, webResponse] = await Promise.all([
            apiFetch(`${API_URL}/health`, {
              method: "HEAD",
              cache: "no-store",
            }).catch(() => null),
            apiFetch(`${FRONTEND_URL}/api/health`, {
              method: "HEAD",
              cache: "no-store",
            }).catch(() => null),
          ])

          // Both API and web must be online
          const apiOnline = apiResponse?.ok ?? false
          const webOnline = webResponse?.ok ?? false

          setIsOnline(apiOnline && webOnline)
        }
      } catch (_error) {
        // Silent fail - network errors are expected when offline
        // Don't send to Sentry as this is normal behavior
        setIsOnline(false)
      } finally {
        setIsChecking(false)
      }
    }

    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)
    // window.addEventListener("focus", checkConnection)

    // Seems stable for now
    // Initial check in case navigator.onLine is wrong
    // checkConnection()

    // Recheck every 30s to detect server outages
    // const interval = setInterval(checkConnection, 30000)

    // return () => {
    //   if (window.removeEventListener) {
    //     window.removeEventListener("online", updateStatus)
    //     window.removeEventListener("offline", updateStatus)
    //     window.removeEventListener("focus", checkConnection)
    //   }
    //   clearInterval(interval)
    // }
  }, [user?.id, guest?.id])

  return isOnline
}
