import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm"
import {
  createUser,
  DB_URL,
  db,
  getApp,
  getUser,
  isProd,
  isSeedSafe,
  isVex,
  MODE,
  passwordToSalt,
  updateApp,
  type user,
} from "./index"
import { apps, guests, memories, messages, subscriptions } from "./src/schema"
import { seedScheduledTribeJobs } from "./src/seed/seedScheduledTribeJobs"

const VEX_TEST_NAME = process.env.VEX_TEST_NAME!
const VEX_TEST_PASSWORD = process.env.VEX_TEST_PASSWORD!

async function clearGuests(ago = 5) {
  const batchSize = 500
  let totalDeleted = 0
  let hasMore = true

  // 5 gün önceki tarih
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - ago)

  while (hasMore) {
    // Find inactive guests (no subscription, no messages, no tasks)
    const inactiveGuests = await db
      .select({ id: guests.id, ip: guests.ip })
      .from(guests)
      .leftJoin(subscriptions, eq(subscriptions.guestId, guests.id))
      .leftJoin(messages, eq(messages.guestId, guests.id))
      .leftJoin(apps, eq(apps.guestId, guests.id))
      .leftJoin(sql`task`, sql`task."guestId" = ${guests.id}`)
      .where(
        and(
          isNull(subscriptions.id),
          isNull(apps.id),
          isNull(messages.id),
          sql`task.id IS NULL`,
          lt(guests.activeOn, fiveDaysAgo),
          // sql<boolean>`${guests.createdOn} < NOW() - INTERVAL '5 days'`,
        ),
      )
      .groupBy(guests.id, guests.ip)
      .limit(batchSize)

    if (inactiveGuests.length === 0) {
      hasMore = false
      break
    }

    // Delete batch
    const idsToDelete = inactiveGuests.map((g) => g.id)
    await db.delete(guests).where(inArray(guests.id, idsToDelete))

    totalDeleted += inactiveGuests.length
    console.log(
      `🧹 Deleted batch of ${inactiveGuests.length} guests (total: ${totalDeleted})`,
    )

    // Show some IPs from this batch
    inactiveGuests.slice(0, 5).forEach((guest) => {
      console.log(`  - ${guest.ip}`)
    })

    if (inactiveGuests.length < batchSize) {
      hasMore = false
    }
  }

  console.log(
    `✅ Cleanup complete! Deleted ${totalDeleted} inactive bot guests`,
  )
}

export async function clearMemories() {
  // Find app memories with user-specific language
  const inconsistentMemories = await db
    .select({
      id: memories.id,
      content: memories.content,
      title: memories.title,
    })
    .from(memories)
    .where(
      and(
        // Must be an app memory (has appId, no userId/guestId)
        sql`${memories.appId} IS NOT NULL`,
        sql`${memories.userId} IS NULL`,
        sql`${memories.guestId} IS NULL`,
        // Contains user-specific language
        sql`(
          LOWER(${memories.content}) LIKE '%this user%' OR
          LOWER(${memories.content}) LIKE '%the user%' OR
          LOWER(${memories.content}) LIKE '% user is %' OR
          LOWER(${memories.content}) LIKE '% user has %' OR
          LOWER(${memories.content}) LIKE '% their %' OR
          LOWER(${memories.content}) LIKE '% they %' OR
          LOWER(${memories.content}) LIKE '%enabled for%user%' OR
          LOWER(${memories.content}) LIKE '%disabled for%user%'
        )`,
      ),
    )

  if (inconsistentMemories.length === 0) {
    console.log("✅ No inconsistent app memories found")
    return
  }

  console.log(`Found ${inconsistentMemories.length} inconsistent app memories:`)
  inconsistentMemories.forEach((memory) => {
    console.log(
      `  ❌ "${memory.title}" - ${memory.content.substring(0, 80)}...`,
    )
  })

  // Delete them
  const idsToDelete = inconsistentMemories.map((m) => m.id)
  await db.delete(memories).where(inArray(memories.id, idsToDelete))

  console.log(
    `✅ Deleted ${inconsistentMemories.length} inconsistent app memories`,
  )
}

