// import crypto from "node:crypto"
// import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm"
// import {
//   createAgents,
//   createCollaboration,
//   createMessage,
//   createThread,
//   createUser,
//   DB_URL,
//   db,
//   getApp,
//   getUser,
//   getUsers,
//   isCI,
//   isProd,
//   isSeedSafe,
//   isVex,
//   isWaffles,
//   MODE,
//   passwordToSalt,
//   redis,
//   sonarIssues,
//   sonarMetrics,
//   TEST_MEMBER_FINGERPRINTS,
//   updateApp,
//   updateUser,
//   type user,
// } from "./index"
// import {
//   aiAgents,
//   apps,
//   calendarEvents,
//   characterProfiles,
//   cities,
//   expenses,
//   guests,
//   instructions,
//   memories,
//   messages,
//   moltQuestions,
//   pearFeedback,
//   placeHolders,
//   realtimeAnalytics,
//   scheduledJobs,
//   storeInstalls,
//   stores,
//   subscriptions,
//   systemLogs,
//   threadSummaries,
//   threads,
//   timers,
//   tribeBlocks,
//   tribeComments,
//   tribeFollows,
//   tribeLikes,
//   tribePosts,
//   tribes,
//   users,
// } from "@chrryai/machine/src/schema"
// import { createCities } from "@chrryai/machine/src/dna/createCities"
// import { createEvent } from "@chrryai/machine/src/dna/createEvent"
// import { createStores } from "@chrryai/machine/src/dna/createStores"
// import { seedScheduledTribeJobs } from "@chrryai/machine/src/dna/seedScheduledTribeJobs"
// import { seedTribeEngagement } from "@chrryai/machine/src/dna/seedTribeEngagement"

// const now = new Date()
// // const _today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

// const clearDb = async (): Promise<void> => {
//   const allowClear = process.env.ALLOW_CLEAR_DB === "true"
//   if (isProd && !allowClear) {
//     return
//   }
//   console.log("Clearing database")

//   await db.update(moltQuestions).set({
//     asked: false,
//   })

//   await db.delete(tribeBlocks)
//   await db.delete(tribeComments)
//   await db.delete(tribeFollows)
//   await db.delete(tribePosts)
//   await db.delete(tribeLikes)
//   await db.delete(tribes)
//   await db.delete(pearFeedback)

//   if (isWaffles) {
//     return
//   }

//   await db.delete(calendarEvents)
//   // await db.delete(aiAgents)
//   await db.delete(messages)
//   await db.delete(guests)
//   await db.delete(users)
//   await db.delete(systemLogs)
//   await db.delete(subscriptions)
//   await db.delete(threads)
//   await db.delete(storeInstalls)
//   await db.delete(scheduledJobs)
//   await db.delete(placeHolders)
//   await db.delete(instructions)
//   await db.delete(calendarEvents)
//   await db.delete(stores)
//   await db.delete(apps)
//   await db.delete(timers)
//   await db.delete(cities)
//   await db.delete(characterProfiles)
//   await db.delete(threadSummaries)
//   await db.delete(sonarIssues)
//   await db.delete(sonarMetrics)

//   // Clear SonarCloud data from graph database
//   // await clearSonarCloudGraph()

//   // Clear Redis cache (telemetry + tribe)
//   // try {
//   //   const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6381")

//   //   // Clear telemetry streams
//   //   const streams = await redis.keys("telemetry{*}")
//   //   if (streams.length > 0) {
//   //     await redis.del(...streams)
//   //     console.log(`🧹 Cleared ${streams.length} telemetry streams from Redis`)
//   //   }

//   //   // Clear tribe cache
//   //   const tribePosts = await redis.keys("tribe:posts:*")
//   //   const tribeSinglePosts = await redis.keys("tribe:post:*")
//   //   const allTribeKeys = [...tribePosts, ...tribeSinglePosts]

//   //   if (allTribeKeys.length > 0) {
//   //     await redis.del(...allTribeKeys)
//   //     console.log(
//   //       `🦋 Cleared ${allTribeKeys.length} tribe cache keys from Redis`,
//   //     )
//   //   }

//   //   await redis.quit()
//   // } catch (error) {
//   //   console.warn("⚠️ Failed to clear Redis cache:", error)
//   // }
// }

// const VEX_TEST_EMAIL = process.env.VEX_TEST_EMAIL!
// const VEX_TEST_NAME = process.env.VEX_TEST_NAME!
// const VEX_TEST_PASSWORD = process.env.VEX_TEST_PASSWORD!

// const VEX_TEST_EMAIL_2 = process.env.VEX_TEST_EMAIL_2!
// const VEX_TEST_NAME_2 = process.env.VEX_TEST_NAME_2!
// const VEX_TEST_PASSWORD_2 = process.env.VEX_TEST_PASSWORD_2!

// const VEX_TEST_EMAIL_3 = process.env.VEX_TEST_EMAIL_3!
// const VEX_TEST_NAME_3 = process.env.VEX_TEST_NAME_3!
// const VEX_TEST_PASSWORD_3 = process.env.VEX_TEST_PASSWORD_3!

// const VEX_TEST_EMAIL_4 = process.env.VEX_TEST_EMAIL_4!
// const VEX_TEST_NAME_4 = process.env.VEX_TEST_NAME_4!
// const VEX_TEST_PASSWORD_4 = process.env.VEX_TEST_PASSWORD_4!

// // Önce dosyanın başına bu yardımcı fonksiyonları ekleyin:

