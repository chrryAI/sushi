import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteCompression from "vite-plugin-compression"

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  server: {
    port: 5175,
    host: "0.0.0.0", // Allow iOS Simulator to connect
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      external: ["@capacitor-firebase/authentication", "firebase"],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      stream: "stream-browserify",
      "react-native": path.resolve(__dirname, "node_modules/react-native-web"),
    },
  },
  optimizeDeps: {
    exclude: ["@capacitor-firebase/authentication", "firebase"],
  },
})
