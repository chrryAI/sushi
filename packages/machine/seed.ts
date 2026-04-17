import crypto from "node:crypto"
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm"
import {
  createAgents,
  createCollaboration,
  createMessage,
  createThread,
  createUser,
  DB_URL,
  db,
  getApp,
  getUser,
  getUsers,
  isCI,
  isProd,
  isSeedSafe,
  isVex,
  isWaffles,
  MODE,
  passwordToSalt,
  redis,
  sonarIssues,
  sonarMetrics,
  TEST_MEMBER_FINGERPRINTS,
  updateApp,
  updateUser,
  type user,
} from "./index"
import { createCities } from "./src/dna/createCities"
import { createEvent } from "./src/dna/createEvent"
import { createStores } from "./src/dna/createStores"
import { seedScheduledTribeJobs } from "./src/dna/seedScheduledTribeJobs"
import { seedTribeEngagement } from "./src/dna/seedTribeEngagement"
import {
  aiAgents,
  apps,
  calendarEvents,
  characterProfiles,
  cities,
  expenses,
  guests,
  instructions,
  memories,
  messages,
  moltQuestions,
  pearFeedback,
  placeHolders,
  realtimeAnalytics,
  scheduledJobs,
  storeInstalls,
  stores,
  subscriptions,
  systemLogs,
  threadSummaries,
  threads,
  timers,
  tribeBlocks,
  tribeComments,
  tribeFollows,
  tribeLikes,
  tribePosts,
  tribes,
  users,
} from "./src/schema"

const now = new Date()
// const _today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

const VEX_TEST_EMAIL = process.env.VEX_TEST_EMAIL!
const VEX_TEST_NAME = process.env.VEX_TEST_NAME!
const VEX_TEST_PASSWORD = process.env.VEX_TEST_PASSWORD!

const VEX_TEST_EMAIL_2 = process.env.VEX_TEST_EMAIL_2!
const VEX_TEST_NAME_2 = process.env.VEX_TEST_NAME_2!
const VEX_TEST_PASSWORD_2 = process.env.VEX_TEST_PASSWORD_2!

const VEX_TEST_EMAIL_3 = process.env.VEX_TEST_EMAIL_3!
const VEX_TEST_NAME_3 = process.env.VEX_TEST_NAME_3!
const VEX_TEST_PASSWORD_3 = process.env.VEX_TEST_PASSWORD_3!

const VEX_TEST_EMAIL_4 = process.env.VEX_TEST_EMAIL_4!
const VEX_TEST_NAME_4 = process.env.VEX_TEST_NAME_4!
const VEX_TEST_PASSWORD_4 = process.env.VEX_TEST_PASSWORD_4!

// Önce dosyanın başına bu yardımcı fonksiyonları ekleyin:

// Dojo Entropy Helpers
export const cryptoInt = (min: number, max: number) =>
  crypto.randomInt(min, max)
export const cryptoFloat = () =>
  crypto.randomBytes(4).readUInt32BE() / 0xffffffff
export const pickCrypto = <T>(arr: T[]): T => arr[cryptoInt(0, arr.length)]!