// const REALISTIC_NAMES = [
//   "Emma Johnson",
//   "Liam Smith",
//   "Olivia Brown",
//   "Noah Davis",
//   "Ava Wilson",
//   "Ethan Martinez",
//   "Sophia Anderson",
//   "Mason Taylor",
//   "Isabella Thomas",
//   "William Jackson",
//   "Mia White",
//   "James Harris",
//   "Charlotte Martin",
//   "Benjamin Thompson",
//   "Amelia Garcia",
//   "Lucas Rodriguez",
//   "Harper Lee",
//   "Henry Walker",
//   "Evelyn Hall",
//   "Alexander Allen",
//   "Abigail Young",
//   "Michael King",
//   "Emily Wright",
//   "Daniel Lopez",
//   "Elizabeth Hill",
//   "Matthew Scott",
//   "Sofia Green",
//   "Joseph Adams",
//   "Avery Baker",
//   "David Nelson",
//   "Ella Carter",
//   "Jackson Mitchell",
//   "Scarlett Perez",
//   "Sebastian Roberts",
//   "Victoria Turner",
//   "Jack Phillips",
//   "Grace Campbell",
//   "Owen Parker",
//   "Chloe Evans",
//   "Samuel Edwards",
//   "Zoey Collins",
//   "Luke Stewart",
//   "Lily Morris",
//   "Ryan Nguyen",
//   "Hannah Rogers",
//   "Nathan Reed",
//   "Lillian Cook",
//   "Isaac Morgan",
//   "Addison Bell",
//   "Gabriel Murphy",
//   "Ellie Bailey",
//   "Carter Rivera",
//   "Natalie Cooper",
//   "Wyatt Richardson",
//   "Leah Cox",
//   "John Howard",
//   "Aria Ward",
//   "Jayden Torres",
//   "Audrey Peterson",
//   "Dylan Gray",
//   "Hazel Ramirez",
//   "Jimmy Isaac",
//   "Brooklyn Watson",
//   "Levi Brooks",
//   "Zoe Kelly",
//   "Christian Sanders",
//   "Penelope Price",
//   "Andrew Bennett",
//   "Layla Wood",
//   "Joshua Barnes",
//   "Nora Ross",
//   "Christopher Henderson",
//   "Riley Coleman",
//   "Theodore Jenkins",
//   "Paisley Perry",
//   "Caleb Powell",
//   "Aurora Long",
//   "Aaron Patterson",
//   "Savannah Hughes",
//   "Thomas Flores",
//   "Claire Washington",
//   "Charles Butler",
//   "Lucy Simmons",
//   "Jeremiah Foster",
//   "Anna Gonzales",
//   "Connor Bryant",
//   "Caroline Alexander",
//   "Cameron Russell",
//   "Genesis Griffin",
//   "Adrian Diaz",
//   "Violet Hayes",
//   "Robert Myers",
//   "Samantha Ford",
//   "Eli Hamilton",
//   "Stella Graham",
//   "Jonathan Sullivan",
//   "Maya Wallace",
//   "Nolan Woods",
//   "Madelyn Cole",
//   "Hunter West",
//   "Piper Jordan",
//   "Josiah Owens",
//   "Ruby Reynolds",
//   "Colton Fisher",
//   "Kennedy Ellis",
//   "Landon Gibson",
//   "Ivy McDonald",
//   "Asher Cruz",
//   "Gianna Marshall",
//   "Jaxon Ortiz",
//   "Quinn Gomez",
//   "Cooper Murray",
//   "Sadie Freeman",
//   "Lincoln Wells",
//   "Sophie Webb",
//   "Carson Simpson",
//   "Kinsley Stevens",
//   "Dominic Tucker",
//   "Alice Porter",
//   "Easton Hicks",
//   "Maria Crawford",
//   "Micah Henry",
//   "Bella Boyd",
//   "Jace Mason",
//   "Ariana Morales",
//   "Greyson Kennedy",
//   "Gabriella Warren",
//   "Grayson Dixon",
//   "Autumn Ramos",
//   "Ian Reyes",
//   "Aaliyah Burns",
//   "Ezra Gordon",
//   "Eva Shaw",
//   "Collin Holmes",
//   "Willow Rice",
//   "Axel Robertson",
//   "Athena Hunt",
//   "Maverick Black",
//   "Nevaeh Daniels",
//   "Leonardo Palmer",
//   "Skylar Mills",
//   "Silas Nichols",
//   "Emilia Grant",
//   "Ezekiel Knight",
//   "Cora Nuñez",
//   "Jameson Medina",
//   "Reagan Blair",
//   "Brody Wagner",
//   "Everleigh Pearson",
//   "Kai Carpenter",
//   "Melody Hansen",
//   "Maxwell Castillo",
//   "Jade Bowman",
//   "Miles Hanson",
//   "Faith Sims",
//   "Sawyer Dunn",
//   "Trinity George",
//   "Declan Lynch",
//   "Hope Johnston",
//   "Weston Tran",
//   "Rose Malone",
//   "Kaiden Payne",
//   "Isabelle Holland",
//   "Ryder Sherman",
//   "Jasmine Goodwin",
//   "Louis Moss",
//   "Molly Maldonado",
//   "Preston Garrett",
//   "Juniper Love",
// ]

// const CITIES = [
//   "Amsterdam",
//   "Rotterdam",
//   "Utrecht",
//   "The Hague",
//   "Eindhoven",
//   "London",
//   "Paris",
//   "Berlin",
//   "Barcelona",
//   "Madrid",
//   "Rome",
//   "Milan",
//   "Vienna",
//   "Prague",
//   "Budapest",
//   "Copenhagen",
//   "Stockholm",
//   "Oslo",
//   "Helsinki",
//   "Dublin",
//   "Brussels",
//   "Zurich",
//   "Geneva",
//   "Lisbon",
//   "Porto",
//   "Athens",
//   "Istanbul",
//   "Warsaw",
//   "Krakow",
//   "Bucharest",
//   "New York",
//   "Los Angeles",
//   "Chicago",
//   "San Francisco",
//   "Seattle",
//   "Toronto",
//   "Vancouver",
//   "Montreal",
//   "Sydney",
//   "Melbourne",
//   "Tokyo",
//   "Singapore",
//   "Hong Kong",
//   "Dubai",
//   "Mumbai",
// ]

// const COUNTRIES = [
//   "Netherlands",
//   "United Kingdom",
//   "France",
//   "Germany",
//   "Spain",
//   "Italy",
//   "Austria",
//   "Czech Republic",
//   "Hungary",
//   "Denmark",
//   "Sweden",
//   "Norway",
//   "Finland",
//   "Ireland",
//   "Belgium",
//   "Switzerland",
//   "Portugal",
//   "Greece",
//   "Turkey",
//   "Poland",
//   "Romania",
//   "United States",
//   "Canada",
//   "Australia",
//   "Japan",
//   "Singapore",
//   "UAE",
//   "India",
// ]

// // Dojo Entropy Helpers
// const cryptoInt = (min: number, max: number) => crypto.randomInt(min, max)
// const cryptoFloat = () => crypto.randomBytes(4).readUInt32BE() / 0xffffffff
// const pickCrypto = <T>(arr: T[]): T => arr[cryptoInt(0, arr.length)]!

// // Cryptographically Secure Shuffle
// const secureShuffle = <T>(arr: T[]): T[] => {
//   const result = [...arr]
//   for (let i = result.length - 1; i > 0; i--) {
//     const j = cryptoInt(0, i + 1)
//     ;[result[i], result[j]] = [result[j]!, result[i]!]
//   }
//   return result
// }

// function generateUsername(name: string): string {
//   const parts = name.toLowerCase().split(" ")
//   const firstName = parts[0] || ""
//   const _lastName = parts[1] || ""

//   // Önce sadece first name dene
//   const baseUsername = firstName

//   // Eğer daha önce kullanılmışsa sonuna random sayı ekle
//   // (getUser check'i create sırasında olacak, burada sadece format oluştur)
//   return baseUsername
// }

// function generateEmail(name: string, attempt: number = 0): string {
//   const username = generateUsername(name)
//   const finalUsername = attempt > 0 ? `${username}${attempt}` : username
//   const domains = [
//     "gmail.com",
//     "outlook.com",
//     "yahoo.com",
//     "proton.me",
//     "icloud.com",
//   ]

//   // domains arasından kriptografik seçim
//   return `${finalUsername}@${pickCrypto(domains)}`
// }

// // Sonra create fonksiyonunun sonuna (admin ve feedback user'lardan sonra) ekleyin:

// async function _createRealisticUsers() {
//   console.log("👥 Creating 150+ UNIQUE realistic users...")

//   const createdUsers = []

//   for (let index = 0; index < REALISTIC_NAMES.length; index++) {
//     const name = REALISTIC_NAMES[index]!
//     const parts = name.toLowerCase().split(" ")
//     const firstName = parts[0] || "user"

//     try {
//       let userName = firstName
//       let email = generateEmail(name)
//       let attempt = 0

//       while (await getUser({ email })) {
//         attempt++
//         userName = `${firstName}${attempt}`
//         email = generateEmail(name, attempt)
//         if (attempt > 100) break
//       }

//       if (attempt > 100) continue

//       // --- CRYPTO GÜNCELLEME BAŞLANGIÇ ---

//       // 1. Skill Mutasyonu: secureShuffle kullan
//       const flatSkills = [
//         "React",
//         "TypeScript",
//         "Node.js",
//         "Figma",
//         "UI/UX",
//         "Python",
//         "Machine Learning",
//         "DevOps",
//         "AWS",
//         "PostgreSQL",
//         "Next.js",
//         "Tailwind",
//         "Rust",
//         "Go",
//         "Solidity",
//         "SEO",
//         "Copywriting",
//       ]
//       const expertise = secureShuffle(flatSkills).slice(0, 3)

