import { beforeAll, describe, expect, it } from "vitest"

/**
 * API Tests - Scheduled Jobs
 * Pure HTTP calls, no browser needed
 * Requires: VEX_TEST_EMAIL, VEX_TEST_PASSWORD in .env
 */

const API_URL = process.env.API_URL || "http://localhost:3001"
// Strip surrounding quotes from env values if present
const stripQuotes = (s: string | undefined) => s?.replace(/^["']|["']$/g, "")
const TEST_EMAIL = stripQuotes(process.env.VEX_TEST_EMAIL)
const TEST_PASSWORD = stripQuotes(process.env.VEX_TEST_PASSWORD)
const AUTH_SECRET = stripQuotes(process.env.AUTH_SECRET)

describe("Scheduled Jobs API", () => {
  const authToken: string | null = null
  let testAppId: string | null = null

  beforeAll(async () => {
    // Skip if no credentials - tests will fail gracefully
    if (!TEST_EMAIL) {
      console.log("⚠️  VEX_TEST_EMAIL not set - API tests will be skipped")
      return
    }
    console.log(
      "🔑 Test email:",
      TEST_EMAIL,
      "AUTH_SECRET exists:",
      !!AUTH_SECRET,
    )

    try {
      // Get test app (public endpoint, no auth required)
      const appsRes = await fetch(`${API_URL}/api/apps?slug=focus`)
      if (appsRes.ok) {
        const appsData = await appsRes.json()
        testAppId = appsData.id || appsData.apps?.[0]?.id || null
        console.log("✅ Got appId:", testAppId)
      }
    } catch (error) {
      console.log("⚠️  API connection failed:", error)
    }
  })

  it("GET /api/apps - fetch app without auth (public)", async () => {
    // This endpoint doesn't require auth for public apps
    const response = await fetch(`${API_URL}/api/apps?slug=focus`)

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toBeDefined()
    console.log(
      "✅ Public API accessible, got app:",
      data.slug || data.apps?.[0]?.slug,
    )
  })

  it("GET /api/health - API health check", async () => {
    const response = await fetch(`${API_URL}/api/health`)

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.status).toBe("ok")
    console.log("✅ API healthy, version:", data.version)
  })

  it.skipIf(!AUTH_SECRET)(
    "GET /api/scheduledJobs - list jobs (requires auth)",
    async () => {
      console.log("📧 Using test email:", TEST_EMAIL)
      console.log("🔑 AUTH_SECRET configured:", !!AUTH_SECRET)

      const response = await fetch(
        `${API_URL}/api/scheduledJobs?appId=${testAppId}`,
        {
          headers: {
            "X-Test-Email": TEST_EMAIL!,
            "X-Test-Secret": AUTH_SECRET!,
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.log("❌ List jobs failed:", response.status, errorText)
      }

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(Array.isArray(data.scheduledJobs)).toBe(true)
    },
  )

  it.skipIf(!AUTH_SECRET)(
    "POST /api/scheduledJobs - create job (requires auth)",
    async () => {
      const job = {
        frequency: "daily",
        schedule: [
          {
            time: "09:00",
            postType: "post",
            model: "sushi",
            charLimit: 500,
            credits: 10,
            intervalMinutes: 60,
          },
        ],
        timezone: "Europe/Istanbul",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalCredits: 10,
        totalPrice: 500,
        appId: testAppId,
        contentTemplate: "Test content template",
        contentRules: { tone: "friendly", length: "medium" },
      }

      const response = await fetch(`${API_URL}/api/scheduledJobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Test-Email": TEST_EMAIL!,
          "X-Test-Secret": AUTH_SECRET!,
        },
        body: JSON.stringify(job),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log(
          "❌ Create job failed:",
          response.status,
          errorText.slice(0, 200),
        )
      }

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.scheduleId).toBeDefined()
    },
  )

  it("401 without authentication", async () => {
    const response = await fetch(
      `${API_URL}/api/scheduledJobs?appId=${testAppId || "test"}`,
    )

    expect(response.status).toBe(401)
  })
})
