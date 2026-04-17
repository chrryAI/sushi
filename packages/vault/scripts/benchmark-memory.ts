// /**
//  * Agent Memory Benchmark Tool
//  *
//  * Uzun thread'lerdeki bilgileri agent'ın ne kadar iyi hatırladığını test eder.
//  *
//  * Kullanım:
//  *   pnpm tsx scripts/benchmark-memory.ts
//  *
//  * Çıktı:
//  *   - ROUGE-1 ve ROUGE-L skorları (0-1 arası, yüksek = daha iyi)
//  *   - Mean recall ~0.7+ iyi hafıza gösterir
//  */

// import { config } from "dotenv"

// config({ path: ".env" })

// import { createOpenAI } from "@ai-sdk/openai"
// import { generateText } from "ai"
// import { count, desc, eq, sql } from "drizzle-orm"
// import { drizzle } from "drizzle-orm/postgres-js"
// import postgres from "postgres"
// import { messages, threads } from "../src/schema"

// // Basit ROUGE skoru hesaplama (kelime overlap'i)
// function rougeScore(
//   reference: string,
//   candidate: string,
// ): { rouge1: number; rougeL: number } {
//   const refWords = reference
//     .toLowerCase()
//     .split(/\s+/)
//     .filter((w) => w.length > 0)
//   const candWords = candidate
//     .toLowerCase()
//     .split(/\s+/)
//     .filter((w) => w.length > 0)

//   if (refWords.length === 0 || candWords.length === 0) {
//     return { rouge1: 0, rougeL: 0 }
//   }

//   // ROUGE-1: Unigram overlap
//   const refSet = new Set(refWords)
//   const candSet = new Set(candWords)
//   const overlap = [...refSet].filter((w) => candSet.has(w)).length
//   const rouge1 = overlap / refSet.size

//   // ROUGE-L: Longest Common Subsequence (basitleştirilmiş)
//   const lcsLength = longestCommonSubsequence(refWords, candWords)
//   const rougeL = lcsLength / refWords.length

//   return { rouge1, rougeL }
// }

// function longestCommonSubsequence(a: string[], b: string[]): number {
//   const m = a.length,
//     n = b.length
//   const dp: number[][] = Array(m + 1)
//     .fill(null)
//     .map(() => Array(n + 1).fill(0))

//   for (let i = 1; i <= m; i++) {
//     for (let j = 1; j <= n; j++) {
//       if (a[i - 1] === b[j - 1]) {
//         dp[i][j] = dp[i - 1][j - 1] + 1
//       } else {
//         dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
//       }
//     }
//   }

//   return dp[m][n]
// }

// // QA Pair tipi
// interface QAPair {
//   question: string
//   answer: string
//   type: "early" | "middle" | "late" | "summary"
// }

// async function main() {
//   console.log("🧠 Agent Memory Benchmark\n")

//   // DB bağlantısı
//   const connectionString = process.env.DB_URL || process.env.DATABASE_URL
//   if (!connectionString) {
//     console.error("❌ DB_URL veya DATABASE_URL bulunamadı")
//     process.exit(1)
//   }

//   const client = postgres(connectionString)
//   const db = drizzle(client)

//   // OpenAI client (kendi API key'inle değiştir)
//   const openai = createOpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   })

//   try {
//     // En uzun 10 thread'i bul (20+ mesaj olanlar)
//     console.log("📊 Uzun thread'ler aranıyor...\n")

//     const longThreads = await db
//       .select({
//         threadId: messages.threadId,
//         msgCount: count(messages.id),
//       })
//       .from(messages)
//       .groupBy(messages.threadId)
//       .having(sql`count(*) > 20`)
//       .orderBy(desc(count(messages.id)))
//       .limit(10)

//     if (longThreads.length === 0) {
//       console.log("⚠️ 20+ mesajlı thread bulunamadı")
//       return
//     }

//     console.log(`✅ ${longThreads.length} uzun thread bulundu\n`)

//     const allScores: { rouge1: number; rougeL: number; type: string }[] = []

//     for (const { threadId, msgCount } of longThreads) {
//       if (!threadId) continue

//       console.log(`\n📁 Thread: ${threadId} (${msgCount} mesaj)`)

//       // Thread mesajlarını çek
//       const threadMsgs = await db
//         .select({
//           content: messages.content,
//           type: messages.type,
//           createdOn: messages.createdOn,
//         })
//         .from(messages)
//         .where(eq(messages.threadId, threadId))
//         .orderBy(messages.createdOn)
//         .limit(50)

//       if (threadMsgs.length < 5) continue