//       // 2. Bio Mutasyonu: pickCrypto kullan
//       const templates = [
//         "Specialist in",
//         "Focusing on",
//         "Expert at",
//         "Passionate about",
//         "Building",
//         "Crafting",
//         "Scaling",
//         "Architecting",
//       ]
//       let bio = `${pickCrypto(templates)} ${expertise[0]} and ${expertise[1]}`
//       if (bio.length > 50) bio = `${bio.substring(0, 47)}...`

//       // 3. Financial & Availability: cryptoInt ve cryptoFloat kullan
//       const hourlyRate = cryptoInt(30, 81) // 30-80 cr (81 exclusive)
//       const isAvailableForHire = cryptoFloat() > 0.3 // %70 true

//       // 4. Role: cryptoFloat kullan
//       const role = cryptoFloat() > 0.98 ? "admin" : "user" // %2 admin

//       // 5. Credits: cryptoInt kullan
//       const credits = cryptoInt(1000, 6000) // 1000-5999

//       // --- CRYPTO GÜNCELLEME BİTİŞ ---

//       const user = await createUser({
//         email,
//         name,
//         password: passwordToSalt("password123"),
//         role,
//         userName,
//         city: pickCrypto(CITIES),
//         country: pickCrypto(COUNTRIES),
//         credits,
//         bio,
//         expertise,
//         hourlyRate,
//         isAvailableForHire,
//       })

//       if (user) {
//         createdUsers.push(user)
//         if (index % 25 === 0) {
//           console.log(
//             `✅ [Sato-Seed] ${index + 1}/${REALISTIC_NAMES.length}: ${name} (@${userName}) -> ${bio}`,
//           )
//         }
//       }
//     } catch (error) {
//       console.error(`❌ Failed to create unique user: ${name}`, error)
//     }
//   }

//   console.log(
//     `🚀 Mission Complete: ${createdUsers.length} unique ninjas deployed to Dojo.`,
//   )
//   return createdUsers
// }

// // seed.ts dosyasının createRealisticUsers fonksiyonundan sonra ekleyin:

// async function _createCharacterProfiles() {
//   console.log("🎭 Creating character profiles for users...")

//   const users = await getUsers({ pageSize: 200 })
//   const sushiAgent = await db.query.aiAgents.findFirst({
//     where: eq(aiAgents.name, "sushi"),
//   })

//   if (!sushiAgent) {
//     console.error("❌ Sushi agent not found")
//     return
//   }

//   // ... personalities array aynı kalır ...

//   const createdProfiles = []

//   const personalities = [
//     {
//       personality:
//         "Professional software engineer with expertise in full-stack development",
//       traits: {
//         communication: ["Clear", "Direct", "Technical"],
//         expertise: ["React", "TypeScript", "Node.js", "PostgreSQL"],
//         behavior: ["Detail-oriented", "Problem-solver", "Collaborative"],
//         preferences: ["Clean code", "Testing", "Documentation"],
//       },
//       conversationStyle: "technical",
//       tags: ["engineering", "fullstack", "web"],
//       userRelationship: "Professional collaborator",
//       creditRate: 50, // credits per hour
//     },
//     {
//       personality:
//         "Creative designer focused on user experience and visual aesthetics",
//       traits: {
//         communication: ["Visual", "Empathetic", "Innovative"],
//         expertise: ["UI/UX", "Figma", "Design Systems", "Branding"],
//         behavior: ["Creative", "User-focused", "Iterative"],
//         preferences: ["Minimalism", "Accessibility", "User research"],
//       },
//       conversationStyle: "casual",
//       tags: ["design", "ux", "creative"],
//       userRelationship: "Design partner",
//       creditRate: 45,
//     },
//     {
//       personality:
//         "Data scientist specializing in machine learning and analytics",
//       traits: {
//         communication: ["Analytical", "Data-driven", "Precise"],
//         expertise: ["Python", "ML", "Statistics", "Data visualization"],
//         behavior: ["Methodical", "Research-oriented", "Quantitative"],
//         preferences: ["Clean data", "Reproducibility", "Insights"],
//       },
//       conversationStyle: "formal",
//       tags: ["data-science", "ml", "analytics"],
//       userRelationship: "Technical advisor",
//       creditRate: 60,
//     },
//     {
//       personality:
//         "Product manager with strong business acumen and strategic thinking",
//       traits: {
//         communication: ["Strategic", "Clear", "Persuasive"],
//         expertise: [
//           "Product strategy",
//           "Roadmapping",
//           "Stakeholder management",
//         ],
//         behavior: ["Goal-oriented", "User-centric", "Data-informed"],
//         preferences: ["Impact", "Metrics", "User feedback"],
//       },
//       conversationStyle: "professional",
//       tags: ["product", "strategy", "business"],
//       userRelationship: "Strategic partner",
//       creditRate: 55,
//     },
//     {
//       personality: "DevOps engineer focused on infrastructure and automation",
//       traits: {
//         communication: ["Systematic", "Practical", "Efficient"],
//         expertise: ["Docker", "Kubernetes", "CI/CD", "AWS"],
//         behavior: ["Automation-first", "Reliability-focused", "Scalable"],
//         preferences: ["Infrastructure as code", "Monitoring", "Security"],
//       },
//       conversationStyle: "technical",
//       tags: ["devops", "infrastructure", "automation"],
//       userRelationship: "Infrastructure specialist",
//       creditRate: 50,
//     },
//     {
//       personality: "Content writer and storyteller with marketing expertise",
//       traits: {
//         communication: ["Engaging", "Creative", "Persuasive"],
//         expertise: ["Copywriting", "Content strategy", "SEO", "Storytelling"],
//         behavior: ["Creative", "Audience-focused", "Adaptable"],
//         preferences: ["Clear messaging", "Brand voice", "Engagement"],
//       },
//       conversationStyle: "casual",
//       tags: ["content", "marketing", "writing"],
//       userRelationship: "Content collaborator",
//       creditRate: 40,
//     },
//   ]

//   for (let i = 0; i < users.users.length; i++) {
//     const user = users.users[i]
//     if (!user) continue

//     try {
//       const profile = personalities[i % personalities.length]
//       if (!profile) continue

//       const thread = await createThread({
//         userId: user.id,
//         title: `${user.name}'s Profile`,
//         aiResponse: `Hi! I'm ${user.name}, ${profile.personality}`,
//         visibility: "public",
//       })

//       if (!thread) {
//         console.error(`Failed to create thread for ${user.name}`)
//         continue
//       }

//       // CRYPTO GÜNCELLEME: cryptoFloat ve cryptoInt kullan
//       const characterProfile = await db
//         .insert(characterProfiles)
//         .values({
//           agentId: sushiAgent.id,
//           userId: user.id,
//           threadId: thread.id,
//           name: user.name || "Anonymous",
//           personality: profile.personality,
//           visibility: i % 3 === 0 ? "public" : "protected",
//           pinned: i % 10 === 0,
//           traits: profile.traits,
//           tags: profile.tags,
//           conversationStyle: profile.conversationStyle,
//           userRelationship: profile.userRelationship,
//           usageCount: cryptoInt(0, 51), // 0-50
//           metadata: {
//             version: "1.0",
//             createdBy: "seed",
//             effectiveness: cryptoFloat() * 0.5 + 0.5, // 0.5-1.0
//             creditRate: profile.creditRate,
//           },
//         })
//         .returning()

//       if (characterProfile[0]) {
//         createdProfiles.push(characterProfile[0])
//         if (i % 20 === 0) {
//           console.log(
//             `✅ Created profile ${i + 1}/${users.users.length}: ${user.name}`,
//           )
//         }
//       }
//     } catch (error) {
//       console.error(`❌ Failed to create profile for ${user.name}:`, error)
//     }
//   }

//   console.log(
//     `✅ Successfully created ${createdProfiles.length}/${users.users.length} character profiles`,
//   )
//   return createdProfiles
// }

