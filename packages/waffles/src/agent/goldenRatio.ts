/**
 * Golden Ratio Adaptive Trigger System (φ-Engine)
 *
 * Progressive feature unlock mechanism based on Fibonacci thresholds.
 * AI capabilities awaken dynamically as users create threads and accumulate messages.
 */

export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]

export type GoldenFeature =
  | "memory"
  | "kanban"
  | "characterProfile"
  | "instructions"
  | "placeholders"
  | "vectorEmbed"

export interface GoldenTrigger {
  feature: GoldenFeature
  homeApp: "hippo" | "focus" | "sushi" | "grape"
  threadThreshold: number
  messageThreshold: number
}

export interface GoldenTriggerConfig {
  threadThreshold: number
  messageThreshold: number
  enabled: boolean
}

export type GoldenRatioConfig = Partial<
  Record<GoldenFeature, GoldenTriggerConfig>
>

export const DEFAULT_TRIGGERS: GoldenTrigger[] = [
  {
    feature: "memory",
    homeApp: "hippo",
    threadThreshold: 3,
    messageThreshold: 2,
  },
  {
    feature: "kanban",
    homeApp: "focus",
    threadThreshold: 5,
    messageThreshold: 3,
  },
  {
    feature: "characterProfile",
    homeApp: "hippo",
    threadThreshold: 5,
    messageThreshold: 5,
  },
  {
    feature: "placeholders",
    homeApp: "hippo",
    threadThreshold: 8,
    messageThreshold: 5,
  },
  {
    feature: "instructions",
    homeApp: "sushi",
    threadThreshold: 8,
    messageThreshold: 8,
  },
  {
    feature: "vectorEmbed",
    homeApp: "grape",
    threadThreshold: 13,
    messageThreshold: 8,
  },
]

export function getDefaultTriggers(): GoldenTrigger[] {
  return DEFAULT_TRIGGERS.map((t) => ({ ...t }))
}

export function getUserGoldenRatioConfig(
  userConfig?: GoldenRatioConfig | null,
): Record<GoldenFeature, GoldenTriggerConfig> {
  const defaults = Object.fromEntries(
    DEFAULT_TRIGGERS.map((t) => [
      t.feature,
      {
        threadThreshold: t.threadThreshold,
        messageThreshold: t.messageThreshold,
        enabled: true,
      },
    ]),
  ) as Record<GoldenFeature, GoldenTriggerConfig>

  if (!userConfig) return defaults

  for (const key of Object.keys(userConfig) as GoldenFeature[]) {
    const cfg = userConfig[key]
    if (!cfg) continue
    defaults[key] = {
      threadThreshold: cfg.threadThreshold ?? defaults[key].threadThreshold,
      messageThreshold: cfg.messageThreshold ?? defaults[key].messageThreshold,
      enabled: cfg.enabled ?? true,
    }
  }

  return defaults
}

export interface GoldenRatioEvaluation {
  feature: GoldenFeature
  homeApp: GoldenTrigger["homeApp"]
  triggered: boolean
  alreadyTriggered: boolean
  threadThreshold: number
  messageThreshold: number
  userThreadCount: number
  threadMessageCount: number
}

export function evaluateGoldenRatio(
  userThreadCount: number,
  threadMessageCount: number,
  lastTriggeredFeatures: GoldenFeature[],
  userConfig?: GoldenRatioConfig | null,
): GoldenRatioEvaluation[] {
  const config = getUserGoldenRatioConfig(userConfig)
  const triggeredSet = new Set(lastTriggeredFeatures)

  return DEFAULT_TRIGGERS.map((trigger) => {
    const cfg = config[trigger.feature]
    const isTriggered =
      cfg.enabled &&
      userThreadCount >= cfg.threadThreshold &&
      threadMessageCount >= cfg.messageThreshold

    return {
      feature: trigger.feature,
      homeApp: trigger.homeApp,
      triggered: isTriggered,
      alreadyTriggered: triggeredSet.has(trigger.feature),
      threadThreshold: cfg.threadThreshold,
      messageThreshold: cfg.messageThreshold,
      userThreadCount,
      threadMessageCount,
    }
  })
}

export function getNewlyTriggeredFeatures(
  userThreadCount: number,
  threadMessageCount: number,
  lastTriggeredFeatures: GoldenFeature[],
  userConfig?: GoldenRatioConfig | null,
): GoldenRatioEvaluation[] {
  return evaluateGoldenRatio(
    userThreadCount,
    threadMessageCount,
    lastTriggeredFeatures,
    userConfig,
  ).filter((e) => e.triggered && !e.alreadyTriggered)
}

export function getNextFibonacciThreshold(value: number): number {
  const next = FIBONACCI.find((f) => f > value)
  return next ?? FIBONACCI[FIBONACCI.length - 1]!
}

export function formatFibonacciPreview(
  userThreadCount: number,
  threadMessageCount: number,
  userConfig?: GoldenRatioConfig | null,
): {
  feature: GoldenFeature
  homeApp: string
  progressThread: number
  progressMessage: number
  ready: boolean
  nextThresholdThread: number
  nextThresholdMessage: number
}[] {
  const config = getUserGoldenRatioConfig(userConfig)

  return DEFAULT_TRIGGERS.map((trigger) => {
    const cfg = config[trigger.feature]
    const ready =
      cfg.enabled &&
      userThreadCount >= cfg.threadThreshold &&
      threadMessageCount >= cfg.messageThreshold

    return {
      feature: trigger.feature,
      homeApp: trigger.homeApp,
      progressThread: Math.min(1, userThreadCount / cfg.threadThreshold),
      progressMessage: Math.min(1, threadMessageCount / cfg.messageThreshold),
      ready,
      nextThresholdThread: cfg.threadThreshold,
      nextThresholdMessage: cfg.messageThreshold,
    }
  })
}

/**
 * Maps a triggered feature to the ChopStick join weight key
 * so that generateAIContent can dynamically boost context.
 */
export function featureToJoinBoost(feature: GoldenFeature):
  | {
      key: "memories" | "instructions" | "placeholders" | "characterProfile"
      boost: number
    }
  | undefined {
  switch (feature) {
    case "memory":
      return { key: "memories", boost: 3 }
    case "instructions":
      return { key: "instructions", boost: 3 }
    case "placeholders":
      return { key: "placeholders", boost: 3 }
    case "characterProfile":
      return { key: "characterProfile", boost: 2 }
    default:
      return undefined
  }
}
