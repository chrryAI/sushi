interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  timestamp?: string
  footer?: {
    text: string
  }
}

interface DiscordNotificationOptions {
  content?: string
  embeds?: DiscordEmbed[]
}

export async function sendDiscordNotification(
  options: DiscordNotificationOptions,
  DISCORD_WEBHOOK_URL = process.env.DISCORD_GLITCH_URL,
): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("⚠️ DISCORD_WEBHOOK_URL not configured")
    return false
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`)
    }

    console.log("✅ Discord notification sent")
    return true
  } catch (error) {
    // Sanitize error to prevent leaking webhook URL
    const sanitizedError =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message.replace(
              DISCORD_WEBHOOK_URL,
              "[REDACTED_WEBHOOK_URL]",
            ),
            stack: error.stack?.replace(
              DISCORD_WEBHOOK_URL,
              "[REDACTED_WEBHOOK_URL]",
            ),
          }
        : { message: String(error) }

    console.error("❌ Discord notification failed:", sanitizedError)
    return false
  }
}

/**
 * Send error notification to Discord and capture in Sentry
 * @param error - The error to report
 * @param context - Additional context about where the error occurred
 * @param sendToDiscord - Whether to send Discord notification (default: false, true for scheduled jobs)
 */
export async function sendErrorNotification(
  error: unknown,
  context?: {
    location?: string
    jobType?: string
    appName?: string
    additionalInfo?: Record<string, any>
  },
  sendToDiscord: boolean = false,
  DISCORD_WEBHOOK_URL = process.env.DISCORD_GLITCH_URL,
): Promise<void> {
  // Always capture to Sentry (import inline to avoid circular deps)
  try {
    const { captureException } = await import("@sentry/node")
    captureException(error)
  } catch {}

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`❌ Error in ${context?.location || "unknown"}:`, error)

  // Optionally send to Discord (enabled for scheduled jobs)
  if (sendToDiscord && DISCORD_WEBHOOK_URL) {
    try {
      await sendDiscordNotification({
        embeds: [
          {
            title: "🚨 Error Alert",
            color: 0xef4444, // Red
            fields: [
              ...(context?.location
                ? [
                    {
                      name: "Location",
                      value: context.location,
                      inline: true,
                    },
                  ]
                : []),
              ...(context?.jobType
                ? [
                    {
                      name: "Job Type",
                      value: context.jobType,
                      inline: true,
                    },
                  ]
                : []),
              ...(context?.appName
                ? [
                    {
                      name: "App",
                      value: context.appName,
                      inline: true,
                    },
                  ]
                : []),
              {
                name: "Error Message",
                value: errorMessage.substring(0, 1000),
                inline: false,
              },
              ...(errorStack
                ? [
                    {
                      name: "Stack Trace",
                      value: errorStack.substring(0, 1000),
                      inline: false,
                    },
                  ]
                : []),
              ...(context?.additionalInfo
                ? [
                    {
                      name: "Additional Info",
                      value: JSON.stringify(context.additionalInfo).substring(
                        0,
                        500,
                      ),
                      inline: false,
                    },
                  ]
                : []),
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: "Vex Error Monitoring",
            },
          },
        ],
      })
    } catch (discordError) {
      console.error("⚠️ Failed to send error to Discord:", discordError)
    }
  }
}
