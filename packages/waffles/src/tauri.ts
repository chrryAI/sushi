import path from "node:path"
import { _electron as electron, expect, test } from "@playwright/test"

/**
 * Tauri Desktop App E2E Tests
 *
 * These tests launch the actual Tauri app and test native features
 * like OAuth, payments, window controls, etc.
 *
 * To run: pnpm test:tauri
 */

test.describe("Tauri Desktop App", () => {
  test("should launch Tauri app", async () => {
    // Path to your Tauri binary
    // For dev: apps/desktop/src-tauri/target/debug/vex
    // For release: apps/desktop/src-tauri/target/release/vex
    const appPath = path.join(
      __dirname,
      "../../apps/desktop/src-tauri/target/debug/vex",
    )

    // Launch Tauri app via Electron API
    const electronApp = await electron.launch({
      args: [appPath],
      // Enable DevTools for debugging
      env: {
        ...process.env,
        TAURI_ENV: "development",
      },
    })

    // Get the main window
    const window = await electronApp.firstWindow()

    // Wait for app to load
    await window.waitForLoadState("networkidle")

    // Test basic functionality
    await expect(window.locator("h1")).toBeVisible()

    // Take screenshot
    await window.screenshot({
      path: "test-results/tauri-app-launch.png",
    })

    // Close app
    await electronApp.close()
  })

  test("should test OAuth flow in Tauri", async () => {
    const appPath = path.join(
      __dirname,
      "../../apps/desktop/src-tauri/target/debug/vex",
    )

    const electronApp = await electron.launch({
      args: [appPath],
    })

    const window = await electronApp.firstWindow()
    await window.waitForLoadState("networkidle")

    // Click login button
    await window.click('[data-testid="login-button"]')

    // Wait for sign-in modal
    await expect(window.locator('[data-testid="sign-in-modal"]')).toBeVisible()

    // Click Google sign-in
    await window.click('[data-testid="sign-in-google-button"]')

    // OAuth flow happens in Tauri webview
    // You can test the redirect back to app

    await electronApp.close()
  })

  test("should test Stripe payment in Tauri", async () => {
    const appPath = path.join(
      __dirname,
      "../../apps/desktop/src-tauri/target/debug/vex",
    )

    const electronApp = await electron.launch({
      args: [appPath],
    })

    const window = await electronApp.firstWindow()
    await window.waitForLoadState("networkidle")

    // Navigate to subscription page
    // Test Stripe checkout flow in native app

    await electronApp.close()
  })

  test("should test window controls", async () => {
    const appPath = path.join(
      __dirname,
      "../../apps/desktop/src-tauri/target/debug/vex",
    )

    const electronApp = await electron.launch({
      args: [appPath],
    })

    const window = await electronApp.firstWindow()

    // Test window maximize
    await window.evaluate(() => {
      // Access Tauri API

      window.__TAURI__.window.appWindow.maximize()
    })

    // Test window drag (via data-tauri-drag-region)
    // Test double-click to maximize

    await electronApp.close()
  })
})
