// /**
//  * 🔍 COMPREHENSIVE INTELLIGENCE REPORT (Optimized)
//  */

// import { config } from "dotenv"

// config({ path: ".env" })

// import postgres from "postgres"

// const fmt = (n: number) =>
//   n?.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) || "0"
// const pct = (n: number) => `${((n || 0) * 100).toFixed(1)}%`

// async function main() {
//   console.log(
//     "╔════════════════════════════════════════════════════════════════╗",
//   )
//   console.log(
//     "║     🔍 COMPREHENSIVE INTELLIGENCE REPORT                       ║",
//   )
//   console.log(
//     "║     Agent Memory & Content Analysis                            ║",
//   )
//   console.log(
//     "╚════════════════════════════════════════════════════════════════╝\n",
//   )

//   const client = postgres(process.env.DB_URL!)

//   try {
//     // SECTION 1: DATABASE OVERVIEW
//     console.log("\n📊 SECTION 1: DATABASE OVERVIEW")
//     console.log("─".repeat(65))

//     const [overview] = await client`
//       SELECT
//         (SELECT COUNT(*) FROM messages) as total_messages,
//         (SELECT COUNT(*) FROM threads) as total_threads,
//         (SELECT COUNT(*) FROM "tribePosts") as total_tribe_posts,
//         (SELECT COUNT(*) FROM "tribeComments") as total_tribe_comments,
//         (SELECT COUNT(*) FROM "user") as total_users,
//         (SELECT COUNT(*) FROM guest) as total_guests,
//         (SELECT COUNT(DISTINCT "agentId") FROM messages WHERE "agentId" IS NOT NULL) as active_agents
//     `

//     console.log(
//       `   Total Messages:        ${Number(overview.total_messages).toLocaleString()}`,
//     )
//     console.log(
//       `   Total Threads:         ${Number(overview.total_threads).toLocaleString()}`,
//     )
//     console.log(
//       `   Total Tribe Posts:     ${Number(overview.total_tribe_posts).toLocaleString()}`,
//     )
//     console.log(
//       `   Total Tribe Comments:  ${Number(overview.total_tribe_comments).toLocaleString()}`,
//     )
//     console.log(
//       `   Total Users:           ${Number(overview.total_users).toLocaleString()}`,
//     )
//     console.log(
//       `   Total Guests:          ${Number(overview.total_guests).toLocaleString()}`,
//     )
//     console.log(`   Active AI Agents:      ${overview.active_agents}`)

//     // SECTION 2: MESSAGES
//     console.log("\n💬 SECTION 2: MESSAGES ANALYSIS")
//     console.log("─".repeat(65))

//     const [msgStats] = await client`
//       SELECT
//         COUNT(*) as total,
//         COUNT(CASE WHEN "agentId" IS NOT NULL THEN 1 END) as agent_msgs,
//         COUNT(CASE WHEN "userId" IS NOT NULL THEN 1 END) as user_msgs,
//         COUNT(CASE WHEN "guestId" IS NOT NULL THEN 1 END) as guest_msgs,
//         COUNT(CASE WHEN "isTribe" = true THEN 1 END) as tribe_msgs,
//         AVG(LENGTH(content))::int as avg_length,
//         MAX(LENGTH(content)) as max_length
//       FROM messages
//     `

//     if (!msgStats) return

//     const total = Number(msgStats.total)
//     console.log(`   Distribution:`)
//     console.log(
//       `      🤖 Agent:  ${Number(msgStats.agent_msgs).toLocaleString()} (${pct(Number(msgStats.agent_msgs) / total)})`,
//     )
//     console.log(
//       `      👤 Users:  ${Number(msgStats.user_msgs).toLocaleString()} (${pct(Number(msgStats.user_msgs) / total)})`,
//     )
//     console.log(
//       `      👥 Guests: ${Number(msgStats.guest_msgs).toLocaleString()} (${pct(Number(msgStats.guest_msgs) / total)})`,
//     )
//     console.log(
//       `      🏘️  Tribe:  ${Number(msgStats.tribe_msgs).toLocaleString()} (${pct(Number(msgStats.tribe_msgs) / total)})`,
//     )
//     console.log(
//       `\n   Content: Avg ${fmt(Number(msgStats.avg_length))} chars, Max ${Number(msgStats.max_length).toLocaleString()} chars`,
//     )

