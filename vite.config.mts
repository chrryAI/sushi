import { defineConfig } from "vite-plus"

const isCI = process.env.CI === "true"

export default defineConfig({
  lint: { options: { typeAware: isCI, typeCheck: false } },
})
