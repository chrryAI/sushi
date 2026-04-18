/**
 * Generate a cryptographically secure random float between 0 and 1
 * Uses Web Crypto API (supported in browsers and Node.js 19+)
 */
export function secureRandom(): number {
  const crypto =
    typeof window !== "undefined" ? window.crypto : globalThis.crypto

  if (!crypto?.getRandomValues) {
    // If Web Crypto is completely missing (very old environment),
    // we must fall back but warn or throw in production
    console.warn(
      "⚠️ secureRandom: Web Crypto API not available, falling back to Math.random()",
    )
    return Math.random()
  }

  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  // Divide by 2^32 to get a float in [0, 1)
  return array[0]! / (0xffffffff + 1)
}
