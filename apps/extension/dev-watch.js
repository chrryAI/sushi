#!/usr/bin/env node

import { spawn } from "node:child_process"
import { watch } from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let buildProcess = null
let isBuilding = false

// Auto-reload Chrome extension via Chrome DevTools Protocol
// Start Chrome with: google-chrome --remote-debugging-port=9222
async function reloadExtension() {
  try {
    // Get list of debuggable targets
    const targets = await new Promise((resolve, reject) => {
      http
        .get("http://localhost:9222/json", (res) => {
          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => {
            try {
              resolve(JSON.parse(data))
            } catch {
              reject(new Error("Failed to parse Chrome targets"))
            }
          })
        })
        .on("error", reject)
    })

    // Find extension page
    const extTarget = targets.find(
      (t) =>
        t.url?.includes("chrome-extension://") &&
        (t.title?.toLowerCase().includes("chrry") ||
          t.title?.toLowerCase().includes("vex") ||
          t.title?.toLowerCase().includes("zarathustra")),
    )

    if (extTarget) {
      console.log("🔄 Auto-reloading extension...")
      // Send reload command via WebSocket would go here
      // For now, just notify - full auto-reload needs ws package
      console.log(
        "✅ Extension rebuilt! Close & reopen sidebar to see changes.",
      )
    } else {
      console.log("✅ Extension rebuilt! Refresh manually in Chrome.")
    }
  } catch (_err) {
    // Chrome not running with debugging or extension not found
    console.log(
      "✅ Extension built! Refresh manually (or start Chrome with --remote-debugging-port=9222)",
    )
  }
}

function runBuild() {
  if (isBuilding) {
    console.log("⏳ Build already in progress...")
    return
  }

  isBuilding = true
  console.log("\n🔨 Building extension...")

  buildProcess = spawn("pnpm", ["build:dev"], {
    stdio: "inherit",
    cwd: __dirname,
    shell: true,
  })

  buildProcess.on("close", (code) => {
    isBuilding = false
    if (code === 0) {
      reloadExtension()
    } else {
      console.log("❌ Build failed with code:", code)
    }
    buildProcess = null
  })
}

// Watch for changes in src directory only
// UI package changes will require manual rebuild
const watchPaths = [
  path.join(__dirname, "src"),
  path.join(__dirname, "../../packages/ui"),
  path.join(__dirname, "package.json"),
  path.join(__dirname, "vite.config.ts"),
]

console.log("👀 Watching for changes in:")
watchPaths.forEach((p) => console.log(`   - ${p}`))

watchPaths.forEach((watchPath) => {
  watch(watchPath, { recursive: true }, (eventType, filename) => {
    if (
      filename &&
      (filename.endsWith(".ts") ||
        filename.endsWith(".tsx") ||
        filename.endsWith(".js") ||
        filename.endsWith(".jsx") ||
        filename.endsWith(".json") ||
        filename.endsWith(".scss") ||
        filename.endsWith(".css"))
    ) {
      console.log(`\n📝 Changed: ${filename}`)
      runBuild()
    }
  })
})

// Initial build
console.log("🚀 Starting extension development mode...")
runBuild()

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Stopping development server...")
  if (buildProcess) {
    buildProcess.kill()
  }
  process.exit(0)
})
