// import { expect, test } from "@playwright/test"
// import { APIClient } from "../../api/client"
// import {
//   scheduledJobFactory,
//   type TribeScheduleInput,
// } from "../../fixtures/api/scheduledJobs"

// const API_URL = process.env.API_URL || "http://localhost:3001"
// const TEST_EMAIL = process.env.VEX_TEST_EMAIL!
// const TEST_PASSWORD = process.env.VEX_TEST_PASSWORD!
// const TEST_APP_SLUG = "focus"

// const hasTestApp = () => {
//   if (!TEST_APP_SLUG) {
//     console.warn(
//       "⚠️ VEX_TEST_APP_SLUG is not set. Skipping scheduledJobs tests that require an appId.",
//     )
//     return false
//   }
//   return true
// }

// test.describe
//   .skip("Scheduled Jobs API (requires running API)", () => {
//     let client: APIClient
//     let testAppId: string | null = null

//     test.beforeEach(async () => {
//       client = new APIClient(API_URL)
//       await client.init()
//       await client.authenticate(TEST_EMAIL, TEST_PASSWORD)

//       if (TEST_APP_SLUG && !testAppId) {
//         const appsRes = await client.get("/api/apps", {
//           params: { slug: TEST_APP_SLUG },
//         })
//         if (appsRes.ok()) {
//           const appsData = await appsRes.json()
//           testAppId = appsData.id || appsData.apps?.[0]?.id || null
//         }
//       }
//     })

//     test.afterEach(async () => {
//       await client.dispose()
//     })

//     test("GET /api/scheduledJobs - list jobs", async () => {
//       if (!hasTestApp()) return
//       const response = await client.get("/api/scheduledJobs", {
//         params: { appId: testAppId! },
//       })

//       expect(response.ok()).toBeTruthy()
//       const data = await response.json()
//       expect(Array.isArray(data.scheduledJobs)).toBeTruthy()
//     })

//     test("POST /api/scheduledJobs - create job", async () => {
//       if (!hasTestApp()) return

//       // Build job with valid schema
//       const job = scheduledJobFactory.build({
//         name: `Test Job - ${Date.now()}`,
//         frequency: "daily",
//         appId: testAppId!,
//       })

//       const response = await client.post("/api/scheduledJobs", job)

//       // Debug: log non-ok responses
//       if (!response.ok()) {
//         const errorText = await response.text()
//         console.log("❌ API Error:", response.status(), errorText.slice(0, 200))
//       }

//       expect(response.ok()).toBeTruthy()
//       const data = await response.json()
//       expect(data.scheduleId).toBeDefined()
//       expect(data.success).toBe(true)
//     })

//     test("GET /api/scheduledJobs/:id - get single job via list", async () => {
//       if (!hasTestApp()) return
//       const job = scheduledJobFactory.build({
//         name: "Get Test Job",
//         appId: testAppId!,
//       })
//       const createRes = await client.post("/api/scheduledJobs", job)
//       expect(createRes.ok()).toBeTruthy()
//       const created = await createRes.json()
//       const createdId = created.scheduleId || created.id

//       const listRes = await client.get("/api/scheduledJobs", {
//         params: { appId: testAppId! },
//       })
//       expect(listRes.ok()).toBeTruthy()
//       const listData = await listRes.json()
//       const found = listData.scheduledJobs?.find((j: any) => j.id === createdId)
//       expect(found).toBeDefined()
//     })

//     test("DELETE /api/scheduledJobs/:id - delete job", async () => {
//       if (!hasTestApp()) return
//       const job = scheduledJobFactory.build({ appId: testAppId! })
//       const createRes = await client.post("/api/scheduledJobs", job)
//       expect(createRes.ok()).toBeTruthy()
//       const created = await createRes.json()
//       const createdId = created.scheduleId || created.id

//       const response = await client.delete(`/api/scheduledJobs/${createdId}`)
//       expect(response.ok()).toBeTruthy()

//       const listRes = await client.get("/api/scheduledJobs", {
//         params: { appId: testAppId! },
//       })
//       expect(listRes.ok()).toBeTruthy()
//       const listData = await listRes.json()
//       const found = listData.scheduledJobs?.find((j: any) => j.id === createdId)
//       expect(found).toBeUndefined()
//     })

//     test.skip("POST /api/scheduledJobs/:id/revert - revert job", async () => {
//       // Revert requires a schedule that was previously updated.
//       // Skipped because a freshly created schedule has no previous version to revert to.
//     })

//     test("GET /api/scheduledJobs with params - filter by status", async () => {
//       if (!hasTestApp()) return
//       const response = await client.get("/api/scheduledJobs", {
//         params: { appId: testAppId!, status: "draft" },
//       })

//       expect(response.ok()).toBeTruthy()
//       const data = await response.json()
//       expect(Array.isArray(data.scheduledJobs)).toBeTruthy()
//       for (const job of data.scheduledJobs) {
//         expect(job.status).toBe("draft")
//       }
//     })

//     test("GET /api/scheduledJobs with params - filter by appId", async () => {
//       if (!hasTestApp()) return
//       const response = await client.get("/api/scheduledJobs", {
//         params: { appId: testAppId! },
//       })

//       expect(response.ok()).toBeTruthy()
//       const data = await response.json()
//       expect(Array.isArray(data.scheduledJobs)).toBeTruthy()
//     })

//     test("401 without authentication", async () => {
//       const unauthenticatedClient = new APIClient(API_URL)
//       await unauthenticatedClient.init()

//       const response = await unauthenticatedClient.get("/api/scheduledJobs", {
//         params: {
//           appId: testAppId || "00000000-0000-0000-0000-000000000000",
//         },
//       })
//       expect(response.status()).toBe(401)

//       await unauthenticatedClient.dispose()
//     })

//     test("400 for invalid job data", async () => {
//       if (!hasTestApp()) return
//       const invalidJob = {
//         name: "",
//         frequency: "invalid",
//       }

//       const response = await client.post("/api/scheduledJobs", invalidJob)
//       expect(response.status()).toBe(400)
//     })

//     // These endpoints are not implemented in the current API:
//     test.skip("PATCH /api/scheduledJobs/:id - update job", () => {})
//     test.skip("POST /api/scheduledJobs/:id/pause - pause job", () => {})
//     test.skip("POST /api/scheduledJobs/:id/resume - resume job", () => {})
//     test.skip("POST /api/scheduledJobs/:id/run - trigger job immediately", () => {})
//     test.skip("GET /api/scheduledJobs/:id/history - get job history", () => {})
//     test.skip("404 for non-existent job (GET /:id)", () => {})
//   })
