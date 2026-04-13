import { useCallback, useEffect } from "react"

import { usePlatform } from "../platform"
import { platformCookies } from "../platform/cookies"
import useLocalStorage from "./useLocalStorage"

export default function useCookieOrLocalStorage(
  key: string,
  initialValue: any,
  canReadCookie: boolean = false,
  currentUrl?: string,
) {
  const [local, setLocalInternal] = useLocalStorage(key, initialValue)

  // Sync cookie to localStorage on mount (for extension/native)
  useEffect(() => {
    if (!canReadCookie) {
      return
    }

    ;(async () => {
      const cookieValue = await platformCookies.get(key, currentUrl)
      if (cookieValue) {
        setLocalInternal(cookieValue)
      }
    })()
  }, [key, canReadCookie, setLocalInternal, currentUrl])

  // Extensions/native: read from cookie (cross-site), write to localStorage
  const state = local || initialValue

  const setState = useCallback(
    (value: any) => {
      setLocalInternal(value)
    },
    [setLocalInternal],
  )

  return [state, setState] as const
}
