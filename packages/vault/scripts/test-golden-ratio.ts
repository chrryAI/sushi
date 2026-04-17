import assert from "node:assert"
import { after, before, describe, it } from "node:test"
import {
  createMessage,
  createThread,
  db,
  deleteThread,
  deleteUser,
  getThread,
  getUser,
  updateThread,
  updateUser,
} from "@chrryai/machine"
import { users } from "@chrryai/machine/src/schema"
import { getNewlyTriggeredFeatures } from "../../waffles/src/index.ts"

const TEST_EMAIL = `phi-test-${Date.now()}@chrry.ai`

describe("Golden Ratio φ-Engine (DB Integration)", () => {
  let userId: string
  let threadId: string

  before(async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: TEST_EMAIL,
        userName: `phi-test-${Date.now()}`,
        name: "Phi Test User",
        role: "user",
        totalThreadCount: 0,
        goldenRatioConfig: {},
      })
      .returning()
    assert.ok(user)
    userId = user!.id
    console.log("🧪 Created test user:", userId)
  })

  after(async () => {
    if (threadId) await deleteThread({ id: threadId }).catch(() => {})
    if (userId) await deleteUser(userId).catch(() => {})
  })

  it("starts with zero counters", async () => {
    const user = await getUser({ id: userId })
    assert.ok(user)
    assert.strictEqual(user.totalThreadCount, 0)
    const triggered = getNewlyTriggeredFeatures(
      0,
      0,
      [],
      user.goldenRatioConfig,
    )
    assert.strictEqual(triggered.length, 0)
  })

  it("increments counters and triggers features", async () => {
    const thread = await createThread({
      title: "Phi Thread",
      aiResponse: "",
      userId,
    })
    assert.ok(thread)
    threadId = thread.id

    await updateUser({ id: userId, totalThreadCount: 1 })

    const user = await getUser({ id: userId })
    assert.strictEqual(user?.totalThreadCount, 1)

    await createMessage({ content: "msg1", threadId, userId })
    await createMessage({ content: "msg2", threadId, userId })

    const threadAfter = await getThread({ id: threadId })
    assert.strictEqual(threadAfter?.messageCount, 2)

    const triggered = getNewlyTriggeredFeatures(
      3,
      2,
      [],
      user?.goldenRatioConfig,
    )
    assert.ok(triggered.some((t) => t.feature === "memory"))

    await updateThread({
      id: threadId,
      lastTriggeredFeatures: triggered.map((t) => t.feature),
    })

    const threadWithTriggers = await getThread({ id: threadId })
    assert.ok(
      (threadWithTriggers?.lastTriggeredFeatures ?? []).includes("memory"),
    )
  })

  it("respects custom config overrides", async () => {
    await updateUser({
      id: userId,
      goldenRatioConfig: {
        memory: { threadThreshold: 1, messageThreshold: 1, enabled: false },
      },
    })

    const user = await getUser({ id: userId })
    const triggered = getNewlyTriggeredFeatures(
      100,
      100,
      [],
      user?.goldenRatioConfig,
    )
    assert.ok(!triggered.some((t) => t.feature === "memory"))
  })
})
