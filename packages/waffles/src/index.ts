import * as dotenv from "dotenv"

dotenv.config()

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

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}

// 🌿 Branch-Based AI Agents
export * from "./agent/branchContext"
// 🤖 ChopStick Expert - Payload & Model Optimizer
export {
  buildRamenPayload,
  buildStoreKnowledgeBase,
  type ChopStickContext,
  type ChopStickDecision,
  getJoinWeights,
  getPreset,
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
  getDefaultTriggers,
  getNewlyTriggeredFeatures,
  getNextFibonacciThreshold,
  getUserGoldenRatioConfig,
  type goldenFeature,
  type goldenRatioConfig,
  type goldenTrigger,
  type goldenTriggerConfig,
} from "./agent/goldenRatio"
export { capitalizeFirstLetter, getURL }
