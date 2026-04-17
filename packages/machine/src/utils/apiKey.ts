import crypto from "node:crypto"

/**
 * Generate a secure API key for users
 * Format: chrry_live_xxxxxxxxxxxxxxxxxxxxx (production)
 *         chrry_test_xxxxxxxxxxxxxxxxxxxxx (development)
 */
export function generateApiKey(
  env: "production" | "development" = "production",
): string {
  const prefix = env === "production" ? "chrry_live" : "chrry_test"
  const randomBytes = crypto.randomBytes(24).toString("base64url")
  return `${prefix}_${randomBytes}`
}

/**
 * Validate API key format
 */
export function isValidApiKey(apiKey: string): boolean {
  return /^chrry_(live|test)_[A-Za-z0-9_-]{32}$/.test(apiKey)
}

/**
 * Extract environment from API key
 */
export function getApiKeyEnv(
  apiKey: string,
): "production" | "development" | null {
  if (apiKey.startsWith("chrry_live_")) return "production"
  if (apiKey.startsWith("chrry_test_")) return "development"
  return null
}
