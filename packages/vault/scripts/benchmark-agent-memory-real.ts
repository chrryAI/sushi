// /**
//  * 🔥 REAL AGENT MEMORY BENCHMARK
//  *
//  * Gerçek kullanıcı-agent diyaloğunu analiz eder:
//  * 1. Thread'deki kullanıcı mesajını bulur
//  * 2. O mesajdan ÖNCEKİ tüm mesajları context olarak alır
//  * 3. Bu context'e göre yeni bir yanıt üretir (mock veya real API)
//  * 4. Thread'deki GERÇEK agent yanıtı ile karşılaştırır
//  * 5. ROUGE skoru hesaplar
//  *
//  * Bu benchmark, agent'ın gerçekten ne kadar context hatırladığını ölçer.
//  */

// import { config } from "dotenv"

// config({ path: ".env" })

// import { createOpenAI } from "@ai-sdk/openai"
// import { generateText } from "ai"
// import postgres from "postgres"

// const fmt = (n: number) => n?.toFixed(3) || "0.000"

// // ROUGE-LCS hesaplama
// function rougeL(reference: string, candidate: string): number {
//   const ref = reference
//     .toLowerCase()
//     .split(/\s+/)
//     .filter((w) => w.length > 0)
//   const cand = candidate
//     .toLowerCase()
//     .split(/\s+/)
//     .filter((w) => w.length > 0)

//   if (ref.length === 0 || cand.length === 0) return 0

//   const m = ref.length,
//     n = cand.length
//   const dp = Array(m + 1)
//     .fill(null)
//     .map(() => Array(n + 1).fill(0))

//   for (let i = 1; i <= m; i++) {
//     for (let j = 1; j <= n; j++) {
//       if (ref[i - 1] === cand[j - 1]) {
//         dp[i][j] = dp[i - 1][j - 1] + 1
//       } else {
//         dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
//       }
//     }
//   }

//   return dp[m][n] / ref.length
// }

// // ROUGE-1 hesaplama
// function rouge1(reference: string, candidate: string): number {
//   const ref = new Set(
//     reference
//       .toLowerCase()
//       .split(/\s+/)
//       .filter((w) => w.length > 0),
//   )
//   const cand = new Set(
//     candidate
//       .toLowerCase()
//       .split(/\s+/)
//       .filter((w) => w.length > 0),
//   )

//   if (ref.size === 0) return 0

//   const overlap = [...ref].filter((w) => cand.has(w)).length
//   return overlap / ref.size
// }

// // Kullanıcı mesajı mı?
// function isUserMessage(msg: any): boolean {
//   return (msg.userId !== null || msg.guestId !== null) && msg.agentId === null
// }

// // Agent mesajı mı?
// function isAgentMessage(msg: any): boolean {
//   return msg.agentId !== null
// }

// async function main() {
//   console.log("🔥 REAL AGENT MEMORY BENCHMARK")
//   console.log("=".repeat(70))
//   console.log("Gerçek kullanıcı-agent diyaloğu analizi\n")

//   const client = postgres(process.env.DB_URL!)

//   // OpenAI client (real mode için)
//   const openai = process.env.OPENAI_API_KEY
//     ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
//     : null

//   const USE_REAL_API = process.env.USE_REAL_API === "true" && openai !== null

//   console.log(
//     `Mode: ${USE_REAL_API ? "🤖 REAL API" : "🔮 MOCK (simulation)"}\n`,
//   )

//   try {
//     // Uzun thread'leri bul (en az 10 mesaj, user ve agent mesajları olan)
//     console.log("📊 Analyzing threads with real user-agent conversations...\n")

//     const threads = await client`
//       SELECT
//         m."threadId",
//         COUNT(*) as msg_count,
//         COUNT(CASE WHEN m."userId" IS NOT NULL OR m."guestId" IS NOT NULL THEN 1 END) as user_msgs,
//         COUNT(CASE WHEN m."agentId" IS NOT NULL THEN 1 END) as agent_msgs
//       FROM messages m
//       WHERE m."threadId" IS NOT NULL
//       GROUP BY m."threadId"
//       HAVING COUNT(*) >= 10
//         AND COUNT(CASE WHEN m."userId" IS NOT NULL OR m."guestId" IS NOT NULL THEN 1 END) >= 3
//         AND COUNT(CASE WHEN m."agentId" IS NOT NULL THEN 1 END) >= 3
//       ORDER BY COUNT(*) DESC
//       LIMIT 15
//     `

//     console.log(`Found ${threads.length} threads with real conversations\n`)

//     const results: Array<{
//       threadId: string
//       contextSize: number
//       userQuestion: string
//       realAnswer: string
//       generatedAnswer: string
//       rouge1: number
//       rougeL: number
//       latency: number
//     }> = []