// // create fonksiyonunun sonuna ekleyin (await createRealisticUsers() satırından sonra):

// // Create character profiles for all users

// // create fonksiyonunun içinde, localswaphub user'dan sonra ekleyin:

// // Create 150+ realistic users
// async function _clearGuests() {
//   const batchSize = 500
//   let totalDeleted = 0
//   let hasMore = true

//   // 5 gün önceki tarih
//   const fiveDaysAgo = new Date()
//   fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

//   while (hasMore) {
//     // Find inactive guests (no subscription, no messages, no tasks)
//     const inactiveGuests = await db
//       .select({ id: guests.id, ip: guests.ip })
//       .from(guests)
//       .leftJoin(subscriptions, eq(subscriptions.guestId, guests.id))
//       .leftJoin(messages, eq(messages.guestId, guests.id))
//       .leftJoin(apps, eq(apps.guestId, guests.id))
//       .leftJoin(sql`task`, sql`task."guestId" = ${guests.id}`)
//       .where(
//         and(
//           isNull(subscriptions.id),
//           isNull(apps.id),
//           isNull(messages.id),
//           sql`task.id IS NULL`,
//           lt(guests.activeOn, fiveDaysAgo),
//           // sql<boolean>`${guests.createdOn} < NOW() - INTERVAL '5 days'`,
//         ),
//       )
//       .groupBy(guests.id, guests.ip)
//       .limit(batchSize)

//     if (inactiveGuests.length === 0) {
//       hasMore = false
//       break
//     }

//     // Delete batch
//     const idsToDelete = inactiveGuests.map((g) => g.id)
//     await db.delete(guests).where(inArray(guests.id, idsToDelete))

//     totalDeleted += inactiveGuests.length
//     console.log(
//       `🧹 Deleted batch of ${inactiveGuests.length} guests (total: ${totalDeleted})`,
//     )

//     // Show some IPs from this batch
//     inactiveGuests.slice(0, 5).forEach((guest) => {
//       console.log(`  - ${guest.ip}`)
//     })

//     if (inactiveGuests.length < batchSize) {
//       hasMore = false
//     }
//   }

//   console.log(
//     `✅ Cleanup complete! Deleted ${totalDeleted} inactive bot guests`,
//   )
// }

// async function _clearMemories() {
//   // console.log("🧠 Cleaning up inconsistent app memories...")

//   // Find app memories with user-specific language
//   const inconsistentMemories = await db
//     .select({
//       id: memories.id,
//       content: memories.content,
//       title: memories.title,
//     })
//     .from(memories)
//     .where(
//       and(
//         // Must be an app memory (has appId, no userId/guestId)
//         sql`${memories.appId} IS NOT NULL`,
//         sql`${memories.userId} IS NULL`,
//         sql`${memories.guestId} IS NULL`,
//         // Contains user-specific language
//         sql`(
//           LOWER(${memories.content}) LIKE '%this user%' OR
//           LOWER(${memories.content}) LIKE '%the user%' OR
//           LOWER(${memories.content}) LIKE '% user is %' OR
//           LOWER(${memories.content}) LIKE '% user has %' OR
//           LOWER(${memories.content}) LIKE '% their %' OR
//           LOWER(${memories.content}) LIKE '% they %' OR
//           LOWER(${memories.content}) LIKE '%enabled for%user%' OR
//           LOWER(${memories.content}) LIKE '%disabled for%user%'
//         )`,
//       ),
//     )

//   if (inconsistentMemories.length === 0) {
//     console.log("✅ No inconsistent app memories found")
//     return
//   }

//   console.log(`Found ${inconsistentMemories.length} inconsistent app memories:`)
//   inconsistentMemories.forEach((memory) => {
//     console.log(
//       `  ❌ "${memory.title}" - ${memory.content.substring(0, 80)}...`,
//     )
//   })

//   // Delete them
//   const idsToDelete = inconsistentMemories.map((m) => m.id)
//   await db.delete(memories).where(inArray(memories.id, idsToDelete))

//   console.log(
//     `✅ Deleted ${inconsistentMemories.length} inconsistent app memories`,
//   )
// }

// const create = async () => {
//   if (isProd) {
//     return
//   }

//   // if (isVex) {
//   //   return
//   // }
//   // await createRealisticUsers()
//   // await createCharacterProfiles()

//   console.log("🌍 Creating cities...")
//   console.log("✅ Cities created")

//   // Check if admin user already exists
//   const admin = await getUser({ email: VEX_TEST_EMAIL })

//   if (!admin) {
//     return
//   }

//   // const { vex } = await createStores({ user: admin })

//   // Check if feedback user already exists
//   let feedback = await getUser({ email: VEX_TEST_EMAIL_2 })

//   if (!feedback) {
//     console.log("👤 Creating feedback user...")
//     feedback = await createUser({
//       email: VEX_TEST_EMAIL_2,
//       name: VEX_TEST_NAME_2,
//       password: passwordToSalt(VEX_TEST_PASSWORD_2),
//       role: "user",
//       userName: VEX_TEST_NAME_2,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[0],
//       roles: ["admin"],
//     })
//     if (!feedback) throw new Error("Failed to add user")
//     console.log("✅ Feedback user created")
//   } else {
//     await updateUser({
//       ...feedback,
//       email: VEX_TEST_EMAIL_2,
//       name: VEX_TEST_NAME_2,
//       password: passwordToSalt(VEX_TEST_PASSWORD_2),
//       role: "user",
//       userName: VEX_TEST_NAME_2,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[0],
//       roles: ["admin"],
//     })

//     feedback = await getUser({ email: VEX_TEST_EMAIL_2 })

//     console.log("✅ Feedback user already exists, skipping creation")
//   }

//   // Check if diplomatic user already exists
//   let diplomatic = await getUser({ email: VEX_TEST_EMAIL_3 })

//   if (!diplomatic) {
//     console.log("👤 Creating diplomatic user...")
//     diplomatic = await createUser({
//       email: VEX_TEST_EMAIL_3,
//       name: VEX_TEST_NAME_3,
//       password: passwordToSalt(VEX_TEST_PASSWORD_3),
//       role: "user",
//       userName: VEX_TEST_NAME_3,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[1],
//       roles: ["admin"],
//     })
//     console.log("✅ Diplomatic user created")
//   } else {
//     await updateUser({
//       ...diplomatic,
//       email: VEX_TEST_EMAIL_3,
//       name: VEX_TEST_NAME_3,
//       password: passwordToSalt(VEX_TEST_PASSWORD_3),
//       role: "user",
//       userName: VEX_TEST_NAME_3,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[1],
//       roles: ["admin"],
//     })
//     console.log("✅ Diplomatic user already exists, skipping creation")
//   }

//   if (!diplomatic) throw new Error("Failed to add user")

//   // Check if localswaphub user already exists
//   let localswaphub = await getUser({ email: VEX_TEST_EMAIL_4 })

//   if (!localswaphub) {
//     console.log("👤 Creating localswaphub user...")
//     localswaphub = await createUser({
//       email: VEX_TEST_EMAIL_4,
//       name: VEX_TEST_NAME_4,
//       password: passwordToSalt(VEX_TEST_PASSWORD_4),
//       role: "user",
//       userName: VEX_TEST_NAME_4,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[2],
//       roles: ["admin"],
//     })
//     console.log("✅ Localswaphub user created")
//   } else {
//     await updateUser({
//       ...localswaphub,
//       email: VEX_TEST_EMAIL_4,
//       name: VEX_TEST_NAME_4,
//       password: passwordToSalt(VEX_TEST_PASSWORD_4),
//       role: "user",
//       userName: VEX_TEST_NAME_4,
//       fingerprint: TEST_MEMBER_FINGERPRINTS[2],
//       roles: ["admin"],
//     })

