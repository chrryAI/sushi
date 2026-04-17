import { config } from "dotenv"
import { defineConfig } from "vitest/config"

config({ path: ".env.local" })
config({ path: ".env" })

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],

    // Effect.js + SSR fix
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },

    // SSR'ı kapat
    transformMode: {
      web: [/\.[jt]sx?$/],
      ssr: [], // Boş = SSR kapalı
    },

    // Effect'i optimize etme
    optimizeDeps: {
      exclude: ["effect"],
    },
  },
  define: {
    global: "globalThis",
  },
})
