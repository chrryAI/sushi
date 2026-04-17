import path from "node:path"
import react from "@vitejs/plugin-react"
import type { UserConfig } from "vite"
import { defineConfig, loadEnv, type PluginOption } from "vite"
import { compression } from "vite-plugin-compression2"
import { swVersionPlugin } from "./vite-plugin-sw-version"

// Load environment variables from .env file
// dotenv.config({ path: path.resolve(__dirname, "../../.env") })

// Plugin to stub Tauri APIs in non-Tauri environments
function tauriStubPlugin(): PluginOption {
  return {
    name: "tauri-stub",
    enforce: "pre",
    resolveId(id) {
      if (id.startsWith("@tauri-apps/")) {
        return id // Mark as resolved
      }
    },
    load(id) {
      if (id.startsWith("@tauri-apps/")) {
        // Return empty stub that will fail gracefully
        return "export default {}; export const getCurrentWindow = () => ({});"
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), "")

  // Check E2E from both sources:
  // - loadEnv() reads .env files (local development)
  // - process.env reads runtime variables (CI/GitHub Actions)
  const isE2E = !!(
    env.VITE_TESTING_ENV === "e2e" ||
    env.TESTING_ENV === "e2e" ||
    process.env.VITE_TESTING_ENV === "e2e" ||
    process.env.TESTING_ENV === "e2e"
  )
  const config: UserConfig = {
    plugins: [
      tauriStubPlugin(), // Must be first to intercept Tauri imports
      react({
        jsxRuntime: "automatic",
        jsxImportSource: "react",
      }),
      swVersionPlugin(),
      ...(!isSsrBuild
        ? [
            compression({
              algorithms: ["gzip"],
              exclude: [/\.(br)$/, /\.(gz)$/],
              threshold: 1024,
            }),
            // Generate brotli compressed files (better compression than gzip)
            compression({
              algorithms: ["brotliCompress"],
              exclude: [/\.(br)$/, /\.(gz)$/],
              threshold: 1024,
            }),
          ]
        : []),
    ],
    publicDir: isSsrBuild ? false : path.resolve(__dirname, "public"),
    resolve: {
      alias: {
        chrry: path.resolve(__dirname, "../../packages/donut"),
        "react-native": path.resolve(
          __dirname,
          "node_modules/react-native-web",
        ),
      },
    },
    define: {},
    server: {
      proxy: {
        "/auth": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/auth/, "/api/auth"),
        },
      },
    },
    ssr: {
      external: ["i18n-iso-countries", "@svgmoji/notomoji"], // Don't bundle - has dynamic requires
      noExternal: [
        /@lobehub\//,
        "@chrryai/donut",
        "chrry",
        ...(command === "build" ? ["react", "react-dom"] : []),
      ], // Force bundle libraries to fix ESM/CJS naming issues in React 19 production build
      resolve: {
        externalConditions: ["node", "import"],
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/server",
        "markdown-to-jsx",
        "react-syntax-highlighter",
      ],
      exclude: [
        // Tauri APIs are only available at runtime in Tauri environment
        "@tauri-apps/api",
        "@tauri-apps/api/window",
        "@tauri-apps/api/app",
      ],
    },
    build: {
      target: "es2022",
      rollupOptions: {
        external: (id) => {
          // Mark Tauri APIs as external - they're provided by Tauri runtime
          // Only apply this for client builds, not SSR
          if (!isSsrBuild && id.startsWith("@tauri-apps/")) {
            return true
          }
          return id === id.startsWith("@svgmoji/notomoji")
        },
        output: {
          // Better chunk splitting for caching - only for client builds
          // Disable for SSR to avoid circular dependency issues
          manualChunks: isSsrBuild
            ? undefined
            : (id) => {
                if (id.includes("node_modules")) {
                  if (id.includes("react") || id.includes("react-dom")) {
                    return "react-vendor"
                  }
                  return "vendor"
                }
              },
          // Ensure proper chunk loading order
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === "react-vendor") {
              return "assets/0-[name]-[hash].js"
            }
            return "assets/2-[name]-[hash].js"
          },
          format: "es", // Force ES module format
          // Only add Node.js polyfills for SSR builds, not client builds
          banner: isSsrBuild
            ? "import { createRequire as __createRequire } from 'module';import { fileURLToPath as __fileURLToPath } from 'url';import { dirname as __dirnameFunc } from 'path';const require = __createRequire(import.meta.url);const __filename = __fileURLToPath(import.meta.url);const __dirname = __dirnameFunc(__filename);globalThis.require = require;globalThis.__dirname = __dirname;globalThis.__filename = __filename;"
            : undefined,
        },
      },
      // Enable minification (disable for E2E to see full React error messages)
      // Use esbuild minifier for speed; drop console in production
      minify: isE2E ? false : mode === "development" ? false : "esbuild",
      esbuild: {
        drop: mode === "production" ? ["console", "debugger"] : ["debugger"],
        pure: ["console.log", "console.info"],
      },
      // Enable source maps for Sentry
      // E2E/Dev: true (visible for debugging)
      // Production: "hidden" (upload to Sentry but don't expose to browser)
      sourcemap: isE2E || mode === "development" ? true : "hidden",
      // Increase chunk size warning limit (we're splitting chunks now)
      chunkSizeWarningLimit: 1000,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
        ignoreDynamicRequires: true, // Ignore dynamic requires that can't be resolved
        defaultIsModuleExports: true,
      },
    },
  }

  return config
})