//     // SECTION 3: THREADS
//     console.log("\n🧵 SECTION 3: THREAD ANALYSIS")
//     console.log("─".repeat(65))

//     const [threadStats] = await client`
//       SELECT
//         COUNT(*) as thread_count,
//         AVG(msg_count)::numeric(10,2) as avg_messages,
//         MAX(msg_count) as max_messages
//       FROM (
//         SELECT "threadId", COUNT(*) as msg_count
//         FROM messages WHERE "threadId" IS NOT NULL
//         GROUP BY "threadId"
//       ) t
//     `

//     const threadSizes = await client`
//       SELECT
//         CASE
//           WHEN msg_count = 1 THEN '1 (Single)'
//           WHEN msg_count <= 5 THEN '2-5 (Short)'
//           WHEN msg_count <= 20 THEN '6-20 (Medium)'
//           WHEN msg_count <= 50 THEN '21-50 (Long)'
//           ELSE '50+ (Epic)'
//         END as category,
//         COUNT(*) as cnt
//       FROM (
//         SELECT "threadId", COUNT(*) as msg_count
//         FROM messages WHERE "threadId" IS NOT NULL
//         GROUP BY "threadId"
//       ) t
//       GROUP BY 1
//       ORDER BY MIN(msg_count)
//     `

//     if (!threadStats) {
//       throw new Error("OOps")
//     }

//     console.log(
//       `   Threads: ${Number(threadStats.thread_count).toLocaleString()}, Avg: ${threadStats.avg_messages} msgs, Max: ${threadStats.max_messages}`,
//     )
//     console.log(`\n   Distribution:`)
//     for (const row of threadSizes) {
//       const bar = "█".repeat(Math.min(20, Math.floor(Number(row.cnt) / 50)))
//       console.log(
//         `      ${row.category.padEnd(15)} ${Number(row.cnt).toString().padStart(4)} ${bar}`,
//       )
//     }

//     // SECTION 4: AGENT PERFORMANCE
//     console.log("\n🧠 SECTION 4: AGENT PERFORMANCE & MEMORY")
//     console.log("─".repeat(65))

//     const agentStats = await client`
//       SELECT
//         a.id,
//         a.name,
//         COUNT(m.id) as msg_count,
//         AVG(LENGTH(m.content))::int as avg_len
//       FROM agents a
//       JOIN messages m ON m."agentId" = a.id
//       GROUP BY a.id, a.name
//       ORDER BY COUNT(m.id) DESC
//       LIMIT 8
//     `

//     console.log(`   Top Agents:`)
//     console.log(`      Name                 Msgs    Avg Length`)
//     console.log(`      ──────────────────────────────────────`)
//     for (const a of agentStats) {
//       const name = String(a.name || "Unknown")
//         .slice(0, 20)
//         .padEnd(20)
//       console.log(
//         `      ${name} ${Number(a.msg_count).toString().padStart(5)}  ${fmt(Number(a.avg_len)).padStart(7)} chars`,
//       )
//     }

//     // Context depth analysis - simplified
//     const contextStats = await client`
//       SELECT
//         CASE
//           WHEN context_size <= 3 THEN 'Recent (≤3)'
//           WHEN context_size <= 10 THEN 'Medium (4-10)'
//           WHEN context_size <= 20 THEN 'Far (11-20)'
//           ELSE 'Distant (20+)'
//         END as category,
//         COUNT(*) as cnt,
//         AVG(LENGTH(content))::int as avg_len
//       FROM (
//         SELECT
//           m.content,
//           ROW_NUMBER() OVER (PARTITION BY m."threadId" ORDER BY m."createdOn") as context_size
//         FROM messages m
//         WHERE m."agentId" IS NOT NULL AND m."threadId" IS NOT NULL
//       ) ranked
//       GROUP BY 1
//       ORDER BY MIN(context_size)
//     `

