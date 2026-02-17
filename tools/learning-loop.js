/**
 * LEARNING LOOP - Continuous Learning System
 * Logs fix results back to Memory to improve confidence scores
 */

import { FalkorDB } from "falkordb"

let db = null
let memoryGraph = null

async function initLearningLoop() {
  if (memoryGraph) return

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  })
  memoryGraph = db.selectGraph("porffor_memory")
  console.log("🔄 LEARNING LOOP initialized")
}

/**
 * Log fix result - system learns from success/failure
 */
async function logFixResult(fix, result) {
  if (!memoryGraph) await initLearningLoop()

  const timestamp = Date.now()

  // Create FixResult node
  await memoryGraph.query(
    `
    CREATE (f:FixResult {
      id: $id,
      type: $type,
      file: $file,
      applied: $applied,
      success: $success,
      timestamp: $timestamp,
      description: $description
    })
  `,
    {
      params: {
        id: `fix_${fix.type}_${timestamp}`,
        type: fix.type,
        file: fix.file || "unknown",
        applied: result.applied,
        success: result.applied && !result.error,
        timestamp,
        description: fix.description || "",
      },
    },
  )

  // Update Rule confidence based on result
  if (result.applied && !result.error) {
    // Success! Increase confidence
    await memoryGraph.query(
      `
      MATCH (r:Rule {type: $type})
      SET r.confidence = r.confidence + 2,
          r.successCount = COALESCE(r.successCount, 0) + 1,
          r.lastSuccess = $timestamp
    `,
      {
        params: {
          type: fix.type,
          timestamp,
        },
      },
    )

    console.log(`   ✅ Learning: ${fix.type} confidence increased (success)`)
  } else if (result.applied && result.error) {
    // Applied but failed! Decrease confidence
    await memoryGraph.query(
      `
      MATCH (r:Rule {type: $type})
      SET r.confidence = r.confidence - 5,
          r.failureCount = COALESCE(r.failureCount, 0) + 1,
          r.lastFailure = $timestamp
    `,
      {
        params: {
          type: fix.type,
          timestamp,
        },
      },
    )

    console.log(`   ❌ Learning: ${fix.type} confidence decreased (failure)`)
  }

  return {
    logged: true,
    timestamp,
  }
}

/**
 * Log test improvement result
 */
async function logTestImprovement(weakSpot, testAdded, testPassed) {
  if (!memoryGraph) await initLearningLoop()

  const timestamp = Date.now()

  // Update WeakSpot with test result
  await memoryGraph.query(
    `
    MATCH (w:WeakSpot {file: $file, line: $line, operator: $operator})
    SET w.testAdded = $testAdded,
        w.testPassed = $testPassed,
        w.fixed = $fixed,
        w.fixedAt = $timestamp
  `,
    {
      params: {
        file: weakSpot.file,
        line: weakSpot.line,
        operator: weakSpot.operator,
        testAdded,
        testPassed,
        fixed: testAdded && testPassed,
        timestamp,
      },
    },
  )

  if (testAdded && testPassed) {
    console.log(
      `   ✅ Learning: Weak spot fixed at ${weakSpot.file}:${weakSpot.line}`,
    )
  }

  return {
    logged: true,
    timestamp,
  }
}

/**
 * Get learning statistics
 */
async function getLearningStats() {
  if (!memoryGraph) await initLearningLoop()

  // Get fix success rate
  const fixStats = await memoryGraph.query(`
    MATCH (f:FixResult)
    WITH COUNT(f) as total, 
         SUM(CASE WHEN f.success THEN 1 ELSE 0 END) as successful
    RETURN total, successful, 
           CASE WHEN total > 0 THEN (successful * 100.0 / total) ELSE 0 END as successRate
  `)

  // Get updated rule confidences
  const ruleStats = await memoryGraph.query(`
    MATCH (r:Rule)
    RETURN r.type as type, 
           r.confidence as confidence,
           COALESCE(r.successCount, 0) as successCount,
           COALESCE(r.failureCount, 0) as failureCount
    ORDER BY r.confidence DESC
  `)

  // Get fixed weak spots
  const weakSpotStats = await memoryGraph.query(`
    MATCH (w:WeakSpot)
    WITH COUNT(w) as total,
         SUM(CASE WHEN w.fixed THEN 1 ELSE 0 END) as fixed
    RETURN total, fixed, 
           CASE WHEN total > 0 THEN (fixed * 100.0 / total) ELSE 0 END as fixedRate
  `)

  console.log("\n📊 Learning Statistics:")

  if (fixStats?.data && fixStats.data.length > 0) {
    const { total, successful, successRate } = fixStats.data[0]
    console.log(`\n🔧 Fix Results:`)
    console.log(`   Total fixes attempted: ${total}`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Success rate: ${successRate?.toFixed(2)}%`)
  }

  if (ruleStats?.data && ruleStats.data.length > 0) {
    console.log(`\n📋 Updated Rule Confidences:`)
    for (const rule of ruleStats.data) {
      const { type, confidence, successCount, failureCount } = rule
      console.log(
        `   ${type}: ${confidence}% (${successCount} success, ${failureCount} failures)`,
      )
    }
  }

  if (weakSpotStats?.data && weakSpotStats.data.length > 0) {
    const { total, fixed, fixedRate } = weakSpotStats.data[0]
    console.log(`\n🎯 Weak Spots:`)
    console.log(`   Total: ${total}`)
    console.log(`   Fixed: ${fixed}`)
    console.log(`   Fix rate: ${fixedRate?.toFixed(2)}%`)
  }

  return {
    fixes: fixStats?.data?.[0] || {},
    rules: ruleStats?.data || [],
    weakSpots: weakSpotStats?.data?.[0] || {},
  }
}

/**
 * Export learning data for analysis
 */
async function exportLearningData() {
  if (!memoryGraph) await initLearningLoop()

  const data = {
    timestamp: Date.now(),
    rules: [],
    fixes: [],
    weakSpots: [],
  }

  // Get all rules
  const rules = await memoryGraph.query(`
    MATCH (r:Rule)
    RETURN r
  `)
  if (rules?.data) {
    data.rules = rules.data
  }

  // Get all fix results
  const fixes = await memoryGraph.query(`
    MATCH (f:FixResult)
    RETURN f
    ORDER BY f.timestamp DESC
    LIMIT 100
  `)
  if (fixes?.data) {
    data.fixes = fixes.data
  }

  // Get all weak spots
  const weakSpots = await memoryGraph.query(`
    MATCH (w:WeakSpot)
    RETURN w
  `)
  if (weakSpots?.data) {
    data.weakSpots = weakSpots.data
  }

  return data
}

async function closeLearningLoop() {
  if (db) {
    await db.close()
    db = null
    memoryGraph = null
    console.log("👋 LEARNING LOOP closed")
  }
}

export {
  initLearningLoop,
  logFixResult,
  logTestImprovement,
  getLearningStats,
  exportLearningData,
  closeLearningLoop,
}
