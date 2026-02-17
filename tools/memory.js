/**
 * MEMORY - Learning System from Bug Patterns
 * Learns from BAM bugs and STRIKE mutations
 * Generates prevention rules and auto-fix suggestions
 */

import { FalkorDB } from "falkordb"

let db = null
let graph = null

async function initMemory() {
  if (graph) return

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  })
  graph = db.selectGraph("porffor_memory")
  console.log("🧠 MEMORY initialized")
}

/**
 * Learn from bug patterns - create prevention rules
 */
async function learnFromBugs() {
  if (!graph) await initMemory()

  // Connect to bugs graph
  const bugsGraph = db.selectGraph("porffor_bugs")

  const bugPatterns = await bugsGraph.query(`
    MATCH (b:Bug)
    RETURN b.type as type, b.severity as severity, b.suggestion as suggestion, COUNT(b) as count
    ORDER BY count DESC
  `)

  console.log("\n🧠 Learning from bug patterns...")

  if (!bugPatterns || !bugPatterns.data) {
    console.log("   No bug data to learn from")
    return []
  }

  const rules = []

  // FalkorDB returns array of objects
  for (const row of bugPatterns.data) {
    const { type, severity, suggestion, count } = row

    // Create prevention rule
    const rule = {
      id: `rule_${type}_${Date.now()}`,
      type,
      severity,
      occurrences: count,
      suggestion,
      confidence: calculateConfidence(count, severity),
      preventionPattern: generatePreventionPattern(type, suggestion),
    }

    // Store in memory graph
    await graph.query(
      `
      CREATE (r:Rule {
        id: $id,
        type: $type,
        severity: $severity,
        occurrences: $occurrences,
        suggestion: $suggestion,
        confidence: $confidence,
        pattern: $pattern,
        timestamp: $timestamp
      })
    `,
      {
        params: {
          id: rule.id,
          type: rule.type,
          severity: rule.severity,
          occurrences: rule.occurrences,
          suggestion: rule.suggestion || "",
          confidence: rule.confidence,
          pattern: rule.preventionPattern,
          timestamp: Date.now(),
        },
      },
    )

    rules.push(rule)
    console.log(
      `   ✅ Learned: ${type} (${count}x, confidence: ${rule.confidence}%)`,
    )
  }

  return rules
}

/**
 * Learn from survived mutations - identify weak spots
 */
async function learnFromMutations() {
  if (!graph) await initMemory()

  // Connect to mutations graph
  const mutationsGraph = db.selectGraph("porffor_mutations")

  const survivedMutations = await mutationsGraph.query(`
    MATCH (m:Mutation {survived: true})
    RETURN m.file as file, m.line as line, m.operator as operator, m.category as category, COUNT(m) as count
    ORDER BY count DESC
    LIMIT 20
  `)

  console.log("\n🧠 Learning from survived mutations...")

  if (!survivedMutations || !survivedMutations.data) {
    console.log("   No mutation data to learn from")
    return []
  }

  const weakSpots = []

  for (const row of survivedMutations.data) {
    const { file, line, operator, category, count } = row

    // Create weak spot record
    const weakSpot = {
      id: `weak_${file}_${line}_${Date.now()}`,
      file,
      line,
      operator,
      category,
      count,
      severity: calculateWeakSpotSeverity(count, category),
      testSuggestion: generateTestSuggestion(operator, category),
    }

    // Store in memory graph
    await graph.query(
      `
      CREATE (w:WeakSpot {
        id: $id,
        file: $file,
        line: $line,
        operator: $operator,
        category: $category,
        count: $count,
        severity: $severity,
        suggestion: $suggestion,
        timestamp: $timestamp
      })
    `,
      {
        params: {
          id: weakSpot.id,
          file: weakSpot.file,
          line: weakSpot.line,
          operator: weakSpot.operator,
          category: weakSpot.category,
          count: weakSpot.count,
          severity: weakSpot.severity,
          suggestion: weakSpot.testSuggestion,
          timestamp: Date.now(),
        },
      },
    )

    weakSpots.push(weakSpot)
    console.log(
      `   ⚠️  Weak spot: ${file}:${line} - ${operator} (${count}x survived)`,
    )
  }

  return weakSpots
}

/**
 * Generate auto-fix suggestions based on learned patterns
 */
async function generateAutoFixes(filePath, code) {
  if (!graph) await initMemory()

  // Get all learned rules
  const rules = await graph.query(`
    MATCH (r:Rule)
    RETURN r.type as type, r.pattern as pattern, r.suggestion as suggestion, r.confidence as confidence
    ORDER BY r.confidence DESC
  `)

  if (!rules || !rules.data) {
    return []
  }

  const fixes = []

  for (const row of rules.data) {
    const [type, pattern, suggestion, confidence] = row

    // Check if this file has issues matching this rule
    if (pattern && code.includes(pattern)) {
      fixes.push({
        type,
        pattern,
        suggestion,
        confidence,
        file: filePath,
      })
    }
  }

  return fixes
}

/**
 * Calculate confidence score based on occurrences and severity
 */
