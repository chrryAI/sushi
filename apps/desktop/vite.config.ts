import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteCompression from "vite-plugin-compression"

// Get MODE from environment (e.g., MODE=burn, MODE=vex, etc.)
const mode = process.env.MODE || process.env.VITE_SITE_MODE || "vex"
const isProduction = process.env.NODE_ENV === "production"

console.log("🔧 Tauri Build Config:", {
  mode,
  isProduction,
  NODE_ENV: process.env.NODE_ENV,
})

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024, // Only compress files > 1KB
      deleteOriginFile: false,
    }),
  ],
  server: {
    port: 5174,
  },
  build: {
    outDir: "dist",
    // Tauri handles bundling - no need to mark as external
  },

  // Define environment variables for the client
  define: {
    "import.meta.env.VITE_SITE_MODE": JSON.stringify(mode),
    "import.meta.env.VITE_NODE_ENV": JSON.stringify(
      isProduction ? "production" : "development",
    ),
    "import.meta.env.VITE_IS_TAURI": JSON.stringify("true"),
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@chrryai/chrry": path.resolve(__dirname, "../../packages/ui"),
      "react-native": path.resolve(__dirname, "node_modules/react-native-web"),
    },
  },
})