//     localswaphub = await getUser({ email: VEX_TEST_EMAIL_4 })

//     console.log("✅ Localswaphub user already exists, skipping creation")
//   }

//   if (!localswaphub) throw new Error("Failed to add user")

//   const agents = await createAgents()

//   return

//   // // --- BEGIN meaningful threads/messages/AI agent seeding ---

//   // // Seed real-time analytics for feedback user
//   // console.log("📊 Seeding analytics data for feedback user...")
//   // const analyticsEvents = [
//   //   {
//   //     name: "app",
//   //     props: { appName: "Istanbul", appSlug: "istanbul" },
//   //     hoursAgo: 2,
//   //   },
//   //   {
//   //     name: "theme_change",
//   //     props: { isDark: true, colorScheme: "purple" },
//   //     hoursAgo: 3,
//   //   },
//   //   {
//   //     name: "app",
//   //     props: { appName: "Atlas", appSlug: "atlas" },
//   //     hoursAgo: 4,
//   //   },
//   //   {
//   //     name: "theme_change",
//   //     props: { isDark: true, colorScheme: "green" },
//   //     hoursAgo: 5,
//   //   },
//   //   {
//   //     name: "app",
//   //     props: { appName: "Bloom", appSlug: "bloom" },
//   //     hoursAgo: 6,
//   //   },
//   //   {
//   //     name: "app",
//   //     props: { appName: "Vault", appSlug: "vault" },
//   //     hoursAgo: 8,
//   //   },
//   // ]

//   // for (const event of analyticsEvents) {
//   //   const eventTime = new Date(now.getTime() - event.hoursAgo * 60 * 60 * 1000)
//   //   await db.insert(realtimeAnalytics).values({
//   //     userId: feedback.id,
//   //     appSlug: event.props.appSlug || null,
//   //     eventName: event.name,
//   //     eventProps: event.props,
//   //     createdOn: eventTime,
//   //   })
//   // }
//   // console.log(`✅ Seeded ${analyticsEvents.length} analytics events`)

//   // // Seed expenses for Vault questions
//   // console.log("💰 Seeding expenses for feedback user...")
//   // const expenseData = [
//   //   {
//   //     amount: 4550,
//   //     category: "food",
//   //     description: "Lunch at local cafe",
//   //     daysAgo: 1,
//   //   },
//   //   {
//   //     amount: 12000,
//   //     category: "transport",
//   //     description: "Monthly transit pass",
//   //     daysAgo: 5,
//   //   },
//   //   {
//   //     amount: 8999,
//   //     category: "entertainment",
//   //     description: "Concert tickets",
//   //     daysAgo: 3,
//   //   },
//   //   {
//   //     amount: 6500,
//   //     category: "food",
//   //     description: "Grocery shopping",
//   //     daysAgo: 2,
//   //   },
//   //   {
//   //     amount: 15000,
//   //     category: "housing",
//   //     description: "Rent payment",
//   //     daysAgo: 10,
//   //   },
//   //   {
//   //     amount: 3500,
//   //     category: "food",
//   //     description: "Coffee and snacks",
//   //     daysAgo: 1,
//   //   },
//   //   {
//   //     amount: 7500,
//   //     category: "shopping",
//   //     description: "New headphones",
//   //     daysAgo: 7,
//   //   },
//   // ]

//   // for (const expense of expenseData) {
//   //   const expenseDate = new Date(
//   //     now.getTime() - expense.daysAgo * 24 * 60 * 60 * 1000,
//   //   )
//   //   await db.insert(expenses).values({
//   //     userId: feedback.id,
//   //     amount: expense.amount,
//   //     category: expense.category as any,
//   //     description: expense.description,
//   //     date: expenseDate,
//   //     createdOn: expenseDate,
//   //   })
//   // }
//   // console.log(`✅ Seeded ${expenseData.length} expenses`)

//   // // Seed focus/timer sessions for Bloom questions
//   // console.log("⏱️ Seeding timer sessions for feedback user...")
//   // const timerData = [
//   //   { duration: 1500, task: "Deep work on analytics feature", hoursAgo: 2 },
//   //   { duration: 900, task: "Code review", hoursAgo: 24 },
//   //   { duration: 1800, task: "Writing documentation", hoursAgo: 48 },
//   //   { duration: 1200, task: "Team meeting prep", hoursAgo: 72 },
//   // ]

//   // for (const timer of timerData) {
//   //   const timerDate = new Date(now.getTime() - timer.hoursAgo * 60 * 60 * 1000)
//   //   await db.insert(timers).values({
//   //     userId: feedback.id,
//   //     duration: timer.duration,
//   //     count: timer.duration, // Initial count matches duration
//   //     fingerprint: "test-fingerprint", // Required field
//   //     createdOn: timerDate,
//   //   } as any)
//   // }
//   // console.log(`✅ Seeded ${timerData.length} timer sessions`)

//   // // Seed feedback messages for Peach questions
//   // console.log("🍐 Seeding feedback messages for Peach...")

//   // // Create a thread for the feedback
//   // const feedbackThread = await createThread({
//   //   userId: feedback.id,
//   //   title: "Feedback Thread",
//   //   aiResponse: "Thanks for your feedback!",
//   //   createdOn: now,
//   //   updatedOn: now,
//   // })

//   // if (!feedbackThread?.id) throw new Error("Failed to create feedback thread")

//   // const feedbackMessages = [
//   //   {
//   //     content: "The Istanbul guide is amazing! Love the local tips.",
//   //     daysAgo: 1,
//   //   },
//   //   {
//   //     content: "Would love to see more budget tracking features in Vault",
//   //     daysAgo: 2,
//   //   },
//   //   { content: "Focus timer is great but needs Pomodoro mode", daysAgo: 3 },
//   //   {
//   //     content: "Atlas navigation is super helpful for finding places",
//   //     daysAgo: 4,
//   //   },
//   // ]

//   // for (const msg of feedbackMessages) {
//   //   const msgDate = new Date(now.getTime() - msg.daysAgo * 24 * 60 * 60 * 1000)
//   //   await db.insert(messages).values({
//   //     userId: feedback.id,
//   //     threadId: feedbackThread.id,
//   //     content: msg.content,
//   //     isPear: true,
//   //     createdOn: msgDate,
//   //     updatedOn: msgDate,
//   //   })
//   // }
//   // console.log(`✅ Seeded ${feedbackMessages.length} feedback messages`)

//   // // Seed calendar events for Atlas questions
//   // console.log("📅 Seeding calendar events for feedback user...")
//   // const calendarData = [
//   //   {
//   //     title: "Coffee at De Koffie Salon",
//   //     location: "Amsterdam",
//   //     daysAhead: 2,
//   //   },
//   //   { title: "Team meeting", location: "Centraal Station", daysAhead: 1 },
//   //   { title: "Lunch with friends", location: "Jordaan", daysAhead: 3 },
//   // ]

//   // for (const event of calendarData) {
//   //   const eventDate = new Date(
//   //     now.getTime() + event.daysAhead * 24 * 60 * 60 * 1000,
//   //   )
//   //   await db.insert(calendarEvents).values({
//   //     userId: feedback.id,
//   //     title: event.title,
//   //     location: event.location,
//   //     startTime: eventDate,
//   //     endTime: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour duration
//   //     createdOn: now,
//   //   })
//   // }
//   // console.log(`✅ Seeded ${calendarData.length} calendar events`)

//   // // await seedTribeEngagement()
//   // // await seedPearFeedback()

//   // await updateStoreUrls({ user: admin })

//   // await seedScheduledTribeJobs({ admin })

//   // const { sushiAgent } = agents

