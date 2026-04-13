import type { sushi } from "../types"
import { isDeepEqual } from "."

export const hasStoreApps = (app: sushi | undefined) => {
  return Boolean(app?.store?.app && app?.store?.apps?.length)
}

export const merge = (prevApps: sushi[], newApps: sushi[]) => {
  // Create a map of existing apps by ID
  const existingAppsMap = new Map(prevApps.map((app) => [app.id, app]))
  let hasChange = false

  // Add or update apps
  newApps.forEach((newApp) => {
    if (!newApp?.id) {
      return
    }
    // Check if new app has meaningful store.apps (not empty or undefined)
    const newHasStoreApps = hasStoreApps(newApp)
    const existingApp = existingAppsMap.get(newApp.id)

    if (existingApp) {
      const existingHasStoreApps = hasStoreApps(existingApp)

      // Merge: prefer new app but preserve existing store.apps if new one is empty/undefined
      const merged = {
        ...existingApp,
        ...newApp,
        store: newHasStoreApps
          ? newApp.store
          : existingHasStoreApps
            ? existingApp.store
            : newApp.store,
      }

      // Deep compare to detect actual changes
      if (!isDeepEqual(existingApp, merged)) {
        existingAppsMap.set(newApp.id, merged)
        hasChange = true
      }
    } else {
      existingAppsMap.set(newApp.id, newApp)
      hasChange = true
    }
  })

  // Only return a new array if something actually changed
  return hasChange ? Array.from(existingAppsMap.values()) : prevApps
}
