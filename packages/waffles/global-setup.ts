// import { chromium, type FullConfig } from "@playwright/test"
// import { isDevelopment } from "../db"

// async function globalSetup(config: FullConfig) {
//   if (isDevelopment) {
//     await new Promise((resolve) => setTimeout(resolve, 5000))
//   }
//   const baseURL = config.projects[0].use.baseURL || "http://localhost:3000"

//   // Construct API URL properly for both local and CI
//   let apiURL: string
//   if (baseURL.includes("localhost")) {
//     // Local: http://localhost:3001/health
//     apiURL = "http://localhost:3001/health"
//   } else {
//     // CI: https://e2e.chrry.dev/api/health
//     apiURL = `${baseURL.replace("chrry.ai", "chrry.dev")}/api/health`
//   }

//   console.log("🔧 Global Setup: Warming up backend...")
//   console.log(`   Frontend: ${baseURL}`)
//   console.log(`   API: ${apiURL}`)

//   const maxWait = 120000 // 2 minutes
//   const checkInterval = 5000 // 5 seconds
//   const startTime = Date.now()

//   // Wait for API to be ready
//   while (Date.now() - startTime < maxWait) {
//     try {
//       const response = await fetch(apiURL, {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//       })

//       if (response.ok) {
//         console.log("✅ API is ready!")
//         break
//       } else {
//         console.log(`⏳ API returned ${response.status}, waiting...`)
//       }
//     } catch (_error) {
//       const elapsed = Math.round((Date.now() - startTime) / 1000)
//       console.log(`⏳ API not ready yet (${elapsed}s elapsed)...`)
//     }

//     await new Promise((resolve) => setTimeout(resolve, checkInterval))
//   }

//   if (Date.now() - startTime >= maxWait) {
//     throw new Error("❌ Backend failed to start within 2 minutes")
//   }

//   // Warm up frontend by loading the page
//   console.log("🌐 Warming up frontend...")
//   const browser = await chromium.launch()
//   const context = await browser.newContext()
//   const page = await context.newPage()

//   try {
//     await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30000 })
//     console.log("✅ Frontend is ready!")
//   } catch (error) {
//     console.error("⚠️ Frontend warmup failed, but continuing:", error)
//   } finally {
//     await browser.close()
//   }

//   console.log("✅ Global setup complete!\n")
// }

// export default globalSetup
