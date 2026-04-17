// /**
//  * Agent Memory Benchmark Tool - REAL DATA
//  *
//  * DB'deki gerçek agent mesajlarını kullanarak memory benchmark yapar.
//  * Her agent mesajı için önceki mesajları context, agent mesajını ground truth olarak alır.
//  *
//  * Kullanım:
//  *   pnpm tsx scripts/benchmark-memory-real.ts
//  */

// import { config } from "dotenv"

// config({ path: ".env" })

// import { and, count, desc, eq, inArray, not, sql } from "drizzle-orm"
// import { drizzle } from "drizzle-orm/postgres-js"
// import postgres from "postgres"
// import { messages, threads } from "../src/schema"

// // ROUGE skoru hesaplama
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

//   // ROUGE-L: Longest Common Subsequence
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

// // Mesaj tipini belirle (user vs assistant)
// function getMessageRole(
//   msg: typeof messages.$inferSelect,
// ): "user" | "assistant" {
//   // AI agent mesajları: agentId dolu ise (userId olabilir veya olmayabilir)
//   if (msg.agentId) {
//     return "assistant"
//   }
//   return "user"
// }

// // Context uzaklığına göre kategori
// function getDistanceCategory(
//   distance: number,
// ): "recent" | "medium" | "far" | "distant" {
//   if (distance <= 3) return "recent"
//   if (distance <= 10) return "medium"
//   if (distance <= 20) return "far"
//   return "distant"
// }

// async function main() {
//   console.log("🧠 Agent Memory Benchmark - REAL DATA\n")
//   console.log("💾 DB'deki gerçek agent mesajları analiz ediliyor...\n")

//   const connectionString = process.env.DB_URL || process.env.DATABASE_URL
//   if (!connectionString) {
//     console.error("❌ DB_URL bulunamadı")
//     process.exit(1)
//   }

//   const client = postgres(connectionString)
//   const db = drizzle(client)

//   try {
//     // En uzun thread'leri bul (en az 10 mesaj)
//     console.log("📊 Uzun thread'ler aranıyor...")

//     const longThreads = await db
//       .select({
//         threadId: messages.threadId,
//         msgCount: count(messages.id),
//       })
//       .from(messages)
//       .groupBy(messages.threadId)
//       .having(sql`count(*) >= 10`)
//       .orderBy(desc(count(messages.id)))
//       .limit(20)

//     if (longThreads.length === 0) {
//       console.log("⚠️ Yeterli mesajlı thread bulunamadı")
//       return
//     }

//     console.log(`✅ ${longThreads.length} thread bulundu\n`)

//     const allScores: {
//       rouge1: number
//       rougeL: number
//       distance: number
//       distanceCategory: string
//       threadId: string
//       msgIndex: number
//     }[] = []

//     let totalAgentMsgs = 0
//     let analyzedAgentMsgs = 0

//     for (const { threadId, msgCount } of longThreads) {
//       if (!threadId) continue

//       // Thread'in tüm mesajlarını çek
//       const threadMsgs = await db
//         .select({
//           id: messages.id,
//           content: messages.content,
//           type: messages.type,
//           createdOn: messages.createdOn,
//           userId: messages.userId,
//           guestId: messages.guestId,
//           agentId: messages.agentId,
//         })
//         .from(messages)
//         .where(eq(messages.threadId, threadId))
//         .orderBy(messages.createdOn)

//       if (threadMsgs.length < 5) continue

//       // Mesajları rolüne göre işaretle
//       const messagesWithRole = threadMsgs.map((m) => ({
//         ...m,
//         role: getMessageRole(m),
//       }))

//       // Agent mesajlarını bul ve her biri için context analizi yap
//       for (let i = 1; i < messagesWithRole.length; i++) {
//         const msg = messagesWithRole[i]

//         if (msg.role !== "assistant") continue
//         if (!msg.content || msg.content.length < 10) continue

//         totalAgentMsgs++

//         // Bu agent mesajından önceki tüm mesajlar = context
//         const contextMessages = messagesWithRole.slice(0, i)
//         const contextText = contextMessages
//           .map((m) => `[${m.role}]: ${m.content?.slice(0, 300) || ""}`)
//           .join("\n\n")

