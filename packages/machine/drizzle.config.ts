import * as dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

// dotenv.config({ path: ".env.sushi", override: false })
// dotenv.config({ override: false })
dotenv.config()

const NODE_ENV = process.env.NODE_ENV
const TESTING_ENV = process.env.TESTING_ENV

const connectionString =
  TESTING_ENV === "e2e"
    ? process.env.DB_URL!
    : NODE_ENV === "production"
      ? process.env.DB_URL!
      : process.env.DB_URL!

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
})
