import { ANYONE_CAN, definePermissions } from "@rocicorp/zero"
import { schema } from "./zero-schema.gen"

export const permissions = definePermissions(schema, () => {
  const perms: Record<string, any> = {}

  for (const table of Object.keys(schema.tables)) {
    perms[table] = {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: { preMutation: ANYONE_CAN, postMutation: ANYONE_CAN },
        delete: ANYONE_CAN,
      },
    }
  }

  return perms
})
