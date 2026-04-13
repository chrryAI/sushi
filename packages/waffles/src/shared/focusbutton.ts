import { expect, type Page } from "@playwright/test"

export const focusbutton = async ({
  page,
  isGuest = true,
}: {
  page: Page
  isGuest?: boolean
}) => {
  const testimonials = page.getByTestId("testimonials")
  await expect(testimonials).toBeVisible({
    visible: isGuest,
  })

  const preset1 = page.getByTestId("preset-1")

  await expect(preset1).toBeVisible()

  const preset2 = page.getByTestId("preset-2")
  await expect(preset2).toBeVisible()

  const preset3 = page.getByTestId("preset-3")
  await expect(preset3).toBeVisible()

  const timer = page.getByTestId("focusbutton")
  await expect(timer).toBeVisible()

  const time = page.getByTestId("time")
  await expect(time).toBeVisible()

  const settingsButton = page.getByTestId("settings-button")
  await expect(settingsButton).toBeVisible()

  await settingsButton.click()

  const presetMin1Input = page.getByTestId("preset-min-1-input")
  await presetMin1Input.fill("60")
  await expect(presetMin1Input).toBeVisible()

  const presetMin2Input = page.getByTestId("preset-min-2-input")
  await presetMin2Input.fill("30")
  await expect(presetMin2Input).toBeVisible()

  const presetMin3Input = page.getByTestId("preset-min-3-input")
  await presetMin3Input.fill("15")
  await expect(presetMin3Input).toBeVisible()

  await page.waitForTimeout(1000)

  const closeSettingsButton = page.getByTestId("close-settings-button")
  await expect(closeSettingsButton).toBeVisible()

  await closeSettingsButton.click()

  await page.waitForTimeout(1000)

  await preset1.click()

  await expect(time).toHaveAttribute("data-time", (60 * 60).toString())

  const startButton = page.getByTestId("focusbutton-start-button")
  await expect(startButton).toBeVisible()

  await page.waitForTimeout(2000)

  await startButton.click()

  await page.waitForTimeout(10000)

  const pauseButton = page.getByTestId("focusbutton-pause-button")
  await expect(pauseButton).toBeVisible()

  await pauseButton.click()

  const timeAfterPauseNum = Number(await time.getAttribute("data-time"))
  expect(timeAfterPauseNum).toBe(
    Number(await preset1.getAttribute("data-preset-min-1")) * 60 - 10,
  )

  await page.waitForTimeout(3000)

  const cancelButton = page.getByTestId("focusbutton-cancel-button")
  await expect(cancelButton).toBeVisible()

  await cancelButton.click()
}
