import { expect, test } from "@playwright/test"
import { APIClient } from "../../api/client"

const API_URL = process.env.API_URL || "http://localhost:3001"

test.describe("Health Check API", () => {
  let client: APIClient

  test.beforeEach(async () => {
    client = new APIClient(API_URL)
    await client.init()
  })

  test.afterEach(async () => {
    await client.dispose()
  })

  test("GET /api/health - returns ok", async () => {
    const response = await client.get("/api/health")

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status).toBe("ok")
    expect(data.version).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })
})