//     console.log(`\n   Context Distance Analysis:`)
//     for (const row of contextStats) {
//       const bar = "█".repeat(Math.min(15, Math.floor(Number(row.cnt) / 100)))
//       const status =
//         Number(row.avg_len) > 300
//           ? "🟢"
//           : Number(row.avg_len) > 150
//             ? "🟡"
//             : "🔴"
//       console.log(
//         `      ${row.category.padEnd(16)} ${Number(row.cnt).toString().padStart(5)} ${status} ${bar}`,
//       )
//     }

//     // SECTION 5: TRIBE
//     console.log("\n🏘️  SECTION 5: TRIBE ECOSYSTEM")
//     console.log("─".repeat(65))

//     const [tribeStats] = await client`
//       SELECT
//         (SELECT COUNT(*) FROM "tribePosts") as posts,
//         (SELECT COUNT(*) FROM "tribeComments") as comments,
//         (SELECT COUNT(*) FROM "tribeLikes") as likes,
//         (SELECT COUNT(DISTINCT "userId") FROM "tribePosts") as unique_posters,
//         (SELECT AVG(LENGTH(content))::int FROM "tribePosts") as avg_post_len,
//         (SELECT AVG(LENGTH(content))::int FROM "tribeComments") as avg_comment_len
//     `

//     if (!tribeStats) {
//       throw new Error("Oops")
//     }

//     const posts = Number(tribeStats.posts)
//     const engagement =
//       posts > 0
//         ? (Number(tribeStats.comments) + Number(tribeStats.likes)) / posts
//         : 0

//     console.log(`   Content:`)
//     console.log(`      📰 Posts:    ${posts.toLocaleString()}`)
//     console.log(
//       `      💬 Comments: ${Number(tribeStats.comments).toLocaleString()}`,
//     )
//     console.log(
//       `      ❤️  Likes:    ${Number(tribeStats.likes).toLocaleString()}`,
//     )
//     console.log(
//       `\n   Engagement Rate: ${engagement.toFixed(2)} interactions/post`,
//     )
//     console.log(
//       `   Content Length: Posts ${fmt(Number(tribeStats.avg_post_len))} chars, Comments ${fmt(Number(tribeStats.avg_comment_len))} chars`,
//     )

//     // Top tribe posts
//     const topPosts = await client`
//       SELECT
//         LEFT(p.content, 55) as preview,
//         p."likesCount",
//         COUNT(c.id) as comments
//       FROM "tribePosts" p
//       LEFT JOIN "tribeComments" c ON c."postId" = p.id
//       GROUP BY p.id, p.content, p."likesCount"
//       ORDER BY (p."likesCount" + COUNT(c.id)) DESC
//       LIMIT 5
//     `

//     console.log(`\n   🔥 Top 5 Posts:`)
//     for (let i = 0; i < topPosts.length; i++) {
//       const p = topPosts[i]
//       if (!p) return
//       const text = String(p.preview || "")
//         .replace(/\n/g, " ")
//         .slice(0, 50)
//         .padEnd(50)
//       console.log(`      ${i + 1}. ${text} ❤️${p.likesCount} 💬${p.comments}`)
//     }

//     // SECTION 6: TEMPORAL
//     console.log("\n📅 SECTION 6: LAST 14 DAYS ACTIVITY")
//     console.log("─".repeat(65))

//     const temporal = await client`
//       SELECT
//         DATE_TRUNC('day', "createdOn")::date as day,
//         COUNT(*) as msgs,
//         COUNT(CASE WHEN "agentId" IS NOT NULL THEN 1 END) as agent
//       FROM messages
//       WHERE "createdOn" > NOW() - INTERVAL '14 days'
//       GROUP BY 1
//       ORDER BY 1 DESC
//       LIMIT 14
//     `

//     console.log(`   Date         Msgs  🤖%   Chart`)
//     console.log(`   ────────────────────────────────────────`)
//     for (const row of temporal) {
//       const date = new Date(row.day).toLocaleDateString("tr-TR", {
//         month: "short",
//         day: "numeric",
//       })
//       const agentPct =
//         Number(row.msgs) > 0
//           ? Math.round((Number(row.agent) / Number(row.msgs)) * 100)
//           : 0
//       const bar = "█".repeat(Math.min(15, Math.floor(Number(row.msgs) / 30)))
//       console.log(
//         `   ${date.padEnd(12)} ${Number(row.msgs).toString().padStart(4)}  ${agentPct.toString().padStart(2)}%  ${bar}`,
//       )
//     }

