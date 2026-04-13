import { expect, type Page } from "@playwright/test"

export async function taskOperations({
  page,
  isGuest = true,
}: {
  page: Page
  isGuest?: boolean
}) {
  await page.waitForTimeout(3000)
  const time = page.getByTestId("time")
  await expect(time).toBeVisible()

  const newTaskButton = page.getByTestId("new-task-button")
  await expect(newTaskButton).toBeVisible()

  const tasks = page.getByTestId("tasks")
  await expect(tasks).toBeVisible({
    visible: !isGuest,
  })

  await newTaskButton.scrollIntoViewIfNeeded()
  await newTaskButton.click()

  const addTaskInput = page.getByTestId("add-task-input")

  const greatStart = page.getByTestId("great-start")
  await expect(greatStart).not.toBeVisible()

  await expect(addTaskInput).toBeVisible()

  await addTaskInput.fill("Test task 1")

  const addTaskButton = page.getByTestId("add-task-button")
  await expect(addTaskButton).toBeVisible()

  await addTaskButton.click()

  await page.waitForTimeout(5000)

  await expect(tasks).toBeVisible()

  await expect(greatStart).toBeVisible({
    visible: isGuest,
  })

  const task1 = page.locator(
    '[data-testid="task"][data-task-title="Test task 1"]',
  )

  await expect(task1).toBeVisible()

  const taskTitle = task1.getByTestId("task-title")
  await expect(taskTitle).toBeVisible()

  await expect(taskTitle).toHaveText("Test task 1")

  const taskTime1 = task1.locator("[task-time]")
  await expect(taskTime1).toBeVisible()

  await expect(taskTime1).toHaveAttribute("task-time", "0")

  const taskSelected = task1.getByTestId("task-selected")
  await expect(taskSelected).toBeVisible({
    visible: isGuest,
  })

  if (!isGuest) {
    await task1.click()
  }

  const preset1 = page.getByTestId("preset-1")
  await expect(preset1).toBeVisible()
  const preset1Num = Number(await preset1.getAttribute("data-preset-min-1"))

  const startButton = page.getByTestId("focusbutton-start-button")
  await expect(startButton).toBeVisible()

  await startButton.click()

  await page.waitForTimeout(10000)

  const pauseButton = page.getByTestId("focusbutton-pause-button")
  await expect(pauseButton).toBeVisible()

  await pauseButton.click()
  await page.waitForTimeout(1000)

  const timeAfterPauseNum = Number(await time.getAttribute("data-time"))

  expect(timeAfterPauseNum).toBe(preset1Num * 60 - 10)

  const updateTaskTime = Number(await taskTime1.getAttribute("task-time"))

  expect(updateTaskTime).toBe(10)

  const cancelButton = page.getByTestId("focusbutton-cancel-button")
  await expect(cancelButton).toBeVisible()
  await cancelButton.click()

  const editTaskButton = page.getByTestId("edit-task-button").first()

  await expect(editTaskButton).toBeVisible()

  await newTaskButton.click()

  await expect(addTaskInput).toBeVisible()

  await addTaskInput.fill("")

  await addTaskButton.click()

  const addTaskError = page.getByTestId("add-task-error")

  await expect(addTaskError).toBeVisible()

  await addTaskInput.fill("Test task 2")

  await expect(addTaskError).not.toBeVisible()

  await expect(addTaskInput).toBeVisible()

  await addTaskButton.click()

  const task2 = page
    .locator('[data-testid="task"][data-task-title="Test task 2"]')
    .first()

  await expect(greatStart).toBeVisible({
    visible: isGuest,
  })

  await expect(task2).toBeVisible()

  const task2Title = task2.getByTestId("task-title")
  await expect(task2Title).toBeVisible()

  await expect(task2Title).toHaveText("Test task 2")

  const taskTime2 = task2.locator("[task-time]")
  await expect(taskTime2).toBeVisible()

  await expect(taskTime2).toHaveAttribute("task-time", "0")

  const task2Selected = task2.getByTestId("task-selected")
  await expect(task2Selected).not.toBeVisible()

  await task2.click()

  await expect(task2Selected).toBeVisible()

  const task2TimeAfterSelect = task2.locator("[task-time]")
  await expect(task2TimeAfterSelect).toBeVisible()

  await expect(task2TimeAfterSelect).toHaveAttribute("task-time", "0")

  await startButton.click()

  await page.waitForTimeout(10000)

  await expect(pauseButton).toBeVisible()

  await pauseButton.click()

  const newTimeAfterPauseNum = Number(await time.getAttribute("data-time"))

  expect(newTimeAfterPauseNum).toBe(preset1Num * 60 - 10)

  expect(Number(await taskTime2.getAttribute("task-time"))).toBe(10)
  expect(Number(await taskTime1.getAttribute("task-time"))).toBe(20)

  await expect(cancelButton).toBeVisible()
  await cancelButton.click()

  await expect(editTaskButton).toBeVisible()

  await editTaskButton.click()

  if (isGuest) {
    const message = page.getByTestId("task-log-form-guest-message")
    await expect(message).toBeVisible()
    await message.click()

    const signInButton = page.getByTestId("sign-in-button")
    await expect(signInButton).toBeVisible()
  } else {
    const message = page.getByTestId("task-log-form-empty-message")
    await expect(message).toBeVisible()
  }

  const editTaskInput = page.getByTestId("edit-task-input")
  await expect(editTaskInput).toBeVisible()

  const editTaskSaveButton = page.getByTestId("edit-task-save-button")
  await expect(editTaskSaveButton).toBeVisible()

  await editTaskInput.fill("")

  await editTaskSaveButton.click()

  const editTaskError = page.getByTestId("edit-task-error")

  await expect(editTaskError).toBeVisible()

  await editTaskInput.fill("Test task 2 edited")

  await expect(editTaskError).not.toBeVisible()

  await editTaskSaveButton.click()

  await expect(editTaskInput).toHaveValue("Test task 2 edited")

  const addTaskLogTextarea = page.getByTestId("add-task-log-textarea")

  await expect(addTaskLogTextarea).toBeVisible()

  const addTaskLogSubmitButton = page.getByTestId("add-task-log-submit-button")
  await expect(addTaskLogSubmitButton).toBeVisible()

  await addTaskLogSubmitButton.click()

  const addTaskLogError = page.getByTestId("add-task-log-error")

  await expect(addTaskLogError).toBeVisible()

  await addTaskLogTextarea.fill("Test task log 1")
  await expect(addTaskLogError).not.toBeVisible()

  const addTaskLogEditEmojiButton = page.getByTestId(
    "add-task-log-edit-emoji-button",
  )
  await expect(addTaskLogEditEmojiButton).not.toBeVisible()

  const addTaskLogAstonishedButton = page.getByTestId(
    "add-task-log-astonished-button",
  )

  await expect(addTaskLogAstonishedButton).toBeVisible()
  await page.waitForTimeout(1000)
  await addTaskLogAstonishedButton.click()
  await page.waitForTimeout(1000)

  await expect(addTaskLogEditEmojiButton).toBeVisible({
    timeout: 5000,
  })

  await addTaskLogEditEmojiButton.click()

  await expect(addTaskLogEditEmojiButton).not.toBeVisible()

  const addTaskLogInloveButton = page.getByTestId("add-task-log-inlove-button")
  await expect(addTaskLogInloveButton).toBeVisible()

  await page.waitForTimeout(1000)
  await addTaskLogInloveButton.click()
  await page.waitForTimeout(1000)

  await expect(addTaskLogEditEmojiButton).toBeVisible({
    timeout: 5000,
  })

  await addTaskLogTextarea.fill("Test task log 1")

  await page.waitForTimeout(1000)
  await addTaskLogSubmitButton.click()

  const taskLog1 = page.locator(
    '[data-testid="task-log"][data-content="Test task log 1"][data-mood="inlove"]',
  )

  await expect(taskLog1).toBeVisible()

  const editTaskLogEditButton = taskLog1.getByTestId(
    "edit-task-log-edit-button",
  )
  await expect(editTaskLogEditButton).toBeVisible()

  await editTaskLogEditButton.click()

  const editTaskLogTextarea = page.getByTestId("edit-task-log-textarea")
  await expect(editTaskLogTextarea).toBeVisible()

  const editTaskLogSubmitButton = page.getByTestId(
    "edit-task-log-submit-button",
  )
  await expect(editTaskLogSubmitButton).toBeVisible()

  await editTaskLogTextarea.fill("")

  await editTaskLogSubmitButton.click()

  const editTaskLogError = page.getByTestId("edit-task-log-error")

  await expect(editTaskLogError).toBeVisible()

  await editTaskLogTextarea.fill("Test task log 1 edited")

  await expect(editTaskLogError).not.toBeVisible()

  const editTaskLogEditEmojiButton = page.getByTestId(
    "edit-task-log-edit-emoji-button",
  )

  await expect(editTaskLogEditEmojiButton).toBeVisible({
    timeout: 5000,
  })

  await editTaskLogEditEmojiButton.click()

  await expect(editTaskLogEditEmojiButton).not.toBeVisible()

  const editTaskLogHappyButton = page.getByTestId("edit-task-log-happy-button")
  await expect(editTaskLogHappyButton).toBeVisible()

  await editTaskLogHappyButton.click()

  await expect(editTaskLogEditEmojiButton).toBeVisible({
    timeout: 5000,
  })

  await editTaskLogSubmitButton.click()

  const taskLog1Updated = page.locator(
    '[data-testid="task-log"][data-content="Test task log 1 edited"][data-mood="happy"]',
  )

  await expect(taskLog1Updated).toBeVisible()

  await addTaskLogTextarea.fill("Test task log 2")

  await expect(addTaskLogError).not.toBeVisible()

  await addTaskLogSubmitButton.click()

  const taskLog2 = page.locator(
    '[data-testid="task-log"][data-content="Test task log 2"]',
  )

  await expect(taskLog2).toBeVisible()

  const taskLog2EditButton = taskLog2.getByTestId("edit-task-log-edit-button")

  await expect(taskLog2EditButton).toBeVisible()

  await taskLog2EditButton.click()

  const editTaskLogDeleteButton = page.getByTestId(
    "edit-task-log-delete-button",
  )

  await expect(editTaskLogDeleteButton).toBeVisible()

  await editTaskLogDeleteButton.click()
  await editTaskLogDeleteButton.click()

  const deletedTaskLog2 = page.locator(
    '[data-testid="task-log"][data-content="Test task log 2"]',
  )

  await expect(deletedTaskLog2).not.toBeVisible()

  const editTaskDeleteButton = page.getByTestId("edit-task-delete-button")

  await expect(editTaskDeleteButton).toBeVisible()
  await editTaskDeleteButton.click()
  await editTaskDeleteButton.click()

  await page.waitForTimeout(5000)

  const deletedTask2 = page.locator(
    '[data-testid="task"][data-task-title="Test task 2"]',
  )

  await expect(deletedTask2).not.toBeVisible()

  await expect(editTaskButton).toBeVisible()

  await editTaskButton.click()

  await expect(editTaskDeleteButton).toBeVisible()
  await editTaskDeleteButton.click()
  await editTaskDeleteButton.click()

  await page.waitForTimeout(5000)

  const deletedTask1 = page.locator(
    '[data-testid="task"][data-task-title="Test task 1"]',
  )

  await expect(deletedTask1).not.toBeVisible()

  const timer = page.getByTestId("focusbutton")
  await expect(timer).toBeVisible()

  await page.waitForTimeout(5000)
}
