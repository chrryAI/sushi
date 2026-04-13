import { expect, type Page } from "@playwright/test"

export async function moodify({
  page,
  isGuest = true,
}: {
  page: Page
  isGuest?: boolean
}) {
  const moodify = page.getByTestId("moodify")
  await expect(moodify).toBeVisible()

  const moodifyReportsButton = page.getByTestId("moodify-reports-button")
  await expect(moodifyReportsButton).toBeVisible()

  await moodifyReportsButton.click()

  await page.waitForTimeout(1000)

  const moodsHideDemoButton = page.getByTestId("moods-hide-demo")
  const count = await moodsHideDemoButton.count()
  if (count > 0) {
    await moodsHideDemoButton.click()
  }

  const moodsShowDemoButton = page.getByTestId("moods-show-demo")
  await expect(moodsShowDemoButton).toBeVisible()

  await moodsShowDemoButton.click()

  const moodsDaily = page.getByTestId("moods-daily")
  await expect(moodsDaily).toBeVisible()

  const moodsPreviousWeekDaily = page.getByTestId("moods-previous-week-daily")
  await expect(moodsPreviousWeekDaily).toBeVisible()

  await moodsPreviousWeekDaily.click()

  const moodsNextWeekDaily = page.getByTestId("moods-next-week-daily")
  await expect(moodsNextWeekDaily).toBeVisible()

  await moodsNextWeekDaily.scrollIntoViewIfNeeded()
  await moodsNextWeekDaily.click()

  const moodsWeekly = page.getByTestId("moods-weekly")

  const moodsPreviousWeekWeekly = page.getByTestId("moods-previous-week-weekly")
  await expect(moodsPreviousWeekWeekly).toBeVisible()
  await moodsPreviousWeekWeekly.scrollIntoViewIfNeeded()
  await moodsPreviousWeekWeekly.click()

  const moodsNextWeekWeekly = page.getByTestId("moods-next-week-weekly")
  await expect(moodsNextWeekWeekly).toBeVisible()
  await moodsNextWeekWeekly.scrollIntoViewIfNeeded()
  await moodsNextWeekWeekly.click()

  await expect(moodsWeekly).toBeVisible()

  const moodsMonthly = page.getByTestId("moods-monthly")
  await expect(moodsMonthly).toBeVisible()

  const moodsPreviousMonth = page.getByTestId("moods-previous-month")
  await expect(moodsPreviousMonth).toBeVisible()
  await moodsPreviousMonth.scrollIntoViewIfNeeded()
  await moodsPreviousMonth.click()

  const moodsNextMonth = page.getByTestId("moods-next-month")
  await expect(moodsNextMonth).toBeVisible()
  await moodsNextMonth.scrollIntoViewIfNeeded()
  await moodsNextMonth.click()

  const moodifyStartChatButton = page.getByTestId("moodify-start-chat-button")
  await expect(moodifyStartChatButton).toBeVisible()

  await moodifyStartChatButton.click()

  const chatBox = page.getByTestId("chat-box")
  await expect(chatBox).toBeVisible()

  const moodifyChatMood = page.getByTestId("moodify-chat-mood")
  await expect(moodifyChatMood).toBeVisible()

  await expect(moodifyChatMood).toHaveAttribute("data-mood", "thinking")

  const moodifyChatEditMoodButton = page.getByTestId(
    "moodify-chat-edit-mood-button",
  )
  await expect(moodifyChatEditMoodButton).toBeVisible()

  await moodifyChatEditMoodButton.click()

  const moodifyChatInloveButton = page.getByTestId("moodify-chat-inlove-button")
  await expect(moodifyChatInloveButton).toBeVisible()

  await moodifyChatInloveButton.click()

  const moodifyMessageAgent = page.getByTestId("moodify-message-agent")

  await expect(moodifyChatMood).toHaveAttribute("data-mood", "inlove")

  const agentMessageCount = await moodifyMessageAgent.count()

  const moodifyInput = page.getByTestId("moodify-input")
  await expect(moodifyInput).toBeVisible()

  await moodifyInput.fill("Test message")

  const moodifySendButton = page.getByTestId("moodify-send-button")
  await expect(moodifySendButton).toBeVisible()

  await moodifySendButton.click()

  await page.waitForTimeout(1000)

  const moodifyMessageUser = page
    .getByTestId("moodify-message-user")
    .nth(agentMessageCount)
  await expect(moodifyMessageUser).toBeVisible()

  await expect(moodifyMessageUser).toHaveAttribute(
    "data-content",
    "Test message",
  )

  await expect(moodifyMessageUser).toHaveAttribute("data-mood", "inlove")

  await expect(
    page.getByTestId("moodify-message-agent").nth(agentMessageCount),
  ).toBeVisible({
    timeout: 100000,
  })

  const moodifyCloseChatButton = page.getByTestId("moodify-close-chat-button")
  await expect(moodifyCloseChatButton).toBeVisible()

  await moodifyCloseChatButton.click()

  await expect(chatBox).not.toBeVisible()
}