//         // Context'in agent mesajıyla alakasını ölç
//         // Eğer agent gerçekten context'i kullanıyorsa, ROUGE skoru yüksek olmalı
//         // (Aynı konu/kelime geçişleri olmalı)
//         const scores = rougeScore(msg.content, contextText)

//         // Uzaklık kategorisi
//         const distanceCategory = getDistanceCategory(contextMessages.length)

//         allScores.push({
//           rouge1: scores.rouge1,
//           rougeL: scores.rougeL,
//           distance: contextMessages.length,
//           distanceCategory,
//           threadId: threadId.slice(0, 8),
//           msgIndex: i,
//         })

//         analyzedAgentMsgs++
//       }

//       process.stdout.write(`.`) // Progress
//     }

//     console.log(`\n\n✅ Analiz tamamlandı`)
//     console.log(`   Toplam agent mesajı: ${totalAgentMsgs}`)
//     console.log(`   Analiz edilen: ${analyzedAgentMsgs}\n`)

//     if (allScores.length === 0) {
//       console.log("❌ Analiz edilecek agent mesajı bulunamadı")
//       return
//     }

//     // Sonuçları özetle
//     console.log("=".repeat(65))
//     console.log("📊 MEMORY BENCHMARK SONUÇLARI (GERÇEK VERİ)")
//     console.log("=".repeat(65))

//     // Genel istatistikler
//     const avgRouge1 =
//       allScores.reduce((a, s) => a + s.rouge1, 0) / allScores.length
//     const avgRougeL =
//       allScores.reduce((a, s) => a + s.rougeL, 0) / allScores.length
//     const maxRouge1 = Math.max(...allScores.map((s) => s.rouge1))
//     const minRouge1 = Math.min(...allScores.map((s) => s.rouge1))

//     console.log(`\n📈 GENEL İSTATİSTİKLER`)
//     console.log(`   Analiz edilen agent mesajı: ${allScores.length}`)
//     console.log(`   Ortalama ROUGE-1: ${avgRouge1.toFixed(4)}`)
//     console.log(`   Ortalama ROUGE-L: ${avgRougeL.toFixed(4)}`)
//     console.log(
//       `   Min/Max ROUGE-1: ${minRouge1.toFixed(4)} / ${maxRouge1.toFixed(4)}`,
//     )

//     // Mesafe (context uzaklığı) bazında analiz
//     const byDistance = allScores.reduce(
//       (acc, s) => {
//         if (!acc[s.distanceCategory]) acc[s.distanceCategory] = []
//         acc[s.distanceCategory].push(s.rouge1)
//         return acc
//       },
//       {} as Record<string, number[]>,
//     )

//     console.log(`\n📊 CONTEXT UZAKLIĞINA GÖRE ANALİZ`)
//     console.log("   " + "-".repeat(50))
//     console.log("   Kategori   │ Sayı │ Ort. ROUGE-1 │ Değerlendirme")
//     console.log("   " + "-".repeat(50))

//     const categories = [
//       { key: "recent", label: "Recent", desc: "Son 3 mesaj" },
//       { key: "medium", label: "Medium", desc: "4-10 mesaj önce" },
//       { key: "far", label: "Far", desc: "11-20 mesaj önce" },
//       { key: "distant", label: "Distant", desc: "20+ mesaj önce" },
//     ]

//     for (const { key, label, desc } of categories) {
//       const scores = byDistance[key] || []
//       if (scores.length === 0) {
//         console.log(
//           `   ${label.padEnd(10)} │ ${"0".padStart(4)} │ ${"N/A".padStart(12)} │ Veri yok`,
//         )
//         continue
//       }

//       const avg = scores.reduce((a, b) => a + b, 0) / scores.length
//       const bar = "█".repeat(Math.min(20, Math.floor(avg * 100)))

//       let evalText = ""
//       if (avg > 0.15) evalText = "🟢 Güçlü bağlam"
//       else if (avg > 0.08) evalText = "🟡 Orta bağlam"
//       else evalText = "🔴 Zayıf bağlam"

//       console.log(
//         `   ${label.padEnd(10)} │ ${scores.length.toString().padStart(4)} │ ${avg.toFixed(4).padStart(12)} │ ${evalText}`,
//       )
//     }

