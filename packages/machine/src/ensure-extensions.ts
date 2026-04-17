import { db } from "../index"

await db.execute(`CREATE EXTENSION IF NOT EXISTS vector`)
await db.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
console.log("[db] Extensions ensured: vector, uuid-ossp")
process.exit(0)
