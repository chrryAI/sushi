import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./src",
  testIgnore: "**/__tests__/**",
  timeout: process.env.CI ? 1200000 : 500000,
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  maxFailures: process.env.CI ? 1 : 1,
  workers: 1, // Good for low memory
  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report" }],
    ["junit", { outputFile: "junit.xml" }],
  ],
  use: {
    launchOptions: {
      slowMo: process.env.CI ? 0 : 200, // Disable slowMo on CI for speed
      args: [
        "--disable-web-security",
        "--enable-features=VaapiVideoDecoder",
        "--max-video-bitrate=25000000",
        // Low-memory flags (add to all browsers) [web:4][web:28]
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-client-side-phishing-detection",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-gpu",
        "--disable-popup-blocking",
        "--disable-renderer-backgrounding",
        "--disable-setuid-sandbox",
        "--disable-software-rasterizer",
        "--mute-audio",
        "--no-first-run",
        "--no-sandbox",
      ],
    },
    headless: true, // Always headless for ~15% less memory [web:21]
    baseURL: !process.env.CI ? "http://localhost:5173" : "http://e2e.chrry.ai",
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
    video: {
      mode: process.env.CI ? "retain-on-failure" : "on",
      size: { width: 1280, height: 720 },
    },
  },
  projects: [
    // Keep Chromium but lightweight
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add these: lighter alternatives [web:4]
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // API-only tests (no browser)
    {
      name: "api",
      testMatch: /tests\/api\/.+\.spec\.ts/,
      use: {
        baseURL: process.env.API_URL || "http://localhost:3001",
      },
    },
  ],
})