export const updateStoreUrls = async ({ user }: { user: user }) => {
  const vex = await getApp({ slug: "vex", userId: user.id })
  if (!vex) throw new Error("Vex app not found")
  await updateApp({
    ...vex,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/vex-🍒/enpllenkofnbmnflnlkbomkcilamjgac",
  })

  console.log(
    "Vex app updated",
    await getApp({ slug: "vex", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )

  const chrry = await getApp({ slug: "chrry", userId: user.id })
  if (!chrry) throw new Error("Chrry app not found")
  await updateApp({
    ...chrry,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/chrry-🍒/odgdgbbddopmblglebfngmaebmnhegfc",
  })

  console.log(
    "Chrry app updated",
    await getApp({ slug: "chrry", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )

  const popcorn = await getApp({ slug: "popcorn", userId: user.id })
  if (!popcorn) throw new Error("Popcorn app not found")
  await updateApp({
    ...popcorn,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/popcorn-🍒/lfokfhplbjckmfmbakfgpkhaanfencah",
  })

  console.log(
    "Popcorn app updated",
    await getApp({ slug: "popcorn", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )

  const zarathustra = await getApp({ slug: "zarathustra", userId: user.id })
  if (!zarathustra) throw new Error("Zarathustra app not found")
  await updateApp({
    ...zarathustra,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/zarathustra-🍒/jijgmcofljfalongocihccblcboppnad",
  })

  console.log(
    "Zarathustra app updated",
    await getApp({ slug: "zarathustra", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )

  const atlas = await getApp({ slug: "atlas", userId: user.id })
  if (!atlas) throw new Error("Atlas app not found")
  await updateApp({
    ...atlas,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/atlas-🍒/adopnldifkjlgholfcijjgocgnolknpb",
  })

  console.log(
    "Atlas app updated",
    await getApp({ slug: "atlas", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )

  const focus = await getApp({ slug: "focus", userId: user.id })
  if (!focus) throw new Error("Focus app not found")
  await updateApp({
    ...focus,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/focus-🍒/nkomoiomfaeodakglkihapminhpgnibl",
  })

  const search = await getApp({ slug: "search", userId: user.id })
  if (!search) throw new Error("Search app not found")
  await updateApp({
    ...search,
    chromeWebStoreUrl:
      "https://chromewebstore.google.com/detail/search-🍒/cloblmampohoemdaojenlkjbnkpmkiop?authuser=0&hl=en",
  })

  console.log(
    "Focus app updated",
    await getApp({ slug: "focus", userId: user.id }).then(
      (app) => app?.chromeWebStoreUrl,
    ),
  )
}

const prod = async () => {
  // Check if admin user already exists
  // await createAgents()
  // return
  await clearMemories()
  await clearGuests()
  const admin = await getUser({
    email: isProd || isVex ? "ibsukru@gmail.com" : "ibsukru@gmail.com",
  })
  if (!admin) throw new Error("Admin user not found")

  if (!isProd) {
    const admin = await getUser({
      email: "ibsukru@gmail.com",
    })
    if (!admin) {
      await createUser({
        email: "ibsukru@gmail.com",
        name: VEX_TEST_NAME,
        password: passwordToSalt(VEX_TEST_PASSWORD),
        role: "admin",
        userName: "ibsukru",
        // credits: !isSeedSafe ? 99999999 : undefined,
        city: "Amsterdam",
        country: "Netherlands",
      })
    }
  }

  await seedScheduledTribeJobs({ admin })
}

const seed = async (): Promise<void> => {
  // await syncAllGoals()
  // process.exit(0)
  if (isProd) {
    // eslint-disable-next-line no-console
    console.warn(
      "\n🧐  WARNING: You are about to run the seed script on a NON-LOCAL database!\n" +
        `DB_URL: ${DB_URL}\n` +
        "Press Enter to continue, or Ctrl+C to abort.",
    )

    await new Promise<void>((resolve) => {
      process.stdin.resume()
      process.stdin.once("data", () => resolve())
    })
  }

  if (isProd) {
    // eslint-disable-next-line no-console
    console.warn(
      "\n🚀  REALLY SURE WARNING: You are about to run the seed script on a NON-LOCAL database!\n" +
        `DB_URL: ${DB_URL}\n` +
        "Press Enter to continue, or Ctrl+C to abort.",
    )

    await new Promise<void>((resolve) => {
      process.stdin.resume()
      process.stdin.once("data", () => resolve())
    })

    await prod()
    process.exit(0)
  } else {
    if (isSeedSafe) {
      // eslint-disable-next-line no-console
      console.warn(
        "\n🏹  WARNING: You are about to run the seed script on a e2e database!\n" +
          `DB_URL: ${process.env.DB_URL}\n` +
          "Press Enter to continue, or Ctrl+C to abort.",
      )

      await new Promise<void>((resolve) => {
        process.stdin.resume()
        process.stdin.once("data", () => resolve())
      })
    }

    if (MODE === "dev") {
      if (isVex) {
        await prod()
      } else {
        // Safety gate: only allow clearDb on local databases or with explicit opt-in
        const databaseUrl = process.env.DATABASE_URL || ""
        const isLocalDb =
          databaseUrl.includes("localhost") ||
          databaseUrl.includes("127.0.0.1") ||
          databaseUrl.includes("0.0.0.0")
        const allowClearDb = process.env.ALLOW_CLEAR_DB === "true"

        if (!isLocalDb && !allowClearDb) {
          throw new Error(
            "❌ SAFETY: Cannot clear non-local database without ALLOW_CLEAR_DB=true",
          )
        }
      }
    }

    process.exit(0)
  }
}

seed()
