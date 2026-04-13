import type { Page } from "@playwright/test"
import * as dotenv from "dotenv"

dotenv.config()

// API Test Utilitiels
export { APIClient } from "./api/client"
export type { ScheduledJob } from "./fixtures/api/scheduledJobs"
export { scheduledJobFactory } from "./fixtures/api/scheduledJobs"

export type modelName = "chatGPT" | "claude" | "gemini" | "sushi" | "perplexity"

export const TEST_GUEST_FINGERPRINTS = (
  process.env.TEST_GUEST_FINGERPRINTS?.split(",") || []
).filter((fp) => fp)
export const TEST_MEMBER_FINGERPRINTS = (
  process.env.TEST_MEMBER_FINGERPRINTS?.split(",") || []
).filter((fp) => fp)
export const TEST_MEMBER_EMAILS = (
  process.env.TEST_MEMBER_EMAILS?.split(",") || []
).filter((email) => email)

export const VEX_TEST_EMAIL = process.env.VEX_TEST_EMAIL!

export const VEX_TEST_PASSWORD = process.env.VEX_TEST_PASSWORD!
export const VEX_TEST_FINGERPRINT = TEST_MEMBER_FINGERPRINTS?.[0] || ""
export const VEX_TEST_EMAIL_2 = process.env.VEX_TEST_EMAIL_2!
export const VEX_TEST_PASSWORD_2 = process.env.VEX_TEST_PASSWORD_2!
export const VEX_TEST_FINGERPRINT_2 = TEST_MEMBER_FINGERPRINTS?.[1] || ""
export const VEX_TEST_EMAIL_3 = process.env.VEX_TEST_EMAIL_3!
export const VEX_TEST_PASSWORD_3 = process.env.VEX_TEST_PASSWORD_3!
export const VEX_TEST_PASSWORD_4 = process.env.VEX_TEST_PASSWORD_4!

export const VEX_TEST_EMAIL_4 = process.env.VEX_TEST_EMAIL_4!

export const VEX_TEST_FINGERPRINT_3 = TEST_MEMBER_FINGERPRINTS?.[2] || ""
export const VEX_TEST_FINGERPRINT_4 = TEST_MEMBER_FINGERPRINTS?.[3] || ""

export const VEX_LIVE_FINGERPRINTS = (
  process.env.VEX_LIVE_FINGERPRINTS?.split(",") || []
).filter((fp) => fp)

export const VEX_LIVE_FINGERPRINT = VEX_LIVE_FINGERPRINTS[0] || ""
export const VEX_LIVE_FINGERPRINT_2 = VEX_LIVE_FINGERPRINTS[1] || ""
export const VEX_LIVE_FINGERPRINT_3 = VEX_LIVE_FINGERPRINTS[2] || ""

export const TEST_URL =
  process.env.TEST_URL! || process.env.PLAYWRIGHT_BASE_URL!

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
export const isCI = process.env.VITE_CI || process.env.CI

const getURL = (
  {
    isLive = false,
    isMember = false,
    path = "",
    fingerprint = "",
    app = "",
  }: {
    isLive?: boolean
    isMember?: boolean
    path?: string
    fingerprint?: string
    app?: string
  } = {
    isLive: false,
    isMember: false,
    path: "",
    fingerprint: "",
    app: "",
  },
) => {
  const base = TEST_URL
  const fp = isMember
    ? isLive
      ? VEX_LIVE_FINGERPRINT_2
      : fingerprint || TEST_MEMBER_FINGERPRINTS[0] || ""
    : isLive
      ? VEX_LIVE_FINGERPRINT
      : fingerprint || TEST_GUEST_FINGERPRINTS[0] || ""

  const appParam = app ? `&app=${app}` : ""
  const url = `${base}${path}?fp=${fp}${appParam}`

  return url
}

export const getModelCredits = (model: string) =>
  model === "chatGPT" || model === "gemini"
    ? 4
    : model === "claude" || model === "perplexity"
      ? 3
      : 2

