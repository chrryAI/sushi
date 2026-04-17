import Redis from "ioredis"

// Use self-hosted Redis (coolify-redis) instead of Upstash
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://coolify-redis:6379",
  {
    password: process.env.REDIS_PASSWORD, // Add password support
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
  },
)

// Export the raw ioredis client for caching
export const redis = redisClient

// Create Upstash-compatible wrapper for @upstash/ratelimit
// @upstash/ratelimit expects specific method signatures
export const upstashRedis = {
  get: async <TData = any>(key: string): Promise<TData | null> => {
    const value = await redisClient.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as TData
    } catch {
      return value as TData
    }
  },
  set: async (
    key: string,
    value: any,
    options?: { ex?: number },
  ): Promise<"OK"> => {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value)
    if (options?.ex) {
      await redisClient.setex(key, options.ex, stringValue)
    } else {
      await redisClient.set(key, stringValue)
    }
    return "OK"
  },
  eval: async (script: string, keys: string[], args: string[]) => {
    return redisClient.eval(script, keys.length, ...keys, ...args)
  },
  evalsha: async (sha: string, keys: string[], args: string[]) => {
    return redisClient.evalsha(sha, keys.length, ...keys, ...args)
  },
}