function calculateConfidence(count, severity) {
  const severityWeight = {
    HIGH: 1.0,
    MEDIUM: 0.7,
    LOW: 0.4,
  }

  const weight = severityWeight[severity] || 0.5
  const baseConfidence = Math.min(count * 10, 70) // Max 70 from count
  const severityBonus = weight * 30 // Max 30 from severity

  return Math.round(baseConfidence + severityBonus)
}

/**
 * Calculate weak spot severity
 */
function calculateWeakSpotSeverity(count, category) {
  if (count >= 5) return "CRITICAL"
  if (count >= 3) return "HIGH"
  if (count >= 2) return "MEDIUM"
  return "LOW"
}

/**
 * Generate prevention pattern from bug type
 */
function generatePreventionPattern(type, suggestion) {
  const patterns = {
    UNUSED_IMPORT: "import.*from",
    MISSING_ERROR_HANDLING: "async\\s+function",
    HARDCODED_PATH: "/Users/",
    TYPE_MISMATCH: "local\\.(set|get)",
    LOGIC_ERROR: "currentlyFailing",
  }

  return patterns[type] || ""
}

/**
 * Generate test suggestion for mutation operator
 */
function generateTestSuggestion(operator, category) {
  const suggestions = {
    TRUE_TO_FALSE: "Add test that verifies boolean true conditions",
    FALSE_TO_TRUE: "Add test that verifies boolean false conditions",
    ONE_TO_ZERO: "Add test that checks for non-zero values",
    ZERO_TO_ONE: "Add test that checks for zero values",
    ADD_TO_SUB: "Add test that verifies arithmetic addition",
    SUB_TO_ADD: "Add test that verifies arithmetic subtraction",
    EQ_TO_NEQ: "Add test that verifies equality checks",
    NEQ_TO_EQ: "Add test that verifies inequality checks",
    RETURN_TO_NULL: "Add test that checks return value is not null",
    RETURN_TO_UNDEFINED: "Add test that checks return value is defined",
  }

  return suggestions[operator] || `Add test for ${category} mutation`
}

/**
 * Get prevention recommendations for a file
 */
async function getRecommendations(filePath) {
  if (!graph) await initMemory()

  // Get rules that apply to this file
  const rules = await graph.query(`
    MATCH (r:Rule)
    WHERE r.confidence > 50
    RETURN r.type as type, r.suggestion as suggestion, r.confidence as confidence
    ORDER BY r.confidence DESC
    LIMIT 5
  `)

  // Get weak spots in this file
  const weakSpots = await graph.query(
    `
    MATCH (w:WeakSpot)
    WHERE w.file = $file
    RETURN w.line as line, w.operator as operator, w.suggestion as suggestion
    ORDER BY w.count DESC
  `,
    {
      params: { file: filePath },
    },
  )

  console.log(`\n Recommendations for ${filePath}:`)

  if (rules?.data && rules.data.length > 0) {
    console.log("\n Prevention Rules:")
    for (const row of rules.data) {
      const { type, suggestion, confidence } = row
      console.log(`   ${confidence}% - ${type}: ${suggestion}`)
    }
  }

  if (weakSpots?.data && weakSpots.data.length > 0) {
    console.log("\n  Weak Spots to Fix:")
    for (const row of weakSpots.data) {
      const { line, operator, suggestion } = row
      console.log(`   Line ${line} (${operator}): ${suggestion}`)
    }
  }

  return { rules: rules?.data || [], weakSpots: weakSpots?.data || [] }
}

/**
 * Generate comprehensive report
 */
async function generateReport() {
  if (!graph) await initMemory()

  const stats = await graph.query(`
    MATCH (r:Rule)
    WITH COUNT(r) as ruleCount, AVG(r.confidence) as avgConfidence
    MATCH (w:WeakSpot)
    RETURN ruleCount, avgConfidence, COUNT(w) as weakSpotCount
  `)

  console.log("\n Memory System Report:")

  if (stats?.data && stats.data.length > 0) {
    const { ruleCount, avgConfidence, weakSpotCount } = stats.data[0]
    console.log(`   Rules Learned: ${ruleCount}`)
    console.log(`   Average Confidence: ${avgConfidence?.toFixed(2)}%`)
    console.log(`   Weak Spots Identified: ${weakSpotCount}`)
  } else {
    console.log("   No data yet - run BAM+STRIKE first")
  }

  // Get top rules
  const topRules = await graph.query(`
    MATCH (r:Rule)
    RETURN r.type as type, r.confidence as confidence
    ORDER BY r.confidence DESC
    LIMIT 3
  `)

  if (topRules?.data && topRules.data.length > 0) {
    console.log("\n Top Prevention Rules:")
    for (const row of topRules.data) {
      const { type, confidence } = row
      console.log(`   ${confidence}% - ${type}`)
    }
  }
}

async function closeMemory() {
  if (db) {
    await db.close()
    db = null
    graph = null
    console.log("👋 MEMORY closed")
  }
}

export {
  initMemory,
  learnFromBugs,
  learnFromMutations,
  generateAutoFixes,
  getRecommendations,
  generateReport,
  closeMemory,
}