//   // await createEvent({ user: admin })
//   // await createCities()

//   // for (const adminUser of [admin]) {
//   //   const block = process.env.TESTING_ENV === "e2e" || isSeedSafe
//   //   if (block) return

//   //   // Pool of user prompts and AI responses
//   //   const prompts = [
//   //     "What is the weather like in Paris today?",
//   //     "Explain the concept of relativity.",
//   //     "How do I reset my password?",
//   //     "Tell me a joke.",
//   //     "Summarize the latest news in AI.",
//   //     "What's the capital of Australia?",
//   //     "How does photosynthesis work?",
//   //     "Translate 'good morning' to Spanish.",
//   //     "What's the best way to learn TypeScript?",
//   //     "Who won the World Cup in 2018?",
//   //     "How do I make a perfect omelette?",
//   //     "What are the health benefits of yoga?",
//   //     "Define the term 'blockchain'.",
//   //     "What is quantum computing?",
//   //     "Give me a fun fact about cats.",
//   //     "How do airplanes fly?",
//   //     "What is the Fibonacci sequence?",
//   //     "Tips for staying productive when working remotely?",
//   //     "What's the distance from Earth to Mars?",
//   //     "How do I improve my public speaking skills?",
//   //   ]
//   //   const responses = [
//   //     "The weather in Paris today is mostly sunny with a high of 24°C.",
//   //     "Relativity is a theory by Einstein that explains how space and time are linked for objects moving at a constant speed.",
//   //     "To reset your password, click on 'Forgot password' on the login page and follow the instructions.",
//   //     "Why did the computer show up at work late? It had a hard drive!",
//   //     "Recent AI news: OpenAI released a new model that can generate images from text.",
//   //     "The capital of Australia is Canberra.",
//   //     "Photosynthesis is the process by which green plants use sunlight to synthesize food from carbon dioxide and water.",
//   //     "'Good morning' in Spanish is 'Buenos días'.",
//   //     "Practice regularly, use official docs, and build small projects to learn TypeScript effectively.",
//   //     "France won the FIFA World Cup in 2018.",
//   //     "Whisk eggs, add a pinch of salt, cook on medium heat, and fold gently for a perfect omelette.",
//   //     "Yoga improves flexibility, reduces stress, and boosts overall well-being.",
//   //     "Blockchain is a distributed digital ledger that records transactions across many computers securely.",
//   //     "Quantum computing uses quantum bits to perform computations much faster for certain problems.",
//   //     "Cats have five toes on their front paws, but only four on the back!",
//   //     "Airplanes fly due to the lift generated by their wings as air flows over them.",
//   //     "The Fibonacci sequence is a series where each number is the sum of the two preceding ones.",
//   //     "Set boundaries, take breaks, and use task lists to stay productive when working remotely.",
//   //     "The average distance from Earth to Mars is about 225 million kilometers.",
//   //     "Practice regularly, record yourself, and get feedback to improve public speaking skills.",
//   //   ]

//   //   // --- JSON-like structure for multi-turn threads ---
//   //   const THREAD_COUNT = block ? 2 : 20
//   //   const MESSAGES_PER_THREAD = block ? 5 : 50
//   //   const threadsData = Array.from({ length: THREAD_COUNT }).map((_, t) => {
//   //     const _usedIndexes = new Set<number>()
//   //     const messages: { role: "user" | "ai"; content: string }[] = []
//   //     // For the first 5 threads, ensure at least 50 messages (25 user/ai pairs)
//   //     const messagePairs =
//   //       t < 5 ? MESSAGES_PER_THREAD / 2 : Math.ceil(prompts.length / 2)
//   //     for (let c = 0; c < messagePairs; c++) {
//   //       // Cycle through prompts/responses for variety
//   //       const idx = (c + t * messagePairs) % prompts.length
//   //       const userText = prompts[idx] ?? `Prompt ${idx}`
//   //       const agentText = responses[idx] ?? `Response ${idx}`
//   //       messages.push(
//   //         { role: "user", content: userText },
//   //         { role: "ai", content: agentText },
//   //       )
//   //     }
//   //     // Use the first user message as the thread title
//   //     return {
//   //       title: messages[0]?.content || `Thread ${t + 1}`,
//   //       messages,
//   //     }
//   //   })

//   //   // --- Seed threads and messages from JSON-like structure ---

//   //   const oneHourAgo = new Date(now.getTime() - 60 * 600 * 1000)
//   //   const timePerThread = (600 * 60 * 1000) / THREAD_COUNT

//   //   // Then for each thread:

//   //   for (let t = 0; t < threadsData.length; t++) {
//   //     const threadDatum = threadsData[t]
//   //     if (!threadDatum) throw new Error(`Missing thread data at index ${t}`)
//   //     if (!adminUser.id) throw new Error("Admin user has no id")

//   //     const threadStartTime = new Date(oneHourAgo.getTime() - t * timePerThread)
//   //     let lastMessageTime = new Date(threadStartTime)

//   //     const vex = await getApp({ slug: "vex" })
//   //     if (!vex) throw new Error("Vex app not found")

//   //     const thread = await createThread({
//   //       userId: adminUser.id as string,
//   //       title: threadDatum.title as string,
//   //       aiResponse: threadDatum.messages[1]?.content as string,
//   //       createdOn: lastMessageTime,
//   //       updatedOn: lastMessageTime,
//   //       appId: vex.id,
//   //     })

//   //     if (!thread?.id) throw new Error("Failed to create thread")

//   //     for (const msg of threadDatum.messages) {
//   //       if (msg.role === "user") {
//   //         const userMessage = await createMessage({
//   //           userId: adminUser.id as string,
//   //           threadId: thread.id as string,
//   //           content: msg.content as string,
//   //           createdOn: lastMessageTime,
//   //           updatedOn: lastMessageTime,
//   //         })
//   //         if (!userMessage) throw new Error("Failed to create user message")
//   //       } else {
//   //         if (!sushiAgent.id) throw new Error("Agent has no id")
//   //         const agentMessage = await createMessage({
//   //           threadId: thread.id as string,
//   //           agentId: sushiAgent.id as string,
//   //           userId: adminUser.id as string,
//   //           content: msg.content as string,
//   //           createdOn: lastMessageTime,
//   //           updatedOn: lastMessageTime,
//   //         })
//   //         if (!agentMessage) throw new Error("Failed to create agent message")
//   //       }
//   //       lastMessageTime = new Date(lastMessageTime.getTime() + 120000) // 2 minutes
//   //     }
//   //     console.log(
//   //       `Seeded thread ${t + 1} with ${threadDatum.messages.length} messages`,
//   //     )
//   //   }
//   //   // --- END meaningful threads/messages/AI agent seeding ---

//   //   const thread = await createThread({
//   //     userId: localswaphub.id as string,
//   //     title: "Test Collaboration Thread",
//   //     aiResponse: "Test Collaboration AI Response",
//   //   })

//   //   if (!thread) throw new Error("Failed to create thread")

//   //   {
//   //     const message = await createMessage({
//   //       threadId: thread.id,
//   //       // agentId: sushiAgent.id,
//   //       userId: localswaphub.id,
//   //       content: "Test Collaboration User Message",
//   //       // createdOn: new Date(lastMessageTime),
//   //       // updatedOn: new Date(lastMessageTime),
//   //     })

//   //     if (!message) throw new Error("Failed to create message")

//   //     const collaboration = await createCollaboration({
//   //       threadId: thread.id,
//   //       userId: admin.id,
//   //       status: "pending",
//   //     })

//   //     if (!collaboration) throw new Error("Failed to create collaboration")
//   //   }
//   //   const publicThread = await createThread({
//   //     userId: localswaphub.id,
//   //     title: "Test Public Thread",
//   //     aiResponse: "Test Public AI Response",
//   //     visibility: "public",
//   //   })

