import { createSchema } from "@rocicorp/zero"
import * as drizzleSchema from "./src/schema"

const schema = createSchema(drizzleSchema)

export { schema }
