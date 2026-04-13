import {
  createAppExtend,
  createOrUpdateStoreInstall,
  db,
  eq,
} from "../../index"
import { appExtends } from "../schema"

/**
 * Handle app extends relationships
 * Exported helper so individual app seeds can use it
 */
export async function handleAppExtends(
  appId: string,
  extendsIds: string[],
  storeId?: string,
) {
  if (!extendsIds || extendsIds.length === 0) return

  // Delete existing extends relationships first
  await db.delete(appExtends).where(eq(appExtends.appId, appId))

  // Create new extends relationships
  for (const toId of extendsIds) {
    await createAppExtend({
      appId,
      toId,
    })

    // Install extended app to store if storeId provided
    if (storeId) {
      await createOrUpdateStoreInstall({
        storeId,
        appId: toId,
      })
    }
  }

  console.log(
    `✅ Created ${extendsIds.length} extends relationships for app ${appId}`,
  )
}
