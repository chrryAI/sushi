/**
 * New Relic agent configuration for Flash (Vite SSR).
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || "Vex Flash"],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true,
  },
  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "trace",
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "request.headers.proxyAuthorization",
      "request.headers.setCookie*",
      "request.headers.x*",
      "response.headers.cookie",
      "response.headers.authorization",
      "response.headers.proxyAuthorization",
      "response.headers.setCookie*",
      "response.headers.x*",
    ],
  },
  // Track SSR performance
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 0.5, // Track transactions over 500ms
  },
}
