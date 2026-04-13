import { faker } from "@faker-js/faker"
import type { Page } from "@playwright/test"
import type { modelName } from ".."
import { chat } from "./chat"

export const limit = async ({
  page,
  isMember,
  isSubscriber,
}: {
  page: Page
  isMember?: boolean
  isSubscriber?: boolean
}) => {
  // Calculate exact hourly limit for guest users
  const hourlyLimit = isSubscriber ? 100 : isMember ? 30 : 10 // guests: 10, members: 30, subscribers: 100

  // Create prompts to consume exactly the hourly limit with mixed models
  const limitPrompts = Array.from({ length: hourlyLimit }, (_, i) => {
    const isFluxMessage = i % (isMember ? 5 : 3) === 0 // Every 3rd message is Flux
    const isClaudeMessage = isMember && i % 5 === 0 // Every 5th message in last 3 requests
    const isChatGPTMessage = isMember && i % 3 === 0 // Every 6th message in last 3 requests

    const like = false

    return {
      text: isFluxMessage
        ? `Create a beautiful ${faker.color.human()} ${faker.animal.type()} in a ${faker.location.city()} setting, digital art style`
        : i === hourlyLimit
          ? `Find latest news about ${faker.company.name()}`
          : `Test message ${i + 1} - ${faker.lorem.sentence()}`,
      model: isFluxMessage
        ? ("sushi" as modelName)
        : isClaudeMessage
          ? ("claude" as modelName)
          : isChatGPTMessage
            ? ("chatGPT" as modelName)
            : ("sushi" as modelName),
      agentMessageTimeout: isFluxMessage ? 100000 : 50000, // Flux needs more time
      shouldFail: i === hourlyLimit, // Only fail on last message
      like,
      imageGenerationEnabled: isFluxMessage,
    }
  })

  // Add one extra prompt that should fail
  const failPrompt = {
    text: "This message should fail due to hourly limit",
    model: "sushi" as modelName,
    shouldFail: true, // Flag to indicate this should fail
  }

  const _result = await chat({
    isNewChat: true,
    page,
    isMember,
    instruction: `Testing hourly limit of ${hourlyLimit} requests`,
    prompts: [...limitPrompts, failPrompt],
  })
}