// Cryptographically Secure Shuffle
export const secureShuffle = <T>(arr: T[]): T[] => {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = cryptoInt(0, i + 1)
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

const create = async () => {
  if (isProd) {
    return
  }

  const admin = await getUser({ email: VEX_TEST_EMAIL })

  if (!admin) {
    return
  }

  let feedback = await getUser({ email: VEX_TEST_EMAIL_2 })

  if (!feedback) {
    console.log("👤 Creating feedback user...")
    feedback = await createUser({
      email: VEX_TEST_EMAIL_2,
      name: VEX_TEST_NAME_2,
      password: passwordToSalt(VEX_TEST_PASSWORD_2),
      role: "user",
      userName: VEX_TEST_NAME_2,
      fingerprint: TEST_MEMBER_FINGERPRINTS[0],
      roles: ["admin"],
    })
    if (!feedback) throw new Error("Failed to add user")
    console.log("✅ Feedback user created")
  } else {
    await updateUser({
      ...feedback,
      email: VEX_TEST_EMAIL_2,
      name: VEX_TEST_NAME_2,
      password: passwordToSalt(VEX_TEST_PASSWORD_2),
      role: "user",
      userName: VEX_TEST_NAME_2,
      fingerprint: TEST_MEMBER_FINGERPRINTS[0],
      roles: ["admin"],
    })

    feedback = await getUser({ email: VEX_TEST_EMAIL_2 })

    console.log("✅ Feedback user already exists, skipping creation")
  }

  // Check if diplomatic user already exists
  let diplomatic = await getUser({ email: VEX_TEST_EMAIL_3 })

  if (!diplomatic) {
    console.log("👤 Creating diplomatic user...")
    diplomatic = await createUser({
      email: VEX_TEST_EMAIL_3,
      name: VEX_TEST_NAME_3,
      password: passwordToSalt(VEX_TEST_PASSWORD_3),
      role: "user",
      userName: VEX_TEST_NAME_3,
      fingerprint: TEST_MEMBER_FINGERPRINTS[1],
      roles: ["admin"],
    })
    console.log("✅ Diplomatic user created")
  } else {
    await updateUser({
      ...diplomatic,
      email: VEX_TEST_EMAIL_3,
      name: VEX_TEST_NAME_3,
      password: passwordToSalt(VEX_TEST_PASSWORD_3),
      role: "user",
      userName: VEX_TEST_NAME_3,
      fingerprint: TEST_MEMBER_FINGERPRINTS[1],
      roles: ["admin"],
    })
    console.log("✅ Diplomatic user already exists, skipping creation")
  }

  if (!diplomatic) throw new Error("Failed to add user")

  // Check if localswaphub user already exists
  let localswaphub = await getUser({ email: VEX_TEST_EMAIL_4 })

  if (!localswaphub) {
    console.log("👤 Creating localswaphub user...")
    localswaphub = await createUser({
      email: VEX_TEST_EMAIL_4,
      name: VEX_TEST_NAME_4,
      password: passwordToSalt(VEX_TEST_PASSWORD_4),
      role: "user",
      userName: VEX_TEST_NAME_4,
      fingerprint: TEST_MEMBER_FINGERPRINTS[2],
      roles: ["admin"],
    })
    console.log("✅ Localswaphub user created")
  } else {
    await updateUser({
      ...localswaphub,
      email: VEX_TEST_EMAIL_4,
      name: VEX_TEST_NAME_4,
      password: passwordToSalt(VEX_TEST_PASSWORD_4),
      role: "user",
      userName: VEX_TEST_NAME_4,
      fingerprint: TEST_MEMBER_FINGERPRINTS[2],
      roles: ["admin"],
    })

    localswaphub = await getUser({ email: VEX_TEST_EMAIL_4 })

    console.log("✅ Localswaphub user already exists, skipping creation")
  }

  if (!localswaphub) throw new Error("Failed to add user")

  const agents = await createAgents()

  return
}

const updateStoreUrls = async ({ user }: { user: user }) => {
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

  await createStores({ user: admin })

  await seedScheduledTribeJobs({ admin })
}

const seedDb = async (): Promise<void> => {
  const allowClearDb = process.env.ALLOW_CLEAR_DB === "true"
  const isNonInteractive = allowClearDb || isCI

  if (isProd) {
    if (!isNonInteractive) {
      // eslint-disable-next-line no-console
      console.warn(
        "\n⚠️  WARNING: You are about to run the seed script on a NON-LOCAL database!\n" +
          `DB_URL: ${DB_URL}\n` +
          "Press Enter to continue, or Ctrl+C to abort.",
      )

      await new Promise<void>((resolve) => {
        process.stdin.resume()
        process.stdin.once("data", () => resolve())
      })

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
    }

    // await prod()
    // process.exit(0)
  } else {
    await create()
    await prod()
    if (isSeedSafe && !isNonInteractive) {
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
        await create()
        await prod()
      } else {
        // Safety gate: only allow clearDb on local databases or with explicit opt-in
        const databaseUrl = process.env.DATABASE_URL || ""
        const isLocalDb =
          databaseUrl.includes("localhost") ||
          databaseUrl.includes("127.0.0.1") ||
          databaseUrl.includes("0.0.0.0")

        if (!isLocalDb && !allowClearDb) {
          throw new Error(
            "❌ SAFETY: Cannot clear non-local database without ALLOW_CLEAR_DB=true",
          )
        }

        if (allowClearDb) {
          // await clearDb()
          // await create()
        }
      }
    }

    process.exit(0)
  }
}

seedDb()
