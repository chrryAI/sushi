import { expect, test } from "@playwright/test"
import { getURL, wait } from "./index"

const isLive = true
const isMember = false

/**
 * Validation Test Suite for App Creation
 * Tests all validation rules and error messages
 */

test.skip("App Creation Validation", () => {
  test("Name validation - minimum 3 characters", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    // Click add agent button
    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    // Name input should have default value "MyAgent"
    const nameInput = page.getByTestId("name-input")
    await expect(nameInput).toHaveValue("MyAgent")

    // Clear name input
    await nameInput.clear()

    // Error message should appear
    const errorMessage = page.getByTestId("name-error-message")
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText("Name: minimum 3 characters")

    // System Prompt button should be disabled (not visible)
    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).not.toBeVisible()
  })

  test("Name validation - 2 characters should show error", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    const nameInput = page.getByTestId("name-input")
    await nameInput.clear()
    await nameInput.fill("AB") // Only 2 characters

    // Error should still be visible
    const errorMessage = page.getByTestId("name-error-message")
    await expect(errorMessage).toBeVisible()

    // System Prompt button should not be visible
    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).not.toBeVisible()
  })

  test("Name validation - 3 characters should pass", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    const nameInput = page.getByTestId("name-input")
    await nameInput.clear()
    await nameInput.fill("ABC") // Exactly 3 characters

    // Error should not be visible
    const errorMessage = page.getByTestId("name-error-message")
    await expect(errorMessage).not.toBeVisible()

    // System Prompt button should be visible
    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).toBeVisible()
  })

  test("System Prompt validation - required field", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    const nameInput = page.getByTestId("name-input")
    await nameInput.fill("TestApp")

    // Click System Prompt button
    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).toBeVisible()
    await systemPromptButton.click()

    // System prompt textarea should be visible
    const systemPromptTextarea = page.getByTestId("system-prompt-textarea")
    await expect(systemPromptTextarea).toBeVisible()

    // Continue button should be visible
    const continueButton = page.getByTestId("continue-button")
    await expect(continueButton).toBeVisible()

    // Click continue without filling system prompt
    await continueButton.click()

    // Should show toast error (we can't easily test toast, but button should still be there)
    // The modal should still be open
    await expect(systemPromptTextarea).toBeVisible()
  })

  test("System Prompt validation - filled should proceed", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    const nameInput = page.getByTestId("name-input")
    await nameInput.fill("TestApp")

    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).toBeVisible()
    await systemPromptButton.click()

    const systemPromptTextarea = page.getByTestId("system-prompt-textarea")
    await expect(systemPromptTextarea).toBeVisible()

    // Fill system prompt
    await systemPromptTextarea.fill(
      "You are a helpful AI assistant for testing.",
    )

    const continueButton = page.getByTestId("continue-button")
    await expect(continueButton).toBeVisible()
    await continueButton.click()

    await wait(2000)

    // Should proceed - system prompt textarea should not be visible
    await expect(systemPromptTextarea).not.toBeVisible()
  })

  test("Complete flow - name + system prompt", async ({ page }) => {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    await wait(5000)

    // Step 1: Click add agent
    const addAgentButton = page.getByTestId("add-agent-button")
    await expect(addAgentButton).toBeVisible()
    await addAgentButton.click()

    // Step 2: Fill name
    const nameInput = page.getByTestId("name-input")
    await expect(nameInput).toHaveValue("MyAgent")
    await nameInput.fill("ValidationTestApp")

    // Step 3: Verify error is gone
    const errorMessage = page.getByTestId("name-error-message")
    await expect(errorMessage).not.toBeVisible()

    // Step 4: Click system prompt
    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).toBeVisible()
    await systemPromptButton.click()

    // Step 5: Fill system prompt
    const systemPromptTextarea = page.getByTestId("system-prompt-textarea")
    await expect(systemPromptTextarea).toBeVisible()
    await systemPromptTextarea.fill(
      "You are ValidationTestApp, a specialized AI for testing validation flows.",
    )

    // Step 6: Click continue
    const continueButton = page.getByTestId("continue-button")
    await expect(continueButton).toBeVisible()
    await continueButton.click()

    await wait(2000)

    // Step 7: Verify success - should be back to settings view
    await expect(systemPromptTextarea).not.toBeVisible()
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveValue("ValidationTestApp")
  })
})
