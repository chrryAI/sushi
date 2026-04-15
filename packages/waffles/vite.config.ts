import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/

import commonjs from "vite-plugin-commonjs"
import { VitePluginNode } from "vite-plugin-node"

export default defineConfig({
  server: { port: 3001 },
  build: { target: "esnext" },
  plugins: [
    react(),
    commonjs(), // Transform CommonJS to ES modules
    ...VitePluginNode({
      adapter: "express",
      appPath: "some/path/server",
      exportName: "app",
      // tsCompiler: 'esbuild',
    }),
  ],
})
