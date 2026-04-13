import { useCallback, useState } from "react"

/**
 * Fallback agent images for broken/missing chat files
 * Add your image paths here - these should be publicly accessible
 */
export const FALLBACK_AGENT_IMAGES: string[] = [
  // Add your agent image URLs here
  // Example:
  // "/images/agents/abstract.png",
  // "/images/agents/cable.png",
  // "/images/agents/coral-tube.png",
]

/**
 * Get a random fallback image from the array
 */
export function getRandomFallbackImage(): string | null {
  if (FALLBACK_AGENT_IMAGES.length === 0) return null
  const randomIndex = Math.floor(Math.random() * FALLBACK_AGENT_IMAGES.length)
  return FALLBACK_AGENT_IMAGES[randomIndex] || null
}

/**
 * Hook to handle image loading errors with fallback
 * Usage:
 *   const { src, onError } = useImageFallback(originalUrl)
 *   <img src={src} onError={onError} />
 */
export function useImageFallback(originalSrc: string | undefined) {
  const [src, setSrc] = useState(originalSrc)
  const [hasFailed, setHasFailed] = useState(false)

  const onError = useCallback(() => {
    if (hasFailed) return // Prevent infinite loop

    const fallback = getRandomFallbackImage()
    if (fallback) {
      setSrc(fallback)
      setHasFailed(true)
    }
  }, [hasFailed])

  return { src: src || getRandomFallbackImage() || "", onError }
}

/**
 * Simple fallback handler for img elements
 * Usage:
 *   <img src={url} onError={handleImageError} />
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
) {
  const fallback = getRandomFallbackImage()
  if (fallback && event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback
  }
}
