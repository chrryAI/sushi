import { resolve } from "node:path"
import { config } from "dotenv"
import { defineConfig } from "vitest/config"

// Load root .env.local first (contains AUTH_SECRET), then local .env
config({ path: resolve(__dirname, "../../.env.local") })
config({ path: ".env" })

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["src/tests/**/*", "node_modules", "dist"],
    testTimeout: 30000,
  },
  esbuild: {
    target: "es2022",
  },
})
