# Redis Caching Implementation Guide

## Overview

This guide shows how to add Redis caching to `getApp`, `getStore`, `getApps`, and `getStores` functions using Upstash Redis.

## Benefits

- ⚡ **Faster responses**: Redis is in-memory, much faster than database
- 💰 **Cost savings**: Reduced database queries
- 📈 **Scalability**: Handle more traffic with same resources
- 🌍 **Global**: Upstash Redis is globally distributed

## Implementation Pattern

### 1. Cached GET (Read)

```typescript
export const getApp = async ({ id, slug, ... }) => {
  // 1. Try cache first
  const cacheKey = id ? cacheKeys.app(id) : cacheKeys.appBySlug(slug!)
  const cached = await getCache(cacheKey)
  if (cached) return cached

  // 2. Cache miss - query database
  const app = await db.query...

  // 3. Store in cache for next time
  if (app) {
    await setCache(cacheKey, app, CACHE_TTL.APP)
  }

  return app
}
```

### 2. Invalidate on Mutation (Write)

```typescript
export const createApp = async (app) => {
  // 1. Create in database
  const created = await db.insert(apps).values(app).returning()

  // 2. Invalidate related caches
  await invalidateApp(created.id, created.slug)

  return created
}

export const updateApp = async (app) => {
  // 1. Update in database
  const updated = await db.update(apps)...

  // 2. Invalidate caches
  await invalidateApp(app.id, app.slug)

  return updated
}
```

## Example: Caching getApp

```typescript
import { getCachedApp, getCachedAppBySlug, setCachedApp, setCachedAppBySlug } from "./src/cache";

export const getApp = async ({
  name,
  id,
  slug,
  userId,
  guestId,
  storeId,
  isSafe = true,
  depth = 0,
}: {
  name?: "Atlas" | "Peach" | "Vault" | "Bloom";
  id?: string;
  slug?: string;
  userId?: string;
  guestId?: string;
  storeId?: string;
  isSafe?: boolean;
  depth?: number;
}): Promise<sushi | undefined> => {
  // Try cache first (only for simple lookups)
  if (id && !userId && !guestId && !storeId) {
    const cached = await getCachedApp(id);
    if (cached) return cached;
  }

  if (slug && !userId && !guestId && !storeId) {
    const cached = await getCachedAppBySlug(slug);
    if (cached) return cached;
  }

  // Cache miss - query database
  const appConditions = [];

  if (name) {
    appConditions.push(eq(apps.name, name as "Atlas" | "Peach" | "Vault" | "Bloom"));
  }

  if (slug) {
    appConditions.push(eq(apps.slug, slug));
  }

  if (id) {
    appConditions.push(eq(apps.id, id));
  }

  // ... rest of your existing query logic ...

  const result = await db.query.apps.findFirst({
    where: and(...appConditions, accessConditions),
    with: {
      store: true,
      // ... other relations
    },
  });

  // Store in cache (only for simple lookups)
  if (result) {
    if (id && !userId && !guestId && !storeId) {
      await setCachedApp(id, result);
    }
    if (slug && !userId && !guestId && !storeId) {
      await setCachedAppBySlug(slug, result);
    }
  }

  return result;
};
```

## Example: Invalidating on Create/Update

```typescript
import { invalidateApp } from "./src/cache";

export const createOrUpdateApp = async (app: app) => {
  const existing = await getApp({ id: app.id });

  if (existing) {
    // Update
    const [updated] = await db.update(apps).set(app).where(eq(apps.id, app.id)).returning();

    // Invalidate cache
    await invalidateApp(updated.id, updated.slug);

    return updated;
  } else {
    // Create
    const [created] = await db.insert(apps).values(app).returning();

    // Invalidate cache (invalidates list caches too)
    await invalidateApp(created.id, created.slug);

    return created;
  }
};
```

## Cache Strategy

### What to Cache ✅

- `getApp({ id })` - Simple ID lookups
- `getApp({ slug })` - Simple slug lookups
- `getStore({ id })` - Simple ID lookups
- `getStore({ slug })` - Simple slug lookups
- `getApps()` - List queries (shorter TTL)
- `getStores()` - List queries (shorter TTL)

### What NOT to Cache ❌

- Complex queries with multiple filters
- User-specific queries (unless keyed by userId)
- Real-time data (like timer state)
- Frequently changing data

### Cache TTLs

```typescript
APP: 5 minutes        // Individual apps change rarely
APPS_LIST: 2 minutes  // Lists change more often
STORE: 10 minutes     // Stores change very rarely
STORES_LIST: 5 minutes
```

## Testing

### 1. Test Cache Hit

```typescript
// First call - cache miss
const app1 = await getApp({ id: "123" });
// Logs: "Cache MISS: app:123"

// Second call - cache hit
const app2 = await getApp({ id: "123" });
// Logs: "✅ Cache HIT: app:123"
```

### 2. Test Invalidation

```typescript
// Get app (cached)
const app = await getApp({ id: "123" });

// Update app
await updateApp({ id: "123", name: "NewName" });
// Logs: "🗑️ Cache DELETE: app:123"

// Get app again (cache miss, fresh data)
const updated = await getApp({ id: "123" });
// Logs: "Cache MISS: app:123"
```

## Monitoring

Add to your monitoring:

```typescript
// Track cache hit rate
const cacheHits = await redis.get("stats:cache:hits");
const cacheMisses = await redis.get("stats:cache:misses");
const hitRate = cacheHits / (cacheHits + cacheMisses);

console.log(`Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);
```

## Rollout Strategy

### Phase 1: Add caching (non-breaking)

1. Add cache.ts (✅ Done)
2. Update getApp to use cache
3. Update getStore to use cache
4. Test in development

### Phase 2: Monitor

1. Deploy to production
2. Monitor cache hit rates
3. Monitor response times
4. Adjust TTLs if needed

### Phase 3: Expand

1. Add caching to getApps
2. Add caching to getStores
3. Add caching to other frequently-called functions

## Environment Variables

Make sure you have:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Next Steps

1. ✅ Cache layer created (`src/cache.ts`)
2. ⏳ Integrate into `getApp` function
3. ⏳ Integrate into `getStore` function
4. ⏳ Add invalidation to create/update functions
5. ⏳ Test in development
6. ⏳ Deploy and monitor

## Questions?

- **Q: Will this break existing code?**
  A: No! It's a non-breaking addition. Cache failures fall back to database.

- **Q: What if cache is stale?**
  A: Invalidation on mutations keeps it fresh. TTLs provide safety net.

- **Q: What about cost?**
  A: Upstash Redis pricing is very affordable. Savings from reduced DB queries offset it.

- **Q: Can I disable caching?**
  A: Yes! Just set `DISABLE_CACHE=true` in env and check in cache functions.
