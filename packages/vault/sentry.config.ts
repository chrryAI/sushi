/**
 * Sentry configuration for @chrryai/machine package
 * Used by falkorSync.ts for error tracking
 */

import * as Sentry from "@sentry/node"

let sentryInitialized = false

export function initSentry() {
  if (sentryInitialized) return

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
    })
    // Sentry.init({
    //   dsn: process.env.SENTRY_DSN,
    //   environment:
    //     process.env.VITE_TESTING_ENV || process.env.NODE_ENV || "development",
    //   tunnel: "https://g.chrry.dev/api/submit/",
    //   tracesSampleRate: 1,
    //   debug: false,
    // })
    sentryInitialized = true
    console.log("✅ Sentry initialized in @chrryai/machine")
  }
}

// Auto-initialize on import
initSentry()
