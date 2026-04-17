import { captureException as captureExceptionSentry } from "@sentry/node"
import { sendDiscordNotification } from "./sendDiscordNotification"

interface BufferedError {
  message: string
  stack?: string
  context?: string
  timestamp: string
}

const errorBuffer: BufferedError[] = []
const FLUSH_INTERVAL_MS = 3 * 60 * 1000 // 3 minutes
const MAX_BUFFER_SIZE = 50

async function flushErrorBuffer() {
  if (errorBuffer.length === 0) return

  const errors = errorBuffer.splice(0, errorBuffer.length)

  const fields = errors.slice(0, 10).map((e, i) => ({
    name: `${i + 1}. ${e.context || "Error"} — ${e.timestamp}`,
    value: `\`\`\`${e.message.substring(0, 200)}${e.message.length > 200 ? "..." : ""}\`\`\``,
    inline: false,
  }))

  if (errors.length > 10) {
    fields.push({
      name: `+${errors.length - 10} more`,
      value: "Truncated to keep message size manageable.",
      inline: false,
    })
  }

  await sendDiscordNotification({
    embeds: [
      {
        title: `🚨 Error Batch (${errors.length} errors)`,
        color: 0xef4444,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  }).catch(() => {})
}

// Start flush interval (only in non-test environments)
if (process.env.NODE_ENV !== "test") {
  setInterval(flushErrorBuffer, FLUSH_INTERVAL_MS)
}

export function captureException(error: unknown, context?: any): void {
  // Always send to Sentry
  captureExceptionSentry(error)

  // Buffer for Discord batch
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error)

  const stack = error instanceof Error ? error.stack : undefined

  errorBuffer.push({
    message,
    stack,
    context,
    timestamp: new Date().toISOString().substring(11, 19), // HH:MM:SS
  })

  // Flush immediately if buffer is full
  if (errorBuffer.length >= MAX_BUFFER_SIZE) {
    flushErrorBuffer().catch(() => {})
  }
}

export default captureException
