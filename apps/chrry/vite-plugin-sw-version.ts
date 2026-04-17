import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"

interface SwVersionPluginOptions {
  swPath?: string
  version?: string
}

/**
 * Vite plugin to inject version into service worker
 * Replaces {{CACHE_VERSION}} placeholder with actual version during build
 */
export function swVersionPlugin(options: SwVersionPluginOptions = {}): Plugin {
  const { swPath = "public/sw.js", version } = options

  let config: any
  let cacheVersion: string

  return {
    name: "vite-plugin-sw-version",

    configResolved(resolvedConfig) {
      config = resolvedConfig

      // Generate cache version: package version + timestamp
      const pkgPath = path.resolve(config.root, "package.json")
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
      const pkgVersion = version || pkg.version || "0.0.0"
      const timestamp = Date.now()

      cacheVersion = `v${pkgVersion}-${timestamp}`

      console.log(`[SW Version Plugin] Cache version: ${cacheVersion}`)
    },

    // Handle dev server
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/sw.js") {
          const swFullPath = path.resolve(config.root, swPath)

          if (fs.existsSync(swFullPath)) {
            let content = fs.readFileSync(swFullPath, "utf-8")
            content = content.replace(/\{\{CACHE_VERSION\}\}/g, cacheVersion)

            res.setHeader("Content-Type", "application/javascript")
            res.setHeader("Service-Worker-Allowed", "/")
            res.end(content)
            return
          }
        }
        next()
      })
    },

    // Handle production build
    closeBundle() {
      if (config.command === "build" && !config.build.ssr) {
        const swFullPath = path.resolve(config.root, swPath)
        const outDir = config.build.outDir
        const outputPath = path.resolve(config.root, outDir, "sw.js")

        if (fs.existsSync(swFullPath)) {
          let content = fs.readFileSync(swFullPath, "utf-8")
          content = content.replace(/\{\{CACHE_VERSION\}\}/g, cacheVersion)

          // Ensure output directory exists
          fs.mkdirSync(path.dirname(outputPath), { recursive: true })
          fs.writeFileSync(outputPath, content, "utf-8")

          console.log(
            `[SW Version Plugin] Generated ${outputPath} with version ${cacheVersion}`,
          )
        } else {
          console.warn(
            `[SW Version Plugin] Service worker not found at ${swFullPath}`,
          )
        }
      }
    },
  }
}
