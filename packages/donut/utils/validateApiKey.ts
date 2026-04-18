/**
 * API Key validation utility
 * Centralized for use in both Frontend (packages/donut) and API (apps/api).
 */

export type ProviderName =
  | "openai"
  | "anthropic"
  | "google"
  | "deepseek"
  | "perplexity"
  | "replicate"
  | "fal"
  | "openrouter"
  | "xai"
  | "s3"

const PROVIDER_REGEX: Record<string, RegExp> = {
  openai: /^sk-[a-zA-Z0-9]{32,}$/,
  openrouter: /^sk-or-v1-[a-f0-9]{64}$/,
  anthropic: /^sk-ant-api03-[a-zA-Z0-9-]{90,100}$/,
  google: /^AIza[a-zA-Z0-9_-]{35}$/,
  deepseek: /^sk-[a-z0-9]{32}$/,
  perplexity: /^pplx-[a-z0-9]{32}$/,
  replicate: /^r8_[a-zA-Z0-9]{34,}$/,
  fal: /^fal_[a-zA-Z0-9]{32,}$/,
  xai: /^xai-[a-zA-Z0-9]{32,}$/,
  s3: /^s3:\/\//,
}

/**
 * Validates an API key based on the provider's typical format.
 */
export function validateApiKey(provider: ProviderName, key: string): boolean {
  const trimmedKey = key.trim()
  if (!trimmedKey) return false

  const regex = PROVIDER_REGEX[provider]
  if (!regex) return true // Generic fallback if we don't have a specific regex

  return regex.test(trimmedKey)
}

/**
 * Normalizes provider name from request fields
 */
export function normalizeProviderName(field: string): ProviderName | null {
  const lower = field.toLowerCase()
  if (lower.includes("openai")) return "openai"
  if (lower.includes("openrouter")) return "openrouter"
  if (lower.includes("anthropic")) return "anthropic"
  if (lower.includes("google") || lower.includes("gemini")) return "google"
  if (lower.includes("deepseek")) return "deepseek"
  if (lower.includes("perplexity")) return "perplexity"
  if (lower.includes("replicate")) return "replicate"
  if (lower.includes("fal")) return "fal"
  if (lower.includes("xai")) return "xai"
  if (lower.includes("s3")) return "s3"
  return null
}
