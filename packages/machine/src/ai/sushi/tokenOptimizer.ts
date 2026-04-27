// ─────────────────────────────────────────────────────────────────
// tokenOptimizer.ts — Effect-native prompt compression & caching
//
// Automatically optimizes prompts before AI generation:
// - Counts tokens with rough estimation (~4 chars/token)
// - Compresses with Brotli (quality 11)
// - Caches compressed prompt in Redis (TTL: 7 days)
// - Returns cache key (~50 tokens) instead of full prompt
//
// Usage: Inject TokenOptimizer service, call optimizePrompt(text, key)
// ─────────────────────────────────────────────────────────────────

import { createHash } from "node:crypto"
import zlib from "node:zlib"
import { Context, Effect, Layer, Schema } from "effect"
import { redis } from "../../redis"

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface OptimizeResult {
  /** Whether optimization was applied */
  optimized: boolean
  /** Original token count */
  originalTokens: number
  /** Token count after optimization (cache key only if optimized) */
  finalTokens: number
  /** Tokens saved */
  tokensSaved: number
  /** Cache key for later retrieval (if optimized) */
  cacheKey: string
  /** The actual value to send to AI: original text OR cache key */
  value: string
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  compressionRatio: number
  totalTokensSaved: number
}

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const MIN_TOKEN_THRESHOLD = 300 // Only optimize if >= 300 tokens (~1200 chars)
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const COMPRESSION_QUALITY = 11 // Best compression
const CACHE_KEY_PREFIX = "prompt:opt:"

// ─────────────────────────────────────────────────────────────────
// Tiktoken-style token counting (simple UTF-8 approximation)
// ─────────────────────────────────────────────────────────────────

export function countTokens(text: string): number {
  if (!text || text.length === 0) return 0
  const chars = text.length
  const words = text.split(/\s+/).filter((w) => w.length > 0).length
  return Math.ceil(Math.max(chars / 4, words * 1.3))
}

// ─────────────────────────────────────────────────────────────────
// Compression / Decompression
// ─────────────────────────────────────────────────────────────────

function compressBrotli(text: string): Buffer {
  return zlib.brotliCompressSync(Buffer.from(text, "utf8"), {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: COMPRESSION_QUALITY },
  })
}

function decompressBrotli(buffer: Buffer): string {
  return zlib.brotliDecompressSync(buffer).toString("utf8")
}

function toBase64(buffer: Buffer): string {
  return buffer.toString("base64")
}

function fromBase64(base64: string): Buffer {
  return Buffer.from(base64, "base64")
}

// ─────────────────────────────────────────────────────────────────
// Cache key generation
// ─────────────────────────────────────────────────────────────────

export function generateCacheKey(
  text: string,
  prefix: string = CACHE_KEY_PREFIX,
): string {
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16)
  return `${prefix}${hash}`
}

// ─────────────────────────────────────────────────────────────────
// Effect service definition
// ─────────────────────────────────────────────────────────────────

// Interface for the service
export interface TokenOptimizerService {
  readonly optimizePrompt: (
    text: string,
    key?: string,
  ) => Effect.Effect<OptimizeResult, never, never>
  readonly getCached: (
    cacheKey: string,
  ) => Effect.Effect<string | null, never, never>
  readonly getStats: () => Effect.Effect<CacheStats, never, never>
  readonly clearCache: () => Effect.Effect<void, never, never>
}

// Context Tag - use "GenericTag" for simpler usage
export const TokenOptimizerTag =
  Context.GenericTag<TokenOptimizerService>("TokenOptimizer")

// ─────────────────────────────────────────────────────────────────
// Effect service implementation (async Redis)
// ─────────────────────────────────────────────────────────────────

function makeTokenOptimizerService(): TokenOptimizerService {
  // Track stats in memory
  let stats = {
    hits: 0,
    misses: 0,
    totalTokensSaved: 0,
  }

  return {
    optimizePrompt: (
      text: string,
      key?: string,
    ): Effect.Effect<OptimizeResult, never, never> => {
      const tokens = countTokens(text)

      // Skip if below threshold
      if (tokens < MIN_TOKEN_THRESHOLD) {
        return Effect.succeed({
          optimized: false,
          originalTokens: tokens,
          finalTokens: tokens,
          tokensSaved: 0,
          cacheKey: "",
          value: text,
        })
      }

      const cacheKey = key ?? generateCacheKey(text)
      const compressed = compressBrotli(text)
      const base64 = toBase64(compressed)

      // Store async in Redis and return result
      const doStore = Effect.promise(() =>
        redis.setex(cacheKey, CACHE_TTL_SECONDS, base64),
      )

      return Effect.map(doStore, () => {
        stats.totalTokensSaved += tokens - countTokens(base64)
        return {
          optimized: true,
          originalTokens: tokens,
          finalTokens: countTokens(base64),
          tokensSaved: tokens - countTokens(base64),
          cacheKey,
          value: base64,
        }
      }).pipe(
        // On Redis error, return original text
        Effect.catchAll(() =>
          Effect.succeed({
            optimized: false,
            originalTokens: tokens,
            finalTokens: tokens,
            tokensSaved: 0,
            cacheKey: "",
            value: text,
          }),
        ),
      )
    },

    getCached: (cacheKey: string): Effect.Effect<string | null, never, never> =>
      Effect.promise(() => redis.get(cacheKey)).pipe(
        Effect.map((base64) => {
          if (!base64) {
            stats.misses++
            return null
          }
          stats.hits++
          return decompressBrotli(fromBase64(base64))
        }),
        Effect.catchAll(() => Effect.succeed(null)),
      ),

    getStats: (): Effect.Effect<CacheStats, never, never> =>
      Effect.sync(() => ({
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses || 1),
        compressionRatio: stats.totalTokensSaved / (stats.hits * 1000 || 1),
        totalTokensSaved: stats.totalTokensSaved,
      })),

    clearCache: (): Effect.Effect<void, never, never> =>
      Effect.promise(() => redis.keys(`${CACHE_KEY_PREFIX}*`)).pipe(
        Effect.flatMap((keys) =>
          keys.length > 0
            ? Effect.promise(() => redis.del(...keys))
            : Effect.succeed(undefined),
        ),
        Effect.map(() => {
          stats = { hits: 0, misses: 0, totalTokensSaved: 0 }
        }),
        Effect.catchAll(() => Effect.succeed(undefined)),
      ),
  }
}

// ─────────────────────────────────────────────────────────────────
// Layer
// ─────────────────────────────────────────────────────────────────

export const TokenOptimizerLayer = Layer.succeed(
  TokenOptimizerTag,
  makeTokenOptimizerService(),
)

// ─────────────────────────────────────────────────────────────────
// Standalone utilities (no Effect/Redis dependency)
// ─────────────────────────────────────────────────────────────────

export const tokenOptimizerUtils = {
  countTokens,
  compress: (text: string) => {
    const tokens = countTokens(text)
    if (tokens < MIN_TOKEN_THRESHOLD) {
      return { compressed: false, value: text, tokens }
    }
    const compressed = compressBrotli(text)
    const base64 = toBase64(compressed)
    return { compressed: true, value: base64, tokens }
  },

  decompress: (base64: string) => {
    return decompressBrotli(fromBase64(base64))
  },

  generateCacheKey,
}
