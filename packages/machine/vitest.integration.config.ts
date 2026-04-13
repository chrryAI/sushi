import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/integration/**/*.test.ts"],
    testTimeout: 60000, // API calls need more time
    retry: 2, // Retry flaky API tests
  },
})
