import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",

    // Effect.js'i external bırak (SSR transform yok)
    deps: {
      external: ["effect"],
    },

    // Transform'ı sadece test dosyaları için
    transform: ["**/*.test.ts"],
  },
})
