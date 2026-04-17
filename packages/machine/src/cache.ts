import { redis } from "./redis"

/**
 * Cache management for apps and stores
 * Uses Upstash Redis for fast, distributed caching
 */

const isCI = process.env.CI
const isDevelopment = process.env.NODE_ENV === "development"
// Disable cache in development for easier debugging
const CACHE_ENABLED =
  !isCI &&
  !isDevelopment &&
  (process.env.NODE_ENV === "production" || process.env.ENABLE_CACHE === "true")

// Cache TTLs (in seconds)
const CACHE_TTL = {
  APP: 60 * 5, // 5 minutes
  APPS_LIST: 60 * 2, // 2 minutes (shorter for lists)
  STORE: 60 * 10, // 10 minutes
  STORES_LIST: 60 * 5, // 5 minutes
  USER: 60 * 2, // 2 minutes (users change more often)
  GUEST: 60 * 2, // 2 minutes
  TRANSLATIONS: 60 * 60 * 24, // 24 hours (translations rarely change)
}

// Redact potentially sensitive parts of cache keys before logging
function redactCacheKeyForLogging(key: string): string {
  // Mask API keys in user cache keys like "user:apiKey:<actual-api-key>"
  const apiKeyPrefix = "user:apiKey:"
  if (key.startsWith(apiKeyPrefix)) {
    return `${apiKeyPrefix}***REDACTED***`
  }

  // Fallback: if "apiKey" appears anywhere else, avoid logging the full key
  if (key.toLowerCase().includes("apikey")) {
    return "[REDACTED CACHE KEY WITH API KEY]"
  }

  return key
}

// Cache key generators
export const cacheKeys = {
  app: (id: string) => `app:${id}`,
  appBySlug: (slug: string) => `app:slug:${slug}`,
  apps: (userId?: string, storeId?: string) =>
    `apps:${userId || "all"}:${storeId || "all"}`,
  store: (id: string) => `store:${id}`,
  storeBySlug: (slug: string) => `store:slug:${slug}`,
  storeByDomain: (domain: string) => `store:domain:${domain}`,
  storeByAppId: (appId: string) => `store:app:${appId}`,
  stores: (userId?: string, parentStoreId?: string) =>
    `stores:${userId || "all"}:${parentStoreId || "all"}`,
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  guest: (id: string) => `guest:${id}`,
  guestByFingerprint: (fingerprint: string) => `guest:fp:${fingerprint}`,
  translations: (locale: string) => `translations:${locale}`,
}

// Generic cache get/set
export async function getCache<T>(key: string): Promise<T | null> {
  if (!CACHE_ENABLED) {
    return null // Cache disabled
  }

  const safeKey = redactCacheKeyForLogging(key)

  try {
    const cached = await redis.get(key)
    if (!cached) return null

    // Cache hit - no logging to avoid massive production logs
    try {
      return JSON.parse(cached) as T
    } catch (parseError) {
      console.error(`❌ Cache JSON parse error for ${safeKey}:`, parseError)
      // Invalid JSON in cache, delete it
      await redis.del(key)
      return null
    }
  } catch (error) {
    console.error(`❌ Cache GET error for ${safeKey}:`, error)
    return null
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl: number,
): Promise<void> {
  if (!CACHE_ENABLED) {
    return // Cache disabled
  }

  try {
    await redis.setex(key, ttl, JSON.stringify(value))
    // Cache set - no logging to avoid massive production logs
  } catch (error) {
    console.error("❌ Cache SET error:", error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!CACHE_ENABLED) {
    return // Cache disabled
  }

  try {
    await redis.del(key)
    // Cache delete - no logging to avoid verbose logs
  } catch (error) {
    console.error("❌ Cache DELETE error:", error)
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!CACHE_ENABLED) {
    return // Cache disabled
  }

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      // Cache pattern delete - no logging to avoid verbose logs
    }
  } catch (error) {
    console.error(`❌ Cache DELETE pattern error for ${pattern}:`, error)
  }
}

// App cache helpers
export async function getCachedApp(id: string) {
  return getCache(cacheKeys.app(id))
}

export async function setCachedApp(id: string, app: any) {
  await setCache(cacheKeys.app(id), app, CACHE_TTL.APP)
}

export async function getCachedAppBySlug(slug: string) {
  return getCache(cacheKeys.appBySlug(slug))
}

export async function setCachedAppBySlug(slug: string, app: any) {
  await setCache(cacheKeys.appBySlug(slug), app, CACHE_TTL.APP)
}

export async function invalidateApp(id: string, slug?: string) {
  await deleteCache(cacheKeys.app(id))
  if (slug) {
    await deleteCachePattern(cacheKeys.appBySlug(slug))
  }
  // Invalidate all app lists
  await deleteCachePattern(cacheKeys.app(id))
}

// Store cache helpers
export async function getCachedStore(id: string) {
  return getCache(cacheKeys.store(id))
}