export const storeApps = [
  "vex",
  "chrry",
  "atlas",
  "vault",
  "claude",
  "search",
  "sushi",
  "zarathustra",
  "popcorn",
]

const simulateInputPaste = async (page: Page, text: string) => {
  await page.evaluate((content) => {
    const textarea = document.querySelector(
      'textarea[data-testid="chat-textarea"]',
    ) as HTMLTextAreaElement
    if (!textarea) return

    // Create a basic event
    const pasteEvent = new Event("paste", {
      bubbles: true,
      cancelable: true,
    })

    // Add clipboardData getter
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        getData: () => content,
        types: ["text/plain"],
        files: [],
        items: [
          {
            kind: "string",
            type: "text/plain",
            getAsString: (callback: (text: string) => void) =>
              callback(content),
          },
        ],
      },
      writable: false,
    })

    // Dispatch the event
    textarea.dispatchEvent(pasteEvent)

    // Set the value directly after the paste event
    textarea.value = content

    // Trigger input event to simulate actual typing
    const inputEvent = new Event("input", { bubbles: true })
    textarea.dispatchEvent(inputEvent)
  }, text)
}

const simulatePaste = async (page: Page, text: string) => {
  // Use Playwright's built-in clipboard API
  await page.evaluate(async (content) => {
    // Write to clipboard
    await navigator.clipboard.writeText(content)

    // Find the paste button and click it
    const pasteButton = document.querySelector(
      '[data-testid*="artifacts-paste-button"]',
    ) as HTMLButtonElement
    if (pasteButton) {
      pasteButton.click()
    }
  }, text)
}

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}

const logs = new Map<string, number>() // msg → timestamp
export const log = ({ page }: { page: Page }) => {
  page.on("console", (msg) => {
    const now = Date.now()
    const lastSeen = logs.get(msg.text())

    // Only skip if seen within last 5 seconds
    if (lastSeen && now - lastSeen < 5000) return

    msg.type() !== "warning" &&
      !msg.text().includes("token") &&
      !msg.text().includes("fp") &&
      console.log(`[browser][${msg.type()}] ${msg.text()}`)
    logs.set(msg.text(), now)
  })
}

// 🌿 Branch-Based AI Agents
export {
  autoDetectAndSwitch,
  autoDetectAndSwitchSafe,
  type BranchAgentWorkspace,
  type BranchContext,
  createBranchWorkspace,
  deleteBranchWorkspace,
  generateAgentId,
  getCurrentBranch,
  getCurrentBranchSafe,
  getOrCreateBranchWorkspace,
  loadBranchWorkspace,
  parseBranchName,
  recordMutation,
  saveBranchWorkspace,
  switchBranchContext,
  switchBranchContextSafe,
} from "./agent/branchContext"
// 🤖 ChopStick Expert - Payload & Model Optimizer
export {
  buildRamenPayload,
  buildStoreKnowledgeBase,
  type ChopStickContext,
  type ChopStickDecision,
  getJoinWeights,
  getPreset,
  type JoinWeights,
  type ModelInfo,
  modelPricing,
  optimizeChopStick,
  type PresetName,
  presets,
  type StoreAppKnowledge,
  type StoreKnowledgeBase,
} from "./agent/chopstickExpert"

// 🌟 Golden Ratio φ-Engine
export {
  DEFAULT_TRIGGERS,
  evaluateGoldenRatio,
  FIBONACCI,
  formatFibonacciPreview,
  type GoldenFeature,
  type GoldenRatioConfig,
  type GoldenTrigger,
  type GoldenTriggerConfig,
  getDefaultTriggers,
  getNewlyTriggeredFeatures,
  getNextFibonacciThreshold,
  getUserGoldenRatioConfig,
} from "./agent/goldenRatio"
export { capitalizeFirstLetter, getURL, simulateInputPaste, simulatePaste }