//     for (const thread of threads) {
//       const threadId = thread.threadId

//       // Thread'in tüm mesajlarını çek
//       const messages = await client`
//         SELECT
//           id,
//           content,
//           "agentId",
//           "userId",
//           "guestId",
//           "createdOn",
//           type
//         FROM messages
//         WHERE "threadId" = ${threadId}
//         ORDER BY "createdOn" ASC
//       `

//       // User mesajları ve sonrasındaki agent yanıtlarını bul
//       for (let i = 1; i < messages.length - 1; i++) {
//         const currentMsg = messages[i]
//         const nextMsg = messages[i + 1]

//         // Kullanıcı mesajı mı kontrol et
//         if (!isUserMessage(currentMsg)) continue
//         // Sonraki mesaj agent mesajı mı kontrol et
//         if (!isAgentMessage(nextMsg)) continue

//         const userQuestion = currentMsg.content || ""
//         const realAgentAnswer = nextMsg.content || ""

//         // Çok kısa mesajları atla
//         if (userQuestion.length < 10 || realAgentAnswer.length < 20) continue

//         // Context: Bu mesajdan ÖNCEKİ tüm mesajlar
//         const contextMessages = messages.slice(0, i)
//         const context = contextMessages
//           .map((m) => {
//             const role = isUserMessage(m)
//               ? "User"
//               : isAgentMessage(m)
//                 ? "Assistant"
//                 : "System"
//             return `[${role}]: ${m.content?.slice(0, 500) || ""}`
//           })
//           .join("\n\n")

//         console.log(
//           `\n📁 Thread: ${threadId.slice(0, 8)}... | Context: ${contextMessages.length} msgs`,
//         )
//         console.log(`🙋 User: "${userQuestion.slice(0, 60)}..."`)

//         // Yeni yanıt üret (mock veya real)
//         const startTime = Date.now()
//         let generatedAnswer: string

//         if (USE_REAL_API) {
//           try {
//             const { text } = await generateText({
//               model: openai("gpt-4o-mini"),
//               messages: [
//                 {
//                   role: "system",
//                   content: `You are a helpful AI assistant. Use the following conversation context to answer accurately.\n\nCONTEXT:\n${context.slice(0, 8000)}`,
//                 },
//                 { role: "user", content: userQuestion },
//               ],
//               maxTokens: 1000,
//               temperature: 0.7,
//             })
//             generatedAnswer = text
//           } catch (e) {
//             console.log(`   ⚠️ API error: ${(e as Error).message}, using mock`)
//             generatedAnswer = generateMockResponse(context, userQuestion)
//           }
//         } else {
//           generatedAnswer = generateMockResponse(context, userQuestion)
//         }

//         const latency = Date.now() - startTime

//         // ROUGE skorları hesapla
//         const r1 = rouge1(realAgentAnswer, generatedAnswer)
//         const rL = rougeL(realAgentAnswer, generatedAnswer)

//         console.log(`🤖 Real:    "${realAgentAnswer.slice(0, 60)}..."`)
//         console.log(`📝 Generated: "${generatedAnswer.slice(0, 60)}..."`)
//         console.log(
//           `📊 ROUGE-1: ${fmt(r1)} | ROUGE-L: ${fmt(rL)} | Latency: ${latency}ms`,
//         )

//         results.push({
//           threadId,
//           contextSize: contextMessages.length,
//           userQuestion,
//           realAnswer: realAgentAnswer,
//           generatedAnswer,
//           rouge1: r1,
//           rougeL: rL,
//           latency,
//         })

//         // Her thread'den maksimum 3 örnek al
//         const threadResults = results.filter((r) => r.threadId === threadId)
//         if (threadResults.length >= 3) break
//       }

//       // İlerleme göster
//       process.stdout.write(".")
//     }

//     console.log("\n\n" + "=".repeat(70))
//     console.log("📊 BENCHMARK RESULTS")
//     console.log("=".repeat(70))

//     if (results.length === 0) {
//       console.log("❌ No valid user-agent pairs found")
//       return
//     }

//     // Genel istatistikler
//     const avgRouge1 = results.reduce((a, r) => a + r.rouge1, 0) / results.length
//     const avgRougeL = results.reduce((a, r) => a + r.rougeL, 0) / results.length
//     const avgLatency =
//       results.reduce((a, r) => a + r.latency, 0) / results.length

//     console.log(`\n📈 Overall Statistics (${results.length} samples):`)
//     console.log(`   Average ROUGE-1: ${fmt(avgRouge1)}`)
//     console.log(`   Average ROUGE-L: ${fmt(avgRougeL)}`)
//     console.log(`   Average Latency: ${avgLatency.toFixed(0)}ms`)

