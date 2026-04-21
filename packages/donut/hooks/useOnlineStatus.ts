import { useEffect, useState } from "react"
import { useAuth } from "../context/providers"
import { isTauri } from "../platform/detection"
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

  const { user, guest, isDevelopment, isE2E } = useAuth()

  useEffect(() => {
    if (!isDevelopment) return
    if (!isE2E) return
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

    const isAppOnline = async () => {
      if (!window.navigator.onLine) return false

      const url = new URL(window.location.origin)
      url.searchParams.set("q", new Date().toString())

      try {
        const response = await fetch(url.toString(), { method: "HEAD" })

        return response.ok
      } catch {
        return false
      }
    }

    async function checkConnection() {
      if (!user && !guest) {
        return
      }

      const now = Date.now()

      if (now - lastCheck < THROTTLE_MS || isChecking) {
        return
      }

      setLastCheck(now)
      setIsChecking(true)

      setIsOnline(await isAppOnline())
    }

    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)
    // window.addEventListener("focus", checkConnection)

    // Seems stable for now
    // Initial check in case navigator.onLine is wrong
    checkConnection()

    // Recheck every 30s to detect server outages
    const interval = setInterval(checkConnection, 70000)

    return () => {
      if (window.removeEventListener) {
        window.removeEventListener("online", updateStatus)
        window.removeEventListener("offline", updateStatus)
        window.removeEventListener("focus", checkConnection)
      }
      clearInterval(interval)
    }
  }, [user?.id, guest?.id])

  return isOnline
}