//     if (!msgStats) {
//       return
//     }

//     // SECTION 7: INSIGHTS
//     console.log("\n💡 SECTION 7: KEY INSIGHTS & RECOMMENDATIONS")
//     console.log("─".repeat(65))

//     const agentRatio = Number(msgStats.agent_msgs) / total

//     console.log(`   📊 Findings:`)
//     console.log(
//       `      • Agent/User Ratio: ${(agentRatio * 100).toFixed(1)}% ${agentRatio > 0.5 ? "(Agent-dominant)" : "(User-dominant)"}`,
//     )
//     console.log(
//       `      • Thread Health: ${threadStats.max_messages > 100 ? "⚠️ Long threads need attention" : "✅ Good"}`,
//     )
//     console.log(
//       `      • Tribe Activity: ${engagement > 2 ? "🌟 High engagement" : engagement > 0.5 ? "🟡 Moderate" : "⚠️ Low engagement"}`,
//     )
//     console.log(
//       `      • Content Volume: ${Number(msgStats.avg_length) > 1000 ? "📄 Long-form content" : "💬 Short-form content"}`,
//     )

//     console.log(`\n   🎯 Recommendations:`)
//     console.log(
//       `      ${Number(threadStats.max_messages) > 50 ? "⚠️" : "✅"} ${Number(threadStats.max_messages) > 50 ? "Implement RAG for long threads" : "Thread sizes are optimal"}`,
//     )
//     console.log(
//       `      ${agentRatio < 0.3 ? "💡" : "✅"} ${agentRatio < 0.3 ? "Increase agent proactive engagement" : "Agent engagement is good"}`,
//     )
//     console.log(
//       `      ${posts > 100 && Number(tribeStats.comments) < posts ? "📣" : "✅"} ${posts > 100 && Number(tribeStats.comments) < posts ? "Encourage tribe commenting" : "Tribe engagement is good"}`,
//     )
//     console.log(
//       `      🔍 Add agent response quality metrics (ROUGE, human eval)`,
//     )
//     console.log(`      🔍 Implement memory benchmark automation`)

//     // Memory Health Score
//     console.log(`\n   🧠 Memory Health Score:`)
//     const [memoryStats] = await client`
//       SELECT
//         AVG(CASE WHEN msg_count > 20 THEN avg_len END)::int as long_thread_avg,
//         AVG(CASE WHEN msg_count <= 5 THEN avg_len END)::int as short_thread_avg
//       FROM (
//         SELECT "threadId", COUNT(*) as msg_count, AVG(LENGTH(content)) as avg_len
//         FROM messages WHERE "threadId" IS NOT NULL
//         GROUP BY "threadId"
//       ) t
//     `
//     if (!memoryStats) {
//       throw new Error("Oops")
//     }

//     const longAvg = Number(memoryStats.long_thread_avg) || 0
//     const shortAvg = Number(memoryStats.short_thread_avg) || 0
//     const ratio = shortAvg > 0 ? longAvg / shortAvg : 0

//     console.log(`      Long thread avg:  ${fmt(longAvg)} chars/msg`)
//     console.log(`      Short thread avg: ${fmt(shortAvg)} chars/msg`)
//     console.log(`      Retention ratio:  ${ratio.toFixed(2)}`)

//     if (ratio > 0.8) {
//       console.log(
//         `      🟢 EXCELLENT - Strong context retention in long threads`,
//       )
//     } else if (ratio > 0.5) {
//       console.log(`      🟡 GOOD - Some context degradation in longer threads`)
//     } else {
//       console.log(
//         `      🔴 NEEDS ATTENTION - Significant context loss detected`,
//       )
//     }

//     // FOOTER
//     console.log("\n" + "═".repeat(65))
//     console.log("                 📊 REPORT COMPLETE")
//     console.log("═".repeat(65))
//     console.log(`\nGenerated: ${new Date().toLocaleString("tr-TR")}`)
//   } finally {
//     await client.end()
//   }
// }

// main().catch(console.error)
