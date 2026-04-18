// This file configures the initialization of Sentry for the client.
// https://docs.sentry.io/platforms/javascript/guides/react/

import * as Sentry from "@sentry/react"

import { getEnv, isProduction } from "./utils/env"

const SENTRY_DSN = getEnv().VITE_SENTRY_DSN
const API_URL = getEnv().VITE_API_URL || "https://chrry.dev/api"
if (SENTRY_DSN) {
  // Sentry.init({
  //   dsn: SENTRY_DSN,

  //   // Use custom tunnel to bypass ad blockers
  //   // tunnel: "/api/sentry-tunnel",

  //   // Integrations
  //   integrations: [
  //     Sentry.browserTracingIntegration(),
  //     Sentry.replayIntegration({
  //       maskAllText: true,
  //       blockAllMedia: true,
  //     }),
  //   ],

  //   // Performance Monitoring
  //   tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

  //   // Session Replay
  //   replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  //   replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

  //   // Filter out noise
  //   beforeSend(event, hint) {
  //     // Ignore errors from browser extensions
  //     if (
  //       event.exception?.values?.[0]?.stacktrace?.frames?.some(
  //         (frame) =>
  //           frame.filename?.includes("chrome-extension://") ||
  //           frame.filename?.includes("moz-extension://"),
  //       )
  //     ) {
  //       return null
  //     }

  //     // Ignore ResizeObserver errors (common browser noise)
  //     if (event.message?.includes("ResizeObserver")) {
  //       return null
  //     }

  //     // Ignore network errors (often user connectivity issues)
  //     if (
  //       event.message?.includes("NetworkError") ||
  //       event.message?.includes("Failed to fetch")
  //     ) {
  //       return null
  //     }

  //     return event
  //   },

  //   // CRITICAL: Always attach stack traces to all events
  //   attachStacktrace: true,

  //   // Environment for filtering (e2e, development, production)
  //   environment: import.meta.env.VITE_TESTING_ENV || import.meta.env.MODE,

  //   // Release tracking
  //   release: import.meta.env.VITE_APP_VERSION,

  //   // Debug mode (only in development)
  //   // debug: import.meta.env.MODE === "development",
  // })

  Sentry.init({
    dsn: SENTRY_DSN,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    tunnel: `${API_URL}/debugger`,
    environment: isProduction ? "production" : "development",
    sendDefaultPii: true,
    // release: import.meta.env.VITE_APP_VERSION,
  })
}

export default Sentry
