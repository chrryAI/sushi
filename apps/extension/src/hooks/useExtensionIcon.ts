import { useEffect } from "react"
import { updateExtensionIcon } from "../utils/updateIcon"

/**
 * Hook to automatically update extension icon based on current app
 * @param slug - Current app slug (atlas, peach, vault, etc.)
 */
export const useExtensionIcon = (slug?: string) => {
  useEffect(() => {
    if (slug) {
      updateExtensionIcon(slug)
    }
  }, [slug])
}
