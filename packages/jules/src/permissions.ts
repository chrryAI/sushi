import { ANYONE_CAN, definePermissions } from "@rocicorp/zero"
import { schema } from "./zero-schema.gen.js"

export const permissions = definePermissions(schema, () => {
  const perms: Record<
    string,
    {
      row: {
        select: typeof ANYONE_CAN
        insert: typeof ANYONE_CAN
        update: {
          preMutation: typeof ANYONE_CAN
          postMutation: typeof ANYONE_CAN
        }
        delete: typeof ANYONE_CAN
      }
    }
  > = {}

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

  return perms as any
})
