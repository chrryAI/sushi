// /**
//  * Agent Memory Benchmark Tool - MOCK VERSION
//  *
//  * API key olmadan test etmek için simülasyon versiyonu.
//  * Gerçek agent yanıtlarını simüle eder.
//  *
//  * Kullanım:
//  *   pnpm tsx scripts/benchmark-memory-mock.ts
//  */

// import { config } from "dotenv"

// config({ path: ".env" })

// import { count, desc, eq, sql } from "drizzle-orm"
// import { drizzle } from "drizzle-orm/postgres-js"
// import postgres from "postgres"
// import { messages } from "../src/schema"

// // Basit ROUGE skoru hesaplama
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

//   const refSet = new Set(refWords)
//   const candSet = new Set(candWords)
//   const overlap = [...refSet].filter((w) => candSet.has(w)).length
//   const rouge1 = overlap / refSet.size

//   // LCS hesaplama
//   const m = refWords.length,
//     n = candWords.length
//   const dp: number[][] = Array(m + 1)
//     .fill(null)
//     .map(() => Array(n + 1).fill(0))
//   for (let i = 1; i <= m; i++) {
//     for (let j = 1; j <= n; j++) {
//       if (refWords[i - 1] === candWords[j - 1]) {
//         dp[i][j] = dp[i - 1][j - 1] + 1
//       } else {
//         dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
//       }
//     }
//   }
//   const rougeL = dp[m][n] / refWords.length

//   return { rouge1, rougeL }
// }

// // Mock agent yanıtı üret (gerçekçi simülasyon)
// function mockAgentResponse(
//   question: string,
//   context: string,
//   qaType: string,
// ): string {
//   const words = context.split(/\s+/).filter((w) => w.length > 3)

//   // QA tipine göre başarı oranı (gerçekçi: early < late)
//   const recallRates: Record<string, number> = {
//     early: 0.4, // Başlangıç zor hatırlanır
//     middle: 0.65, // Orta düzey
//     late: 0.85, // Son mesajlar kolay
//     summary: 0.6, // Özet orta
//   }

//   const recallRate = recallRates[qaType] || 0.5
//   const numWords = Math.max(10, Math.floor(words.length * recallRate * 0.3))

//   // Rastgele kelime seç ama sıralı olsun
//   const selectedWords: string[] = []
//   const step = Math.max(1, Math.floor(words.length / numWords))
//   for (
//     let i = 0;
//     i < words.length && selectedWords.length < numWords;
//     i += step
//   ) {
//     if (Math.random() < recallRate) {
//       selectedWords.push(words[i])
//     }
//   }

//   // Yanıt formatı
//   if (qaType === "summary") {
//     return `The conversation discusses ${selectedWords.slice(0, 8).join(", ")}. It covers various topics related to the main theme.`
//   }

//   return selectedWords.join(" ") + "."
// }

// interface QAPair {
//   question: string
//   answer: string
//   type: "early" | "middle" | "late" | "summary"
// }

// async function main() {
//   console.log("🧠 Agent Memory Benchmark - MOCK MODE\n")
//   console.log(
//     "⚠️  Bu simülasyon versiyonudur. Gerçek AI API'si kullanılmıyor.\n",
//   )

//   const connectionString = process.env.DB_URL || process.env.DATABASE_URL
//   if (!connectionString) {
//     console.error("❌ DB_URL bulunamadı")
//     process.exit(1)
//   }

//   const client = postgres(connectionString)
//   const db = drizzle(client)

//   try {
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

//       console.log(`\n📁 Thread: ${threadId.slice(0, 8)}... (${msgCount} mesaj)`)

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

//       const fullHistory = threadMsgs
//         .map((m) => `[${m.type}]: ${m.content?.slice(0, 500) || ""}`)
//         .join("\n\n")

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
//         // Mock yanıt üret
//         const agentResponse = mockAgentResponse(qa.question, qa.answer, qa.type)

//         // ROUGE skoru hesapla
//         const scores = rougeScore(qa.answer, agentResponse)

//         console.log(
//           `   Q [${qa.type.padEnd(7)}]: ${qa.question.slice(0, 45)}...`,
//         )
//         console.log(
//           `      ROUGE-1: ${scores.rouge1.toFixed(3)} | ROUGE-L: ${scores.rougeL.toFixed(3)}`,
//         )

//         allScores.push({
//           rouge1: scores.rouge1,
//           rougeL: scores.rougeL,
//           type: qa.type,
//         })
//       }
//     }

//     // Sonuçları özetle
//     console.log("\n" + "=".repeat(60))
//     console.log("📊 MEMORY BENCHMARK SONUÇLARI (MOCK)")
//     console.log("=".repeat(60))

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

//       console.log(`\n📈 GENEL İSTATİSTİKLER`)
//       console.log(`   Toplam test: ${allScores.length}`)
//       console.log(`   Ortalama ROUGE-1: ${avgRouge1.toFixed(3)}`)
//       console.log(`   Ortalama ROUGE-L: ${avgRougeL.toFixed(3)}`)

//       console.log(`\n📊 TİPE GÖRE ROUGE-1 (HAFIZA ANALİZİ)`)
//       console.log("   " + "-".repeat(40))

//       const sortedTypes = ["early", "middle", "late", "summary"]
//       for (const type of sortedTypes) {
//         const scores = byType[type] || []
//         if (scores.length === 0) continue
//         const avg = scores.reduce((a, b) => a + b, 0) / scores.length
//         const bar = "█".repeat(Math.floor(avg * 20))
//         const color = avg > 0.7 ? "🟢" : avg > 0.5 ? "🟡" : "🔴"
//         console.log(`   ${type.padEnd(7)} ${color} ${avg.toFixed(3)} ${bar}`)
//       }

//       // Yorum
//       console.log(`\n📝 DEĞERLENDİRME`)
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

//       // Context window analizi
//       const earlyAvg =
//         byType["early"]?.reduce((a, b) => a + b, 0) / byType["early"]?.length ||
//         0
//       const lateAvg =
//         byType["late"]?.reduce((a, b) => a + b, 0) / byType["late"]?.length || 0

//       console.log(`\n🔍 CONTEXT WINDOW ANALİZİ`)
//       console.log(`   Early (başlangıç): ${earlyAvg.toFixed(3)}`)
//       console.log(`   Late (son mesaj):  ${lateAvg.toFixed(3)}`)
//       console.log(
//         `   Fark: ${(lateAvg - earlyAvg).toFixed(3)} ${lateAvg > earlyAvg ? "📉" : "📈"}`,
//       )

//       if (lateAvg - earlyAvg > 0.3) {
//         console.log(
//           "   ⚠️  Büyük fark: Context window veya RAG sorunu olabilir!",
//         )
//       }

//       console.log(`\n💡 TAVSİYELER`)
//       if (earlyAvg < 0.5) {
//         console.log(
//           "   • Early memory zayıf: Başlangıç mesajlarını özetle/sakla",
//         )
//       }
//       if (
//         byType["summary"]?.reduce((a, b) => a + b, 0) /
//           byType["summary"]?.length <
//         0.5
//       ) {
//         console.log(
//           "   • Summary düşük: Semantic chunking veya embedding kalitesi",
//         )
//       }
//       console.log("   • ROUGE-1 > 0.7 iyi hafıza gösterir")
//       console.log("   • Gerçek test için: pnpm tsx scripts/benchmark-memory.ts")
//     } else {
//       console.log("❌ Test sonucu alınamadı")
//     }
//   } finally {
//     await client.end()
//   }
// }

// main().catch(console.error)
