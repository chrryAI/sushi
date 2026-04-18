import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path, { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import * as esbuild from "esbuild"
import { viteStaticCopy } from "vite-plugin-static-copy"
import type { PluginOption } from "vite-plus"
import { loadEnv } from "vite-plus"
import { getSiteConfig } from "../../packages/donut/utils/siteConfig"

function chromeExtensionPlugin(): PluginOption {
  return {
    name: "chrome-extension",
    enforce: "post" as const,
    async closeBundle() {
      try {
        console.log("🚀 Building background script...")
        // Build background script separately
        await esbuild.build({
          entryPoints: {
            background: resolve(__dirname, "src/background.ts"),
          },
          bundle: true,
          format: "esm",
          outdir: "dist",
          target: "chrome58",
          minify: false,
          loader: {
            ".scss": "css",
            ".css": "css",
          },
        })
        console.log("✅ Background script built.")
      } catch (error) {
        console.error("❌ Error building background script:", error)
        throw error
      }
    },
  }
}

// Stub Tauri, Capacitor, and Firebase APIs for extension (doesn't use mobile/desktop features)
function platformStubPlugin(): PluginOption {
  return {
    name: "platform-stub",
    enforce: "pre" as const,
    resolveId(id) {
      if (
        id.startsWith("@tauri-apps/api") ||
        id.startsWith("@capacitor") ||
        id.startsWith("firebase/") ||
        id === "react-native"
      ) {
        return id
      }
      return null
    },
    load(id) {
      if (
        id.startsWith("@tauri-apps/api") ||
        id.startsWith("@capacitor") ||
        id.startsWith("firebase/") ||
        id === "react-native"
      ) {
        if (id.startsWith("@tauri-apps/api")) {
          return `export * from "${path.resolve(__dirname, "src/stubs/tauri-api.ts")}"; export { default } from "${path.resolve(__dirname, "src/stubs/tauri-api.ts")}";`
        }
        // Return empty stub exports for others
        return `export default {};`
      }
      return null
    },
  }
}

export default async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const isFirefox =
    env.VITE_BROWSER === "firefox" || process.env.VITE_BROWSER === "firefox"
  const isProduction = command === "build"

  // Use MODE env var if set, otherwise use vite mode, otherwise default to vex
  const siteMode = process.env.MODE || mode || "vex"
  const siteConfig = getSiteConfig(siteMode)

  console.log("🔧 Build config:", {
    mode,
    isFirefox,
    isProduction,
    site: siteConfig.name,
    version: siteConfig.version,
    VITE_BROWSER: env.VITE_BROWSER || process.env.VITE_BROWSER,
  })

  const getHostPermissions = () => {
    // Always include both production and localhost
    // Extension will check at runtime which one is available
    const permissions = [
      `https://*.chrry.ai/*`,
      `https://chrry.dev/*`,
      // For sushi mode (browser), always include localhost for local API
      ...(siteMode === "sushi"
        ? ["http://localhost:5173/*", "http://localhost:3001/*"]
        : mode === "development"
          ? ["http://localhost:5173/*", "http://localhost:3001/*"]
          : []),
    ]

    return permissions.filter(Boolean)
  }

  const getIconPath = (size: 16 | 32 | 48 | 128) =>
    siteConfig.isTribe
      ? `icons/tribe-icon-${size}.png`
      : `icons/${siteConfig.slug}-icon-${size}.png`

  // Manifest base
  const manifestBase = {
    manifest_version: 3,
    name: `${siteConfig.name} 🍒`,
    version: siteConfig.version || "2.4.89",
    description: siteConfig.description,
    permissions: isFirefox
      ? ["storage", "tabs", "contextMenus", "cookies"] // Firefox doesn't support sidePanel permission
      : ["storage", "sidePanel", "tabs", "contextMenus", "cookies"],
    host_permissions: getHostPermissions(),
    action: {
      default_title: siteConfig.name,
    },
    icons: {
      16: getIconPath(16),
      32: getIconPath(32),
      48: getIconPath(48),
      128: getIconPath(128),
    },
    background: isFirefox
      ? {
          scripts: ["background.js"],
        }
      : {
          service_worker: "background.js",
          type: "module",
        },
    ...(isFirefox
      ? {
          sidebar_action: {
            default_panel: "index.html",
            default_title: siteConfig.name,
            default_icon: {
              16: `icons/${siteConfig.slug}-icon-16.png`,
              32: `icons/${siteConfig.slug}-icon-32.png`,
              48: `icons/${siteConfig.slug}-icon-48.png`,
              128: `icons/${siteConfig.slug}-icon-128.png`,
            },
          },
        }
      : {
          side_panel: {
            default_path: "index.html",
          },
        }),
    // Sushi specific override for New Tab
    // (Disabled as per user request to keep only the extension functionality)
    /*
    ...(siteConfig.slug === "sushi"
      ? {
          chrome_url_overrides: {
            newtab: "index.html",
          },
        }
      : {}),
    */
  }

  // Add browser_specific_settings for Firefox
  const manifest = isFirefox
    ? {
        ...manifestBase,
        browser_specific_settings: {
          gecko: {
            id: "iliyan@chrry.ai",
            strict_min_version: "109.0",
          },
        },
      }
    : manifestBase

  return {
    plugins: [
      react(),
      platformStubPlugin(), // Stub Tauri, Capacitor, and Firebase APIs for extension
      viteStaticCopy({
        targets: [
          {
            src: "public/icons", // copy from public/icons
            dest: "",
          },
        ],
      }),
      chromeExtensionPlugin(),
      {
        name: "replace-navigation-imports",
        enforce: "pre" as const,
        resolveId(source, importer) {
          // Intercept navigation.web imports and redirect to extension
          if (source.includes("navigation.web")) {
            return this.resolve(
              source.replace("navigation.web", "navigation.extension"),
              importer,
              { skipSelf: true },
            )
          }
          // Intercept next/navigation imports and redirect to stub
          if (source === "next/navigation") {
            return path.resolve(__dirname, "./src/stubs/next-navigation.ts")
          }
          return null
        },
      },
      {
        name: "write-manifest",
        enforce: "post" as const,
        closeBundle() {
          if (!existsSync("dist")) {
            mkdirSync("dist", { recursive: true })
          }
          console.log("📝 Writing manifest:", {
            isFirefox,
            hasServiceWorker: !!(manifest as any).background?.service_worker,
            hasScripts: !!(manifest as any).background?.scripts,
            hasExtensionId: !!(manifest as any).browser_specific_settings?.gecko
              ?.id,
          })
          writeFileSync(
            resolve(__dirname, "dist/manifest.json"),
            JSON.stringify(manifest, null, 2),
            "utf-8",
          )
        },
      },
    ],
    define: {
      // Vite requires string literals for replacement
      __DEV__: !isProduction,

      "import.meta.env.VITE_NODE_ENV": JSON.stringify(
        isProduction ? "production" : "development",
      ),
      "import.meta.env.VITE_BROWSER": JSON.stringify(
        env.VITE_BROWSER || "chrome",
      ),
      "import.meta.env.VITE_IS_EXTENSION": JSON.stringify("true"),
      "import.meta.env.VITE_SITE_MODE": JSON.stringify(siteMode),
    },
    optimizeDeps: {
      exclude: ["next/navigation", "next/router"],
    },
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        // Map chrry/* to packages/donut/* (source, not dist)
        {
          find: /^chrry\/(.*)$/,
          replacement: path.resolve(__dirname, "../../packages/donut/$1"),
        },
        // Map chrry to source index, not package.json main
        {
          find: "chrry",
          replacement: path.resolve(__dirname, "../../packages/donut/index.ts"),
        },
        // Map @chrryai/code to source (not built dist)
        {
          find: "@chrryai/code",
          replacement: path.resolve(
            __dirname,
            "../../packages/code/src/index.ts",
          ),
        },
        // Stub Capacitor packages (extension doesn't use mobile features)
        {
          find: "@capacitor-firebase/authentication",
          replacement: path.resolve(
            __dirname,
            "./src/stubs/capacitor-firebase.ts",
          ),
        },
        {
          find: "@codetrix-studio/capacitor-google-auth",
          replacement: path.resolve(
            __dirname,
            "./src/stubs/capacitor-firebase.ts",
          ),
        },
        {
          find: "@capacitor/core",
          replacement: path.resolve(__dirname, "./src/stubs/capacitor-core.ts"),
        },
        {
          find: /^@capacitor\//,
          replacement: path.resolve(__dirname, "./src/stubs/capacitor-core.ts"),
        },
        // Stub Firebase (extension uses Better Auth, not Firebase)
        {
          find: /^firebase\//,
          replacement: path.resolve(__dirname, "./src/stubs/firebase.ts"),
        },
        // Stub Next.js modules (extension doesn't use Next.js)
        {
          find: "next/navigation",
          replacement: path.resolve(
            __dirname,
            "./src/stubs/next-navigation.ts",
          ),
        },
        // Use extension-specific navigation (no Next.js hooks)
        {
          find: path.resolve(
            __dirname,
            "../../packages/donut/platform/navigation.web.ts",
          ),
          replacement: path.resolve(
            __dirname,
            "../../packages/donut/platform/navigation.extension.ts",
          ),
        },
        {
          find: path.resolve(
            __dirname,
            "../../packages/donut/platform/navigation.ts",
          ),
          replacement: path.resolve(__dirname, "./src/stubs/navigation.ts"),
        },
        {
          find: "chrry/platform/navigation.ts",
          replacement: path.resolve(__dirname, "./src/stubs/navigation.ts"),
        },
        {
          find: "chrry/platform/navigation",
          replacement: path.resolve(__dirname, "./src/stubs/navigation.ts"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Don't auto-import globals to avoid @use conflicts
        },
      },
    },
    base: "./", // CRITICAL: Chrome extensions need relative paths, not absolute
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "index.html"),
        },
        // Exclude Tauri, Capacitor, and Firebase packages - they're only for desktop/mobile apps
        external: [],
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
          format: "es",
          dir: "dist",
          // Disable code-splitting for extensions - bundle everything together
          manualChunks: undefined,
          inlineDynamicImports: true,
          // CRITICAL for Manifest V3: Prevent dynamic script loaders
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
          },
        },
      },
      sourcemap: false, // Disabled for extensions - sourcemaps use eval() which violates CSP
      minify: isProduction ? "terser" : false, // Use terser for CSP-safe minification
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: false,
              drop_debugger: true,
              pure_funcs: ["console.debug"], // Remove console.debug only
              // CRITICAL: Prevent eval() and Function() constructor
              unsafe: false,
              unsafe_comps: false,
              unsafe_Function: false,
              unsafe_math: false,
              unsafe_proto: false,
              unsafe_regexp: false,
              unsafe_undefined: false,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
              // CRITICAL: Ensure no eval() or Function() in output
              safari10: true,
              webkit: true,
            },
          }
        : undefined,
      outDir: "dist",
      emptyOutDir: true,
      // CRITICAL for Manifest V3: Prevent dynamic imports entirely
      dynamicImportVarsOptions: {
        exclude: ["**/*"],
      },
      // Ensure CSP-safe code generation
      target: "es2020",
      cssCodeSplit: false, // Bundle all CSS together
    },
  }
}
