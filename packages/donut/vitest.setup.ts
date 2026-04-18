import { vi } from "vite-plus/test"

// Polyfill crypto if needed (happy-dom usually provides it, but just in case)
if (!globalThis.crypto) {
  // Try to use node crypto webcrypto if available
  try {
    const { webcrypto } = require("node:crypto")
    globalThis.crypto = webcrypto as any
  } catch (_e) {
    // console.warn('Failed to polyfill crypto', e)
  }
}

// Suppress AbortError noise from happy-dom during teardown
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    args[0] instanceof Error &&
    (args[0].name === "AbortError" ||
      args[0].message?.includes("The operation was aborted"))
  ) {
    return
  }
  if (
    typeof args[0] === "string" &&
    (args[0].includes("AbortError") ||
      args[0].includes("The operation was aborted"))
  ) {
    return
  }
  // Sanitize arguments to prevent CodeQL security warnings about clear-text logging
  const sanitizedArgs = args.map((arg) => {
    if (typeof arg === "string" && arg.toLowerCase().includes("apikey")) {
      return "[REDACTED SENSITIVE DATA]"
    }
    if (arg && typeof arg === "object" && "apiKey" in arg) {
      return { ...arg, apiKey: "*** REDACTED ***" }
    }
    return arg
  })

  // originalConsoleError(...sanitizedArgs)
}

// Workaround for Node >=20.19 JSON ESM import assertions failing in @emoji-mart/data
vi.mock("@emoji-mart/data", () => {
  return {
    default: {
      categories: [],
      emojis: {},
      aliases: {},
      sheet: { cols: 0, rows: 0 },
    },
  }
})