//     // Context uzaklığına göre analiz
//     const byContext = results.reduce(
//       (acc, r) => {
//         const cat =
//           r.contextSize <= 3
//             ? "Recent (≤3)"
//             : r.contextSize <= 10
//               ? "Medium (4-10)"
//               : r.contextSize <= 20
//                 ? "Far (11-20)"
//                 : "Distant (20+)"
//         if (!acc[cat]) acc[cat] = []
//         acc[cat].push(r.rouge1)
//         return acc
//       },
//       {} as Record<string, number[]>,
//     )

//     console.log(`\n📊 Context Distance Analysis:`)
//     for (const [cat, scores] of Object.entries(byContext)) {
//       const avg = scores.reduce((a, b) => a + b, 0) / scores.length
//       const bar = "█".repeat(Math.floor(avg * 20))
//       const status = avg > 0.5 ? "🟢" : avg > 0.3 ? "🟡" : "🔴"
//       console.log(`   ${cat.padEnd(16)} ${fmt(avg)} ${status} ${bar}`)
//     }

//     // En iyi ve en kötü örnekler
//     const sorted = [...results].sort((a, b) => b.rouge1 - a.rouge1)

//     console.log(`\n✅ Top 3 Best Memory (High ROUGE-1):`)
//     for (let i = 0; i < Math.min(3, sorted.length); i++) {
//       const r = sorted[i]
//       console.log(
//         `   ${i + 1}. Thread ${r.threadId.slice(0, 8)} (ctx:${r.contextSize.toString().padStart(2)}) R1:${fmt(r.rouge1)} RL:${fmt(r.rougeL)}`,
//       )
//     }

//     console.log(`\n⚠️  Bottom 3 Worst Memory (Low ROUGE-1):`)
//     for (let i = 0; i < Math.min(3, sorted.length); i++) {
//       const r = sorted[sorted.length - 1 - i]
//       console.log(
//         `   ${i + 1}. Thread ${r.threadId.slice(0, 8)} (ctx:${r.contextSize.toString().padStart(2)}) R1:${fmt(r.rouge1)} RL:${fmt(r.rougeL)}`,
//       )
//     }

//     // Özet
//     console.log(`\n📝 Summary:`)
//     if (avgRouge1 > 0.5) {
//       console.log(
//         `   🟢 EXCELLENT - Agent maintains strong context correlation`,
//       )
//     } else if (avgRouge1 > 0.3) {
//       console.log(`   🟡 GOOD - Moderate context retention`)
//     } else {
//       console.log(`   🔴 NEEDS IMPROVEMENT - Weak context correlation`)
//     }

//     const recent = byContext["Recent (≤3)"] || []
//     const distant = byContext["Distant (20+)"] || []
//     if (recent.length && distant.length) {
//       const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
//       const distantAvg = distant.reduce((a, b) => a + b, 0) / distant.length
//       const diff = recentAvg - distantAvg

//       console.log(`\n   Context Retention Analysis:`)
//       console.log(`      Recent avg:  ${fmt(recentAvg)}`)
//       console.log(`      Distant avg: ${fmt(distantAvg)}`)
//       console.log(
//         `      Difference:  ${fmt(diff)} ${diff > 0.2 ? "⚠️ Significant context loss" : "✅ Stable"}`,
//       )
//     }

//     console.log(`\n💡 For Optuna Optimization:`)
//     console.log(`   Target ROUGE-1: > 0.70`)
//     console.log(`   Current: ${fmt(avgRouge1)}`)
//     console.log(`   Gap: ${fmt(Math.max(0, 0.7 - avgRouge1))}`)
//   } finally {
//     await client.end()
//   }
// }

// // Mock yanıt üretici
// function generateMockResponse(context: string, question: string): string {
//   // Context'ten anahtar kelimeler çıkar
//   const words = context.split(/\s+/).filter((w) => w.length > 4)
//   const uniqueWords = [...new Set(words)].slice(0, 20)

//   // Soru tipine göre yanıt
//   if (question.toLowerCase().includes("how")) {
//     return `Based on the previous conversation, here's how you can approach this: ${uniqueWords.slice(0, 8).join(", ")}. This should help you achieve your goal.`
//   } else if (question.toLowerCase().includes("what")) {
//     return `From our discussion, ${uniqueWords.slice(0, 6).join(" ")} are the key aspects to consider.`
//   } else {
//     return `Looking at the context: ${uniqueWords.slice(0, 10).join(" ")}. This relates to your question about ${question.slice(0, 30)}.`
//   }
// }

// main().catch(console.error)