//     // İstatistiksel analiz
//     console.log(`\n📉 İSTATİSTİKSEL ANALİZ`)

//     const recentScores = byDistance["recent"] || []
//     const distantScores = byDistance["distant"] || []

//     if (recentScores.length > 0 && distantScores.length > 0) {
//       const recentAvg =
//         recentScores.reduce((a, b) => a + b, 0) / recentScores.length
//       const distantAvg =
//         distantScores.reduce((a, b) => a + b, 0) / distantScores.length
//       const diff = recentAvg - distantAvg

//       console.log(`   Recent vs Distant farkı: ${diff.toFixed(4)}`)

//       if (diff > 0.1) {
//         console.log("   ⚠️  Büyük fark: Context window sorunu olabilir!")
//         console.log("      Uzun thread'lerde başlangıç bilgileri kayboluyor.")
//       } else if (diff > 0.05) {
//         console.log("   🟡 Orta fark: Hafif context kaybı var")
//       } else {
//         console.log("   ✅ Düşük fark: Bağlam uzaklığından etkilenmiyor")
//       }
//     }

//     // Yüksek ROUGE örnekleri (iyi context kullanımı)
//     const highRouge = allScores.filter((s) => s.rouge1 > 0.2).slice(0, 5)

//     if (highRouge.length > 0) {
//       console.log(`\n✅ EN İYİ CONTEXT KULLANIMI (${highRouge.length} örnek)`)
//       for (const s of highRouge) {
//         console.log(
//           `   Thread ${s.threadId} [#${s.msgIndex}] ${s.distanceCategory}: ROUGE-1 = ${s.rouge1.toFixed(4)}`,
//         )
//       }
//     }

//     // Düşük ROUGE örnekleri (zayıf context)
//     const lowRouge = allScores
//       .filter((s) => s.rouge1 < 0.05 && s.distanceCategory === "distant")
//       .slice(0, 5)

//     if (lowRouge.length > 0) {
//       console.log(`\n⚠️  ZAYIF CONTEXT KULLANIMI (${lowRouge.length} örnek)`)
//       for (const s of lowRouge) {
//         console.log(
//           `   Thread ${s.threadId} [#${s.msgIndex}] ${s.distanceCategory}: ROUGE-1 = ${s.rouge1.toFixed(4)}`,
//         )
//       }
//     }

//     // Sonuç değerlendirmesi
//     console.log(`\n📝 SONUÇ DEĞERLENDİRMESİ`)

//     if (avgRouge1 > 0.15) {
//       console.log("   🟢 İyi context kullanımı!")
//       console.log("   Agent mesajları önceki konuşmayla tutarlı.")
//     } else if (avgRouge1 > 0.08) {
//       console.log("   🟡 Orta düzey context kullanımı.")
//       console.log("   Bazı agent yanıtları bağlamdan kopuk olabilir.")
//     } else {
//       console.log("   🔴 Zayıf context kullanımı!")
//       console.log("   Agent genellikle önceki konuşmayı dikkate almıyor.")
//     }

//     // Öneriler
//     console.log(`\n💡 ÖNERİLER`)

//     const farScores = byDistance["far"] || []
//     const distantAvg =
//       farScores.length > 0
//         ? farScores.reduce((a, b) => a + b, 0) / farScores.length
//         : 0

//     if (distantAvg < 0.05) {
//       console.log("   • Uzun thread'lerde RAG veya özetleme kullanın")
//       console.log("   • 20+ mesajlı thread'ler için conversation summarization")
//     }

//     if (avgRouge1 < 0.1) {
//       console.log("   • Agent prompt'una 'context'i dikkate al' talimatı ekle")
//       console.log("   • Context window boyutunu kontrol et")
//     }

//     if (byDistance["recent"]?.length > 0) {
//       const recentAvg =
//         byDistance["recent"].reduce((a, b) => a + b, 0) /
//         byDistance["recent"].length
//       if (recentAvg < 0.1) {
//         console.log(
//           "   • Son mesajlarla bile zayıf bağlantı: Prompt engineering gerekli",
//         )
//       }
//     }

//     console.log(
//       `\n✨ Analiz tamamlandı! ${allScores.length} agent mesajı incelendi.`,
//     )
//   } finally {
//     await client.end()
//   }
// }

// main().catch(console.error)
