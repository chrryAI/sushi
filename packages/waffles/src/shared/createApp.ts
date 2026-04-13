import { expect, type Page } from "@playwright/test"
import { getURL, type modelName, wait } from ".."
import { app } from "./app"
import { prepare } from "./clean"

import { signIn } from "./signIn"

const COLORS = {
  red: "#ef4444", // red-500
  orange: "#f97316", // orange-500
  blue: "#3b82f6", // blue-500
  green: "#22c55e", // green-500
  violet: "#8b5cf6", // violet-500
  purple: "#a855f7", // purple-500
} as const

const createApp = async ({
  app: appName,
  isRetro,
  slug,
  page,
  isLive,
  isMember,
  nav,
  isNewChat,
  creditsConsumed,
  messagesConsumed,
  isGrape,
  defaultAgent,
  colorScheme,
  placeholder,
  temperature,
  extend,
  theme,
  tier = "plus",
  visibility = "public",
}: {
  app: string
  isRetro?: boolean
  slug: string
  page: Page
  isLive: boolean
  isMember: boolean
  isGrape?: boolean
  defaultAgent?: string
  placeholder?: string
  extend?: string[]
  tier?: "free" | "pro" | "plus"
  visibility?: "public" | "private" | "unlisted"
  nav?: {
    name: string
    chat: {
      isRetro?: boolean
      instruction?: string
      prompts?: {
        model?: modelName
        stop?: boolean
        text: string
        agentMessageTimeout?: number
        webSearch?: boolean
        delete?: boolean
        mix?: {
          image?: number
          video?: number
          audio?: number
          paste?: number
          pdf?: number
        }
      }[]
      agentMessageTimeout?: number
      isNewChat?: boolean
      isLive?: boolean
      threadId?: string
      creditsConsumed?: number
      messagesConsumed?: number
      bookmark?: boolean
    }
  }[]
  isNewChat?: boolean
  creditsConsumed?: number
  messagesConsumed?: number
  theme?: "dark" | "light"
  colorScheme?: keyof typeof COLORS
  temperature?: number
}) => {
  if (isNewChat) {
    await page.goto(getURL({ isLive, isMember }), {
      waitUntil: "domcontentloaded",
      timeout: 100000,
    })
    // Wait for the main app container or chat input to ensure load
    await page.waitForSelector("body", { state: "attached" })
    await wait(2000) // Give hydration a moment
  }

  await signIn({ page })

  const capabilities = {
    chatGPT: {
      image: false,
      imageGeneration: false,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      codeExecution: true,
    },
    claude: {
      image: false,
      imageGeneration: false,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      codeExecution: true,
    },

    sushi: {
      image: true,
      imageGeneration: true,
      audio: true,
      video: true,
      webSearch: true,
      pdf: true,
      codeExecution: true,
    },
    gemini: {
      image: false,
      imageGeneration: false,
      audio: true,
      video: true,
      webSearch: false,
      pdf: true,
      codeExecution: true,
    },
    perplexity: {
      image: false,
      imageGeneration: false,
      audio: false,
      video: false,
      webSearch: true,
      pdf: false,
      codeExecution: false,
    },
  }

  const addAgentButton = page.getByTestId("add-agent-button")

  await expect(addAgentButton).toBeVisible()

  await addAgentButton.click()

  const nameInput = page.getByTestId("name-input")

  await expect(nameInput).toHaveValue("MyAgent")

  await nameInput.fill("")

  const errorMessage = page.getByTestId("name-error-message")

  const closeButton = page.getByTestId("agent-modal-close-button")

  await expect(errorMessage).toBeVisible()

  await closeButton.click()

  await wait(1000)

  expect(page.getByText("Name: minimum 3 characters")).toBeVisible()

  await wait(1000)

  await nameInput.clear()
  await nameInput.fill("123456789101112")

  const errorMessage2 = page.getByTestId("name-error-message")
  await expect(errorMessage2).toBeVisible()

  await closeButton.click()

  await wait(1000)

  await expect(page.getByText("Name: maximum 12 characters")).toBeVisible()

  await wait(1000)

  await nameInput.clear()
  await nameInput.fill(appName)
  await expect(errorMessage).toBeHidden()

  if (colorScheme) {
    const colorSchemeSelect = page.getByTestId(
      `agent-color-scheme-${colorScheme}`,
    )
    await expect(colorSchemeSelect).toBeVisible()

    await colorSchemeSelect.click()
  }

  if (theme) {
    const lightThemeSelect = page.getByTestId(`agent-theme-light`)
    await expect(lightThemeSelect).toBeVisible()
    await lightThemeSelect.click()

    if (theme === "dark") {
      const darkThemeSelect = page.getByTestId(`agent-theme-dark`)
      await expect(darkThemeSelect).toBeVisible()
      await darkThemeSelect.click()
    }
  }

  if (defaultAgent) {
    const defaultModelSelect = page.getByTestId("default-model-select")
    await expect(defaultModelSelect).toBeVisible()
    await defaultModelSelect.selectOption(defaultAgent)

    // Test capability requirements based on selected model
    const modelCapabilities =
      capabilities[defaultAgent as keyof typeof capabilities]

    // Capability name mapping for error messages
    const capabilityNames: Record<string, string> = {
      audio: "Voice",
      video: "Video",
      webSearch: "Web Search",
      pdf: "File Analysis",
      image: "Image Analysis",
      imageGeneration: "Image Generation",
      codeExecution: "Code Execution",
    }

    if (modelCapabilities) {
      // Test trying to disable a required capability
      for (const capability of Object.keys(modelCapabilities)) {
        const checkbox = page.getByTestId(`${capability}-checkbox`)
        await expect(checkbox).toBeEnabled()
        await expect(checkbox).toBeChecked()

        // Click the parent label to toggle the checkbox
        const checkboxLabel = checkbox.locator("..")
        await checkboxLabel.click()

        if (
          modelCapabilities[capability as keyof typeof modelCapabilities] ===
          true
        ) {
          await wait(500)

          const capabilityDisplayName =
            capabilityNames[capability] || capability
          const errorToast = page.getByText(
            `${capabilityDisplayName} required by ${defaultAgent}`,
          )
          await expect(errorToast).toBeVisible()
          await expect(checkbox).toBeChecked()
        }
      }

      // Test web search if required
    }
  }

  if (temperature !== undefined) {
    const temperatureInput = page.getByTestId("temperature-input")
    await expect(temperatureInput).toBeVisible()
    await temperatureInput.fill(temperature.toString())
  }

  if (placeholder) {
    const placeholderInput = page.getByTestId("placeholder-input")
    await placeholderInput.fill(placeholder)
  }

  const extendsTab = page.getByTestId("extends-tab")
  await extendsTab.click()

  const calendarCheckbox = page.getByTestId("calendar-checkbox")
  const calendarCheckboxLabel = calendarCheckbox.locator("..")
  await calendarCheckboxLabel.click()

  expect(
    page.getByText("Calendar required because you are using Vex"),
  ).toBeVisible()

  const locationCheckbox = page.getByTestId("location-checkbox")
  const locationCheckboxLabel = locationCheckbox.locator("..")
  await locationCheckboxLabel.click()

  expect(
    page.getByText(
      "Location required because you are using {{location}} templates on your instructions",
    ),
  ).toBeVisible()

  const weatherCheckbox = page.getByTestId("weather-checkbox")
  const weatherCheckboxLabel = weatherCheckbox.locator("..")
  await weatherCheckboxLabel.click()

  expect(
    page.getByText(
      "Weather required because you are using {{weather}} templates on your instructions",
    ),
  ).toBeVisible()

  if (visibility) {
    const visibilitySelect = page.getByTestId("visibility-select")
    await expect(visibilitySelect).toBeVisible()
    await visibilitySelect.selectOption(visibility)
  }

  const monetizationTab = page.getByTestId("monetization-tab")

  if (tier) {
    await monetizationTab.click()
    const tierSelect = page.getByTestId("tier-select")
    await expect(tierSelect).toBeVisible()
    await tierSelect.selectOption(tier)
  }

  const settingsTab = page.getByTestId("settings-tab")

  const apiTab = page.getByTestId("api-tab")
  await apiTab.click()

  const apiKeyRequired = page.getByTestId("openrouter-api-key-required")

  if (tier !== "free") {
    await expect(apiKeyRequired).toBeVisible()

    const systemPromptButton = page.getByTestId("system-prompt-button")
    await expect(systemPromptButton).toBeVisible()
    await systemPromptButton.click()

    const continueButton = page.getByTestId("continue-button")
    await expect(continueButton).toBeVisible()
    await continueButton.click()

    const apiKeyRequiredSystemPrompt = page.getByText(
      "OpenRouter API key is required for paid tiers to enable revenue sharing.",
    )
    await expect(apiKeyRequiredSystemPrompt).toBeVisible()

    await expect(settingsTab).toBeVisible()
    await settingsTab.click()

    await apiTab.click()

    const replicateApiKey = page.getByTestId("replicate-api-key")

    const replicateApiKeyRequired =
      await replicateApiKey.getAttribute("data-required")
    expect(replicateApiKeyRequired).toBe("true")

    await expect(replicateApiKey).toBeVisible()
    await replicateApiKey.fill("testReplicateApiKey")

    const falApiKey = page.getByTestId("fal-api-key")
    const falApiKeyRequired = await falApiKey.getAttribute("data-required")
    expect(falApiKeyRequired).toBe("true")
    await expect(falApiKey).toBeVisible()
    await falApiKey.fill("testFalApiKey")

    const openRouterApiKey = page.getByTestId("openrouter-api-key")
    await expect(openRouterApiKey).toBeVisible()
    await openRouterApiKey.fill("testOpenRouterApiKey")
  } else {
    const replicateApiKey = page.getByTestId("replicate-api-key")

    const replicateApiKeyRequired =
      await replicateApiKey.getAttribute("data-required")
    expect(replicateApiKeyRequired).toBe("false")
    await expect(apiKeyRequired).not.toBeVisible()
  }

  // Click System Prompt button
  const systemPromptButton = page.getByTestId("system-prompt-button")
  await expect(systemPromptButton).toBeVisible()
  await systemPromptButton.click()

  // Fill system prompt
  const systemPromptTextarea = page.getByTestId("system-prompt-textarea")
  await expect(systemPromptTextarea).toBeVisible()
  await systemPromptTextarea.fill(
    "You are a helpful AI assistant specialized in testing.",
  )

  // Click Continue button
  const continueButton = page.getByTestId("continue-button")
  await expect(continueButton).toBeVisible()
  await continueButton.click()

  await wait(2000)

  const saveAppButton = page.getByTestId("save-app")
  await expect(saveAppButton).toBeVisible()
  await saveAppButton.click()

  await wait(1000)

  await prepare({ page })

  const editAppButton = page.getByTestId("edit-app")
  await expect(editAppButton).toBeVisible({
    timeout: 10000,
  })

  if (extend) {
    for (const element of extend) {
      const app = page.getByTestId(`app-${element}`)
      await expect(app).toBeVisible()
    }
  }

  await wait(7000)

  await app({
    app: appName,
    isRetro,
    slug,
    page,
    isLive,
    isStoreApp: true,
    isMember: true,
    nav,
    isNewChat: true,
    creditsConsumed,
    messagesConsumed,
    isGrape,
  })
}

export { createApp }
