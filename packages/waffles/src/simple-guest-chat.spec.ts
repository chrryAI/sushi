import { expect, test } from "@playwright/test"

test.skip("guest chat flow: send message, bookmark, edit, delete", async ({
  page,
}) => {
  await page.goto("https://atlas.chrry.ai/")
  await page.getByTestId("chat-textarea").click()
  await page
    .getByTestId("chat-textarea")
    .fill("Hey how is app performing today chrry")
  await page.getByTestId("moodify-reset-button").click()
  await page.getByTestId("moodify-astonished-button").click()
  await page.getByRole("button", { name: "Character Profile" }).click()
  await page.getByTestId("enable-character-profiles").click()
  await page.getByTestId("chat-send-button").click()
  await page.getByTestId("chat-send-button").click()
  await expect(page.getByTestId("agent-message")).toBeVisible({
    timeout: 100000,
  })

  await expect(page.getByTestId("agent-message")).toBeVisible({
    timeout: 100000,
  })
  await expect(page.getByTestId("thread-not-bookmarked")).toBeVisible({
    timeout: 100000,
  })
  await page.getByTestId("thread-not-bookmarked").click()
  await page.getByTestId("menu-bookmarked").click()
  await page.getByTestId("menu-not-bookmarked").click()
  await expect(page.getByTestId("character-profile")).toBeVisible({
    timeout: 100000,
  })
  await page.getByTestId("character-profile").click()
  await page.getByTestId("modal-close-button").click()
  await page.getByRole("button", { name: "Pin" }).click()
  await page.getByTestId("modal-close-button").click()
  await page.getByTestId("load-more-threads-menu").click()
  await expect(page.getByTestId("threads-bookmarked")).toBeVisible({
    timeout: 5000,
  })
  await page.getByTestId("threads-bookmarked").click()
  await page.getByTestId("menu-not-bookmarked").click()
  await page.getByTestId("threads-bookmarked").click()
  await page.getByTestId("edit-thread-button").click()
  await page.getByTestId("edit-thread-generate-title-button").click()
  await page.getByTestId("edit-thread-save-button").click()
  await page.getByTestId("threads-item-title").click()
  await page.getByTestId("delete-thread-button").click()
  await page.getByTestId("delete-thread-button").click()
  await page.getByTestId("maximize").click()
  await page.getByTestId("grapes-button").click()
  await page.getByRole("button", { name: "Vex Popcorn" }).nth(1).click()
  await page
    .getByRole("dialog")
    .filter({
      hasText:
        "🍇Discover apps, earn creditsChrryVexPopcornAtlasSushi🍿 PopcornPopcorn —",
    })
    .getByTestId("grapes-feedback-button")
    .click()
})
