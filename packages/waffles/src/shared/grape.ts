import { expect, type Page } from "@playwright/test"
import { wait } from ".."
import { chat } from "./chat"

export const grape = async ({
  page,
  isMember,
  isLive,
  index = 0,
  earnedCredits = 0,
}: {
  page: Page
  isMember: boolean
  isLive: boolean
  index?: number
  earnedCredits?: number
}): Promise<number> => {
  const feedbackPrompts = [
    `I really like the clean design and the color scheme feels modern.
10 Credits - Specific Feedback:
The fire icon in the top right is a bit confusing - I wasn't sure if it meant notifications or something else. Adding a tooltip would help clarify its purpose.`,
    //     `15 Credits - Actionable Feedback:
    // The chat interface could benefit from keyboard shortcuts for power users. For example, Cmd+K to focus the search, Cmd+N for new thread, and Cmd+Enter to send messages would significantly improve the workflow.`,
    //     `20 Credits - Exceptional Feedback:
    //     The onboarding flow has a few UX issues I noticed:

    //     1. The "Get Started" button on the landing page doesn't clearly indicate what happens next - consider changing it to "Create Your First Agent" to set expectations.
    //     2. When uploading files, there's no progress indicator, which made me think the app froze during a large upload. Adding a progress bar with file size/upload speed would reduce anxiety.`,
    //     `20 Credits - Exceptional Feedback:
    //     3. The empty state in the chat could be more engaging - instead of just showing tips, consider adding quick-start templates like "Plan a trip", "Analyze data", etc. that users can click to see example interactions.
    //     4. The credit system isn't explained anywhere visible. New users might not understand why their messages stop working. A small "?" icon next to the credit counter with a tooltip explaining the system would help.
    //        These changes would significantly reduce friction for new users and improve retention.`,
  ]
  const grapesButton = page.getByTestId("grapes-button")
  await expect(grapesButton).toBeVisible()
  await grapesButton.click()

  await wait(1000)

  const actualGrapesCount = await page.getByTestId("grapes-app-button").count()
  // Limit to available feedback prompts
  const grapesCount = Math.min(actualGrapesCount, feedbackPrompts.length)

  if (index >= grapesCount) {
    return earnedCredits
  }

  // Re-query elements inside loop to avoid staleness
  const getGrapeButton = () => page.getByTestId("grapes-app-button").nth(index)

  await expect(getGrapeButton()).toBeVisible({
    timeout: 100000,
  })
  await getGrapeButton().click()

  const grapesFeedbackButton = page.getByTestId("grapes-feedback-button")
  await expect(grapesFeedbackButton).toBeVisible()
  await grapesFeedbackButton.click()

  // Distribute feedback prompts cyclically
  const prompt = feedbackPrompts[index % feedbackPrompts.length]

  if (!prompt) {
    return earnedCredits
  }

  // Estimate credits based on prompt content (simple heuristic)
  let currentStepCredits = 0
  if (prompt.includes("10 Credits")) currentStepCredits += 10
  if (prompt.includes("15 Credits")) currentStepCredits += 15
  if (prompt.includes("20 Credits")) currentStepCredits += 20
  if (prompt.includes("clean design")) currentStepCredits += 5 // Base for generic

  // await prepare({ page })

  await chat({
    page,
    isMember,
    isLive,
    isNewChat: false,
    bookmark: false,
    isPear: true, // Pear feedback doesn't count towards hourly limit
    prompts: [
      {
        text: prompt,
        model: "sushi",
      },
    ],
  })

  const menuHomeButton = page.getByTestId("menu-home-button")
  await expect(menuHomeButton).toBeVisible()
  await menuHomeButton.click()

  return await grape({
    page,
    isMember,
    isLive,
    index: index + 1,
    earnedCredits: earnedCredits + currentStepCredits,
  })
}
