/**
 * DASHBOARD - System Overview
 * Shows BAM, STRIKE, Memory, and Learning Loop stats in one place
 */

import { FalkorDB } from "falkordb";

let db = null;

async function initDashboard() {
  if (db) return;

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  });
  console.log("📊 DASHBOARD initialized\n");
}

async function showDashboard() {
  if (!db) await initDashboard();

  console.log("═══════════════════════════════════════════════════════");
  console.log("           🧠 BAM + STRIKE + MEMORY DASHBOARD           ");
  console.log("═══════════════════════════════════════════════════════\n");

  // BAM Stats
  const bugsGraph = db.selectGraph("porffor_bugs");
  const bugStats = await bugsGraph.query(`
    MATCH (b:Bug)
    RETURN b.type as type, b.severity as severity, COUNT(b) as count
    ORDER BY count DESC
  `);

  console.log("🥋 BAM - Bug Detection");
  console.log("─────────────────────────────────────────────────────");
  if (bugStats?.data && bugStats.data.length > 0) {
    let totalBugs = 0;
    for (const bug of bugStats.data) {
      const { type, severity, count } = bug;
      totalBugs += count;
      const icon = severity === "HIGH" ? "🔴" : severity === "MEDIUM" ? "🟡" : "🟢";
      console.log(`  ${icon} ${type}: ${count}`);
    }
    console.log(`  📊 Total bugs: ${totalBugs}\n`);
  } else {
    console.log("  No bugs detected yet\n");
  }

  // STRIKE Stats
  const mutationsGraph = db.selectGraph("porffor_mutations");
  const mutationStats = await mutationsGraph.query(`
    MATCH (m:Mutation)
    WITH COUNT(m) as total,
         SUM(CASE WHEN m.survived THEN 1 ELSE 0 END) as survived,
         SUM(CASE WHEN m.survived THEN 0 ELSE 1 END) as killed
    RETURN total, survived, killed, (killed * 100.0 / total) as killRate
  `);

  console.log("⚡ STRIKE - Mutation Testing");
  console.log("─────────────────────────────────────────────────────");
  if (mutationStats?.data && mutationStats.data.length > 0) {
    const { total, survived, killed, killRate } = mutationStats.data[0];
    console.log(`  🎯 Total mutations: ${total}`);
    console.log(`  ✅ Killed: ${killed}`);
    console.log(`  💀 Survived: ${survived}`);
    console.log(`  📊 Kill rate: ${killRate?.toFixed(2)}%\n`);
  } else {
    console.log("  No mutations tested yet\n");
  }

  // Memory Stats
  const memoryGraph = db.selectGraph("porffor_memory");
  const ruleStats = await memoryGraph.query(`
    MATCH (r:Rule)
    RETURN COUNT(r) as ruleCount, AVG(r.confidence) as avgConfidence
  `);

  const weakSpotStats = await memoryGraph.query(`
    MATCH (w:WeakSpot)
    WITH COUNT(w) as total,
         SUM(CASE WHEN w.fixed THEN 1 ELSE 0 END) as fixed
    RETURN total, fixed
  `);

  console.log("🧠 MEMORY - Learning System");
  console.log("─────────────────────────────────────────────────────");
  if (ruleStats?.data && ruleStats.data.length > 0) {
    const { ruleCount, avgConfidence } = ruleStats.data[0];
    console.log(`  📋 Rules learned: ${ruleCount}`);
    console.log(`  💯 Avg confidence: ${avgConfidence?.toFixed(2)}%`);
  }

  if (weakSpotStats?.data && weakSpotStats.data.length > 0) {
    const { total, fixed } = weakSpotStats.data[0];
    console.log(`  ⚠️  Weak spots: ${total}`);
    console.log(`  ✅ Fixed: ${fixed || 0}\n`);
  } else {
    console.log("  No learning data yet\n");
  }

  // Learning Loop Stats
  const fixStats = await memoryGraph.query(`
    MATCH (f:FixResult)
    WITH COUNT(f) as total,
         SUM(CASE WHEN f.success THEN 1 ELSE 0 END) as successful
    RETURN total, successful, 
           CASE WHEN total > 0 THEN (successful * 100.0 / total) ELSE 0 END as successRate
  `);

  console.log("🔄 LEARNING LOOP - Continuous Improvement");
  console.log("─────────────────────────────────────────────────────");
  if (fixStats?.data && fixStats.data.length > 0) {
    const { total, successful, successRate } = fixStats.data[0];
    console.log(`  🔧 Fixes applied: ${total}`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  📊 Success rate: ${successRate?.toFixed(2)}%\n`);
  } else {
    console.log("  No fixes applied yet\n");
  }

  // Top Recommendations
  const topRules = await memoryGraph.query(`
    MATCH (r:Rule)
    RETURN r.type as type, r.confidence as confidence, r.suggestion as suggestion
    ORDER BY r.confidence DESC
    LIMIT 3
  `);

  console.log("💡 TOP RECOMMENDATIONS");
  console.log("─────────────────────────────────────────────────────");
  if (topRules?.data && topRules.data.length > 0) {
    for (const rule of topRules.data) {
      const { type, confidence, suggestion } = rule;
      console.log(`  ${confidence}% - ${type}`);
      if (suggestion) {
        console.log(`      → ${suggestion}`);
      }
    }
  } else {
    console.log("  Run BAM+STRIKE first to get recommendations");
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  💡 Run: node tools/run-bam-strike.js to analyze code");
  console.log("  💡 Run: node tools/run-memory.js to learn patterns");
  console.log("  💡 Run: node tools/run-autofix.js to apply fixes");
  console.log("═══════════════════════════════════════════════════════\n");
}

async function closeDashboard() {
  if (db) {
    await db.close();
    db = null;
  }
}

async function main() {
  await showDashboard();
  await closeDashboard();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { initDashboard, showDashboard, closeDashboard };
