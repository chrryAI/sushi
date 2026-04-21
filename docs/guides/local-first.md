# Local-First Architecture: The "God Function" Approach

This document outlines the architectural philosophy for building a robust, local-first application using SWR, Dexie (IndexedDB), and REST APIs.

## 1. The Philosophy: REST as an Interface

Instead of leaking database queries (like Drizzle/Prisma) into the frontend components, we treat **REST APIs as "God Functions"**.

- **Decoupling:** The UI doesn't know about the database schema. It only knows about the _Intent_ (e.g., `updateTask`, `getProject`).
- **Portability:** These functions are shareable SDKs. They work on Web, Mobile (React Native), CLI, or any other client.
- **Granular Tracking:** Unlike raw DB queries, API functions allow for granular analytics, logging, and permission checks at the interface level.

## 2. The Core: Hybrid Cache (SWR + Dexie)

We use a hybrid caching strategy to get the best of both worlds: **Instant Reads** (Local) + **Fresh Data** (Network).

### Architecture

1.  **Memory (L1):** `Map<string, any>` for synchronous, instant access during the session.
2.  **Persistence (L2):** `IndexedDB` (via Dexie) for storing data across sessions/reloads.
3.  **Network (Source):** REST API for the source of truth.

### The Flow

1.  **App Boot:** `getCacheProvider` initializes. It loads _non-expired_ data from IndexedDB into Memory immediately.
2.  **Render:** Components render _instantly_ using data from Memory. No loading spinners for returning users.
3.  **Revalidate:** SWR fetches from the Network in the background.
4.  **Sync:** New data is written to Memory (for UI update) and IndexedDB (for next time).

## 3. Advanced Patterns

### A. Offline Mutation Queue (The "Outbox" Pattern)

Handling writes when the user is offline.

- **Concept:** When `updateTask(id, data)` is called:
  1.  Check Network Status.
  2.  **If Online:** Send request normally.
  3.  **If Offline:**
      - Save the request (URL, Method, Body) to a `mutation_queue` table in Dexie.
      - Return a "Success" response immediately (Optimistic).
      - Register a background sync task.
- **Sync Worker:** Listens for `online` events, reads the `mutation_queue`, and replays requests in order.

### B. Persistent Optimistic UI

Preserving optimistic updates even if the user reloads the page while offline.

- **Problem:** Standard SWR optimistic UI is memory-only. A reload wipes it out.
- **Solution:**
  1.  Before the network call, write the optimistic change to a `pending_updates` table in Dexie.
  2.  On App Boot, apply `pending_updates` on top of the cached data before returning it to the UI.
  3.  When the network call succeeds, remove the entry from `pending_updates`.

### C. Smart Prefetching SDK

Predicting user intent to eliminate latency.

- **Concept:** Wrap API functions in a "Smart SDK" hook.
- **Usage:** `usePrefetch(api.getTask, taskId)`
- **Trigger:** When a user hovers a task card or the task appears in the viewport.
- **Action:**
  1.  Fetch data in the background.
  2.  Save to Dexie.
- **Result:** When the user clicks, the data is _already_ on disk. Navigation is instant (0ms).

### D. API Versioning & Migrations

Handling breaking API changes without breaking the client cache.

- **Strategy:** Add `apiVersion` to the cache configuration.
- **Check:** On initialization, compare `storedVersion` vs `currentVersion`.
- **Action:**
  - **Minor Change:** Run a migration function (e.g., rename field).
  - **Major Change:** Nuke specific tables or the entire cache to force a fresh fetch.
- **Benefit:** Prevents "White Screen of Death" caused by stale JSON structures matching old types.

## 4. Implementation Checklist

- [x] **Hybrid Cache Provider:** Implemented with SWR + Dexie.
- [ ] **Offline Detection:** Hook into `navigator.onLine` and `window.addEventListener('online')`.
- [ ] **Mutation Queue:** Create `mutation_queue` schema in Dexie.
- [ ] **Sync Worker:** Implement the replay logic.
- [ ] **Prefetch Hooks:** Create reusable hooks for high-probability actions.
