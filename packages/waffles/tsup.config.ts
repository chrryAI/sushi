import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  bundle: false,
  sourcemap: true,
  clean: true,
  external: ["@playwright/test", "dotenv"],
  treeshake: true,
  tsconfig: "./tsconfig.build.json",
})