export async function setCachedStore(id: string, store: any) {
  await setCache(cacheKeys.store(id), store, CACHE_TTL.STORE)
}

export async function getCachedStoreBySlug(slug: string) {
  return getCache(cacheKeys.storeBySlug(slug))
}

export async function setCachedStoreBySlug(slug: string, store: any) {
  await setCache(cacheKeys.storeBySlug(slug), store, CACHE_TTL.STORE)
}

export async function invalidateStore(
  id: string,
  slug?: string | null,
  domain?: string | null,
  appId?: string | null,
) {
  await deleteCachePattern(cacheKeys.store(id))
  if (slug) {
    await deleteCachePattern(cacheKeys.storeBySlug(slug))
  }
  if (domain) {
    await deleteCachePattern(cacheKeys.storeByDomain(domain))
  }
  if (appId) {
    await deleteCachePattern(cacheKeys.storeByAppId(appId))
  }
}

// List cache helpers
export async function getCachedApps(userId?: string, storeId?: string) {
  return getCache(cacheKeys.apps(userId, storeId))
}

export async function setCachedApps(
  apps: any,
  userId?: string,
  storeId?: string,
) {
  await setCache(cacheKeys.apps(userId, storeId), apps, CACHE_TTL.APPS_LIST)
}

export async function getCachedStores(userId?: string, parentStoreId?: string) {
  return getCache(cacheKeys.stores(userId, parentStoreId))
}

export async function setCachedStores(
  stores: any,
  userId?: string,
  parentStoreId?: string,
) {
  await setCache(
    cacheKeys.stores(userId, parentStoreId),
    stores,
    CACHE_TTL.STORES_LIST,
  )
}

// User cache helpers
export async function getCachedUser(id: string) {
  return getCache(cacheKeys.user(id))
}

export async function setCachedUser(id: string, user: any) {
  await setCache(cacheKeys.user(id), user, CACHE_TTL.USER)
}

export async function getCachedUserByEmail(email: string) {
  return getCache(cacheKeys.userByEmail(email))
}

export async function setCachedUserByEmail(email: string, user: any) {
  await setCache(cacheKeys.userByEmail(email), user, CACHE_TTL.USER)
}

export async function invalidateUser(
  id: string,
  email?: string | null,
  appleId?: string | null,
  fingerprint?: string | null,
  userName?: string | null,
  apiKey?: string | null,
) {
  // Use pattern delete to clear both regular and :raw versions
  await deleteCachePattern(`user:${id}*`)

  if (email) {
    await deleteCachePattern(`user:email:${email}*`)
  }
  if (appleId) {
    await deleteCachePattern(`user:appleId:${appleId}*`)
  }
  if (fingerprint) {
    await deleteCachePattern(`user:fingerprint:${fingerprint}*`)
  }
  if (userName) {
    await deleteCachePattern(`user:userName:${userName}*`)
  }
  if (apiKey) {
    await deleteCachePattern(`user:apiKey:${apiKey}*`)
  }
}

// Guest cache helpers
export async function getCachedGuest(id: string) {
  return getCache(cacheKeys.guest(id))
}

export async function setCachedGuest(id: string, guest: any) {
  await setCache(cacheKeys.guest(id), guest, CACHE_TTL.GUEST)
}

export async function getCachedGuestByFingerprint(fingerprint: string) {
  return getCache(cacheKeys.guestByFingerprint(fingerprint))
}

export async function setCachedGuestByFingerprint(
  fingerprint: string,
  guest: any,
) {
  await setCache(
    cacheKeys.guestByFingerprint(fingerprint),
    guest,
    CACHE_TTL.GUEST,
  )
}

export async function invalidateGuest(
  id: string,
  fingerprint?: string | null,
  ip?: string | null,
  email?: string | null,
) {
  // Use pattern delete to clear both regular and :raw versions
  await deleteCachePattern(`guest:${id}*`)

  if (fingerprint) {
    await deleteCachePattern(`guest:fp:${fingerprint}*`)
  }
  if (ip) {
    await deleteCachePattern(`guest:ip:${ip}*`)
  }
  if (email) {
    await deleteCachePattern(`guest:email:${email}*`)
  }
}

// Translations cache helpers
export async function getCachedTranslations(locale: string) {
  return getCache<Record<string, any>>(cacheKeys.translations(locale))
}

export async function setCachedTranslations(
  locale: string,
  translations: Record<string, any>,
) {
  if (isDevelopment) {
    return
  }
  await setCache(
    cacheKeys.translations(locale),
    translations,
    CACHE_TTL.TRANSLATIONS,
  )
}

export async function invalidateTranslations(locale?: string) {
  if (locale) {
    await deleteCache(cacheKeys.translations(locale))
  } else {
    // Invalidate all translations
    await deleteCachePattern("translations:*")
  }
}
