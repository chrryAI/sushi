// import { expect, type Page } from "@playwright/test"
// import { prepare } from "./clean"
// import { grape } from "./grape"

const watermelon = async ({
  page,
  isLive,
  isMember,
  ...props
}: {
  page: Page
  isLive: boolean
  isMember: boolean
}) => {
  const newChatButton = page.getByTestId("new-chat-button")
  await expect(newChatButton).toBeVisible()
  await newChatButton.click()
}

export { watermelon }