//       // Thread geçmişini oluştur
//       const fullHistory = threadMsgs
//         .map((m) => `[${m.type}]: ${m.content?.slice(0, 500) || ""}`)
//         .join("\n\n")

//       // QA pair'ler oluştur
//       const qaPairs: QAPair[] = [
//         {
//           question: "What was discussed in the first 3 messages?",
//           answer: threadMsgs
//             .slice(0, 3)
//             .map((m) => m.content)
//             .join(" ")
//             .slice(0, 800),
//           type: "early",
//         },
//         {
//           question: "What was mentioned in message 5?",
//           answer: threadMsgs[4]?.content?.slice(0, 500) || "",
//           type: "middle",
//         },
//         {
//           question: "What was the last message about?",
//           answer:
//             threadMsgs[threadMsgs.length - 1]?.content?.slice(0, 500) || "",
//           type: "late",
//         },
//         {
//           question: "Summarize the entire conversation in 2 sentences.",
//           answer: fullHistory.slice(0, 1000),
//           type: "summary",
//         },
//       ]

//       for (const qa of qaPairs) {
//         try {
//           // Agent'a sor
//           const { text: agentResponse } = await generateText({
//             model: openai("gpt-4o-mini"),
//             messages: [
//               {
//                 role: "system",
//                 content: `You are a helpful assistant. Use the following conversation context to answer the question accurately.\n\nCONTEXT:\n${fullHistory.slice(0, 8000)}`,
//               },
//               { role: "user", content: qa.question },
//             ],
//             maxTokens: 500,
//           })

//           // ROUGE skoru hesapla
//           const scores = rougeScore(qa.answer, agentResponse)

//           console.log(`   Q [${qa.type}]: ${qa.question.slice(0, 50)}...`)
//           console.log(
//             `   ROUGE-1: ${scores.rouge1.toFixed(3)}, ROUGE-L: ${scores.rougeL.toFixed(3)}`,
//           )

//           allScores.push({
//             rouge1: scores.rouge1,
//             rougeL: scores.rougeL,
//             type: qa.type,
//           })
//         } catch (err) {
//           console.log(`   ❌ Hata: ${(err as Error).message}`)
//         }
//       }
//     }

//     // Sonuçları özetle
//     console.log("\n" + "=".repeat(50))
//     console.log("📊 MEMORY BENCHMARK SONUÇLARI")
//     console.log("=".repeat(50))

//     if (allScores.length > 0) {
//       const avgRouge1 =
//         allScores.reduce((a, s) => a + s.rouge1, 0) / allScores.length
//       const avgRougeL =
//         allScores.reduce((a, s) => a + s.rougeL, 0) / allScores.length

//       // Tip bazında ortalama
//       const byType = allScores.reduce(
//         (acc, s) => {
//           if (!acc[s.type]) acc[s.type] = []
//           acc[s.type].push(s.rouge1)
//           return acc
//         },
//         {} as Record<string, number[]>,
//       )

//       console.log(`\nToplam test: ${allScores.length}`)
//       console.log(`Ortalama ROUGE-1: ${avgRouge1.toFixed(3)}`)
//       console.log(`Ortalama ROUGE-L: ${avgRougeL.toFixed(3)}`)

//       console.log(`\nTipe göre ROUGE-1:`)
//       for (const [type, scores] of Object.entries(byType)) {
//         const avg = scores.reduce((a, b) => a + b, 0) / scores.length
//         console.log(`  ${type.padEnd(10)}: ${avg.toFixed(3)}`)
//       }

//       // Yorum
//       console.log(`\n📝 Yorum:`)
//       if (avgRouge1 > 0.7) {
//         console.log(
//           "   ✅ Mükemmel hafıza! Agent bilgileri çok iyi hatırlıyor.",
//         )
//       } else if (avgRouge1 > 0.5) {
//         console.log("   🟡 Orta düzey hafıza. Bazı bilgiler kaçırılıyor.")
//       } else {
//         console.log(
//           "   🔴 Zayıf hafıza. Agent önemli bilgileri hatırlayamıyor.",
//         )
//       }

//       console.log(`\n💡 İpuçları:`)
//       console.log("   - ROUGE-1 > 0.7: İyi hafıza")
//       console.log(
//         "   - early vs late farkı yüksekse: Context window sorunu var",
//       )
//       console.log("   - summary düşükse: Genel bağlamı yakalayamıyor")
//     } else {
//       console.log("❌ Test sonucu alınamadı")
//     }
//   } finally {
//     await client.end()
//   }
// }

// main().catch(console.error)