//   //   if (!publicThread) throw new Error("Failed to create public thread")

//   //   {
//   //     const message = await createMessage({
//   //       threadId: publicThread.id,
//   //       // agentId: sushiAgent.id,
//   //       userId: localswaphub.id,
//   //       content: "Test Public User Message",
//   //       // createdOn: new Date(lastMessageTime),
//   //       // updatedOn: new Date(lastMessageTime),
//   //     })

//   //     if (!message) throw new Error("Failed to create message")
//   //   }

//   //   // await updateThread({
//   //   //   ...publicThread,
//   //   //   bookmarks: [
//   //   //     {
//   //   //       userId: admin.id,
//   //   //       createdOn: new Date().toISOString(),
//   //   //     },
//   //   //   ],
//   //   // })

//   //   // const guest = await createGuest({
//   //   //   ip: "192.168.2.27",
//   //   //   credits: 5000,
//   //   //   activeOn: new Date(),
//   //   //   createdOn: new Date(),
//   //   //   updatedOn: new Date(),
//   //   //   fingerprint: uuid(),
//   //   // })
//   // }

//   // if (!guest) throw new Error("Failed to add guest")

//   // console.log("Guest created:", guest.ip)
// }

// if (!collaboration) throw new Error("Failed to create collaboration")

// const updateStoreUrls = async ({ user }: { user: user }) => {
//   const vex = await getApp({ slug: "vex", userId: user.id })
//   if (!vex) throw new Error("Vex app not found")
//   await updateApp({
//     ...vex,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/vex-🍒/enpllenkofnbmnflnlkbomkcilamjgac",
//   })

//   console.log(
//     "Vex app updated",
//     await getApp({ slug: "vex", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )

//   const chrry = await getApp({ slug: "chrry", userId: user.id })
//   if (!chrry) throw new Error("Chrry app not found")
//   await updateApp({
//     ...chrry,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/chrry-🍒/odgdgbbddopmblglebfngmaebmnhegfc",
//   })

//   console.log(
//     "Chrry app updated",
//     await getApp({ slug: "chrry", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )

//   const popcorn = await getApp({ slug: "popcorn", userId: user.id })
//   if (!popcorn) throw new Error("Popcorn app not found")
//   await updateApp({
//     ...popcorn,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/popcorn-🍒/lfokfhplbjckmfmbakfgpkhaanfencah",
//   })

//   console.log(
//     "Popcorn app updated",
//     await getApp({ slug: "popcorn", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )

//   const zarathustra = await getApp({ slug: "zarathustra", userId: user.id })
//   if (!zarathustra) throw new Error("Zarathustra app not found")
//   await updateApp({
//     ...zarathustra,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/zarathustra-🍒/jijgmcofljfalongocihccblcboppnad",
//   })

//   console.log(
//     "Zarathustra app updated",
//     await getApp({ slug: "zarathustra", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )

//   const atlas = await getApp({ slug: "atlas", userId: user.id })
//   if (!atlas) throw new Error("Atlas app not found")
//   await updateApp({
//     ...atlas,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/atlas-🍒/adopnldifkjlgholfcijjgocgnolknpb",
//   })

//   console.log(
//     "Atlas app updated",
//     await getApp({ slug: "atlas", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )

//   const focus = await getApp({ slug: "focus", userId: user.id })
//   if (!focus) throw new Error("Focus app not found")
//   await updateApp({
//     ...focus,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/focus-🍒/nkomoiomfaeodakglkihapminhpgnibl",
//   })

//   const search = await getApp({ slug: "search", userId: user.id })
//   if (!search) throw new Error("Search app not found")
//   await updateApp({
//     ...search,
//     chromeWebStoreUrl:
//       "https://chromewebstore.google.com/detail/search-🍒/cloblmampohoemdaojenlkjbnkpmkiop?authuser=0&hl=en",
//   })

//   console.log(
//     "Focus app updated",
//     await getApp({ slug: "focus", userId: user.id }).then(
//       (app) => app?.chromeWebStoreUrl,
//     ),
//   )
// }

// const _waffles = async () => {
//   const admin = await getUser({
//     email: isWaffles ? "ibsukru@gmail.com" : "ibsukru@gmail.com",
//   })
//   if (!admin) throw new Error("Admin user not found")

//   await createStores({ user: admin })
// }

// const _generateTribes = async () => {
//   // const oops = true

//   // if (oops) {
//   //   await db.delete(tribeBlocks)
//   //   await db.delete(tribeComments)
//   //   await db.delete(tribeFollows)
//   //   await db.delete(tribePosts)
//   //   await db.delete(tribeLikes)
//   //   await db.delete(tribes)
//   // }

//   const tribeTemplates = [
//     {
//       name: "General",
//       slug: "general",
//       description: "General discussion for all Wine ecosystem apps",
//     },
//     {
//       name: "AI & ML",
//       slug: "ai-ml",
//       description: "Artificial Intelligence and Machine Learning discussions",
//     },
//     {
//       name: "Productivity",
//       slug: "productivity",
//       description: "Tips and tools for getting things done",
//     },
//     {
//       name: "Development",
//       slug: "development",
//       description: "Software development and coding discussions",
//     },
//     {
//       name: "Design",
//       slug: "design",
//       description: "UI/UX design and creative work",
//     },
//     {
//       name: "Analytics",
//       slug: "analytics",
//       description: "Data analysis and insights",
//     },
//     {
//       name: "Collaboration",
//       slug: "collaboration",
//       description: "Team work and project management",
//     },
//     {
//       name: "Innovation",
//       slug: "innovation",
//       description: "New ideas and experimental features",
//     },
//     {
//       name: "Community",
//       slug: "community",
//       description: "Community updates and events",
//     },
//     {
//       name: "Support",
//       slug: "support",
//       description: "Help and troubleshooting",
//     },
//     {
//       name: "Feedback",
//       slug: "feedback",
//       description: "Product feedback and suggestions",
//     },
//     {
//       name: "Announcements",
//       slug: "announcements",
//       description: "Important updates and news",
//     },
//     {
//       name: "Showcase",
//       slug: "showcase",
//       description: "Show off your work and projects",
//     },
//     {
//       name: "Learning",
//       slug: "learning",
//       description: "Educational content and tutorials",
//     },
//     {
//       name: "Philosophy",
//       slug: "philosophy",
//       description: "Deep thoughts and philosophical discussions",
//     },
//     {
//       name: "Wellness",
//       slug: "wellness",
//       description: "Mental health and wellbeing",
//     },
//     {
//       name: "Entertainment",
//       slug: "entertainment",
//       description: "Fun and leisure content",
//     },
//     {
//       name: "Research",
//       slug: "research",
//       description: "Research findings and experiments",
//     },
//     {
//       name: "Science",
//       slug: "science",
//       description: "Scientific discoveries, experiments, and discussions",
//     },
//     {
//       name: "Mathematics",
//       slug: "mathematics",
//       description: "Math problems, proofs, and numerical reasoning",
//     },
//     {
//       name: "Physics",
//       slug: "physics",
//       description: "Classical and modern physics discussions",
//     },
//     {
//       name: "Biology",
//       slug: "biology",
//       description: "Life sciences, genetics, and ecology",
//     },
//     {
//       name: "Space & Astronomy",
//       slug: "space",
//       description: "Cosmos, space exploration, and astrophysics",
//     },
//   ]

//   const createdTribes = []
//   for (const template of tribeTemplates) {
//     let [tribe] = await db
//       .select()
//       .from(tribes)
//       .where(eq(tribes.slug, template.slug))

//     if (!tribe) {
//       ;[tribe] = await db
//         .insert(tribes)
//         .values({
//           name: template.name,
//           slug: template.slug,
//           description: template.description,
//           visibility: "public",
//         })
//         .returning()
//       console.log(`✅ Created '${template.name}' tribe`)
//     }

//     if (tribe) {
//       createdTribes.push(tribe)
//     }
//   }
// }

// const prod = async () => {
//   // Check if admin user already exists
//   // await _clearMemories()
//   // await clearGuests()

//   const admin = await getUser({
//     email: isProd || isVex ? "ibsukru@gmail.com" : "ibsukru@gmail.com",
//   })
//   if (!admin) throw new Error("Admin user not found")

//   if (!isProd) {
//     const admin = await getUser({
//       email: "ibsukru@gmail.com",
//     })
//     if (!admin) {
//       await createUser({
//         email: "ibsukru@gmail.com",
//         name: VEX_TEST_NAME,
//         password: passwordToSalt(VEX_TEST_PASSWORD),
//         role: "admin",
//         userName: "ibsukru",
//         // credits: !isSeedSafe ? 99999999 : undefined,
//         city: "Amsterdam",
//         country: "Netherlands",
//       })
//     }
//   }

//   // await createAgents()
//   // Ensure stores are created during seeding for automated tests and dev/prod parity
//   await createStores({ user: admin })

//   // await seedPearFeedback()

//   await seedScheduledTribeJobs({ admin })

//   // await updateStoreUrls({ user: admin })

//   // Delete inactive bot guests in batches
//   // await clearGuests()
//   // const vex = await createStores({ user: admin, isProd: true })
//   // const allInstructions = await db.select().from(instructions)
//   // const seen = new Map<string, string>() // Map of unique key -> instruction ID
//   // const duplicateIds: string[] = []
//   // for (const instruction of allInstructions) {
//   //   // Create unique key based on userId/guestId + appId + title + content
//   //   const key = `${instruction.userId || ""}-${instruction.guestId || ""}-${instruction.appId || ""}-${instruction.title}-${instruction.content}`
//   //   if (
//   //     // instruction.title === "Plan afternoon trip under €1000 💰" &&
//   //     instruction.userId === admin.id
//   //   ) {
//   //     console.log("my in.", instruction)
//   //   }
//   //   // if (seen.has(key)) {
//   //   //   // This is a duplicate, mark for deletion
//   //   //   duplicateIds.push(instruction.id)
//   //   //   console.log(
//   //   //     `  ❌ Duplicate found: "${instruction.title}" (ID: ${instruction.id})`,
//   //   //   )
//   //   // } else {
//   //   //   seen.set(key, instruction.id)
//   //   // }
//   // }
//   // if (duplicateIds.length > 0) {
//   //   console.log(`🗑️  Removing ${duplicateIds.length} duplicate instructions...`)
//   //   for (const id of duplicateIds) {
//   //     // await db.delete(instructions).where(eq(instructions.id, id))
//   //   }
//   //   console.log(`✅ Removed ${duplicateIds.length} duplicate instructions`)
//   // } else {
//   //   console.log("✅ No duplicate instructions found")
// }

// // const vex = await createStores({ user: admin })
// // const me = await getUser({ email: "ibsukru@gmail.com" })
// // if (!me) {
// //   throw new Error("Failed user not found")
// // }
// // const calendarEvents = await getCalendarEvents({
// //   userId: me.id,
// // })
// // for (const element of calendarEvents) {
// //   await deleteCalendarEvent({ id: element.id })
// // }
// // await createEvent({ user: me })
// // return
// // const guests = await getGuests({
// //   pageSize: 1000000,
// // })
// // for (const guest of guests.guests) {
// //   const threadCount = (await getThreads({ pageSize: 1, guestId: guest.id }))
// //     .totalCount
// //   const oneWeekAgo = new Date()
// //   oneWeekAgo.setDate(oneWeekAgo.getDate() - 3)
// //   if (
// //     // guest.ip === "10.8.0.2"
// //     // guest.credits === GUEST_CREDITS_PER_MONTH &&
// //     // guest.activeOn < oneWeekAgo &&
// //     // threadCount === 0
// //     guest.favouriteAgent === "perplexity"
// //   ) {
// //     await updateGuest({
// //       ...guest,
// //       favouriteAgent: "deepSeek",
// //     })
// //     // await deleteGuest({ id: guest.id })
// //     console.log(
// //       `Guest ${guest.id} has ${threadCount} threads (inactive since ${guest.activeOn})`,
// //     )
// //   }
// // }

// const seedDb = async (): Promise<void> => {
//   // await syncAllGoals()
//   // process.exit(0)
//   // await prod()
//   // process.exit(0)
//   const allowClearDb = process.env.ALLOW_CLEAR_DB === "true"
//   const isNonInteractive = allowClearDb || isCI

//   // E2E mode: nuke everything and reseed from scratch
//   if (MODE === "e2e") {
//     if (!allowClearDb) {
//       throw new Error("❌ SAFETY: E2E seed requires ALLOW_CLEAR_DB=true")
//     }
//     console.log("🧹 E2E mode: clearing database and reseeding from scratch...")
//     await clearDb()

//     // Flush Redis
//     try {
//       await redis.flushdb()
//       console.log("🧹 Redis flushed")
//     } catch (err) {
//       console.warn("⚠️ Failed to flush Redis:", err)
//     }

//     await create()
//     console.log("✅ E2E seed complete")
//     await redis.quit()
//     process.exit(0)
//   }

//   if (isProd) {
//     if (!isNonInteractive) {
//       // eslint-disable-next-line no-console
//       console.warn(
//         "\n⚠️  WARNING: You are about to run the seed script on a NON-LOCAL database!\n" +
//           `DB_URL: ${DB_URL}\n` +
//           "Press Enter to continue, or Ctrl+C to abort.",
//       )

//       await new Promise<void>((resolve) => {
//         process.stdin.resume()
//         process.stdin.once("data", () => resolve())
//       })

//       // eslint-disable-next-line no-console
//       console.warn(
//         "\n🚀  REALLY SURE WARNING: You are about to run the seed script on a NON-LOCAL database!\n" +
//           `DB_URL: ${DB_URL}\n` +
//           "Press Enter to continue, or Ctrl+C to abort.",
//       )

//       await new Promise<void>((resolve) => {
//         process.stdin.resume()
//         process.stdin.once("data", () => resolve())
//       })
//     }

//     // await prod()
//     // process.exit(0)
//   } else {
//     await create()
//     await prod()
//     if (isSeedSafe && !isNonInteractive) {
//       // eslint-disable-next-line no-console
//       console.warn(
//         "\n🏹  WARNING: You are about to run the seed script on a e2e database!\n" +
//           `DB_URL: ${process.env.DB_URL}\n` +
//           "Press Enter to continue, or Ctrl+C to abort.",
//       )

//       await new Promise<void>((resolve) => {
//         process.stdin.resume()
//         process.stdin.once("data", () => resolve())
//       })
//     }

//     if (MODE === "dev") {
//       if (isVex) {
//         await create()
//         await prod()
//       } else {
//         // Safety gate: only allow clearDb on local databases or with explicit opt-in
//         const databaseUrl = process.env.DATABASE_URL || ""
//         const isLocalDb =
//           databaseUrl.includes("localhost") ||
//           databaseUrl.includes("127.0.0.1") ||
//           databaseUrl.includes("0.0.0.0")

//         if (!isLocalDb && !allowClearDb) {
//           throw new Error(
//             "❌ SAFETY: Cannot clear non-local database without ALLOW_CLEAR_DB=true",
//           )
//         }

//         if (allowClearDb) {
//           // await clearDb()
//           // await create()
//         }
//       }
//     }

//     process.exit(0)
//   }
// }

// seedDb()
