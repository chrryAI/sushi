/**
 * AUTOFIX - Automatic Code Fix Generator
 * Uses Memory learnings to generate and apply code fixes
 */

import fs from "node:fs"
import { FalkorDB } from "falkordb"

let db = null
let memoryGraph = null

async function initAutoFix() {
  if (memoryGraph) return

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  })
  memoryGraph = db.selectGraph("porffor_memory")
  console.log("🔧 AUTOFIX initialized")
}

/**
 * Generate fix for MISSING_ERROR_HANDLING
 */
function generateErrorHandlingFix(code, functionName, startLine, endLine) {
  const lines = code.split("\n")
  const funcCode = lines.slice(startLine - 1, endLine).join("\n")

  // Check if already has try-catch
  if (funcCode.includes("try") && funcCode.includes("catch")) {
    return null // Already has error handling
  }

  // Find function body
  const funcStart = funcCode.indexOf("{")
  const funcEnd = funcCode.lastIndexOf("}")

  if (funcStart === -1 || funcEnd === -1) {
    return null // Can't parse function
  }

  const funcBody = funcCode.substring(funcStart + 1, funcEnd)

  // Generate wrapped version
  const fixed =
    funcCode.substring(0, funcStart + 1) +
    "\n  try {" +
    funcBody
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n") +
    "\n  } catch (error) {\n    console.error(`Error in ${functionName}:`, error);\n    throw error;\n  }" +
    "\n" +
    funcCode.substring(funcEnd)

  return {
    type: "MISSING_ERROR_HANDLING",
    original: funcCode,
    fixed,
    confidence: 91,
    description: `Add try-catch block to ${functionName}`,
  }
}

/**
 * Generate fix for UNUSED_IMPORT
 */
function generateUnusedImportFix(code, importName, fromModule, line) {
  const lines = code.split("\n")
  const importLine = lines[line - 1]

  // Check if import is actually used
  const usagePattern = new RegExp(`\\b${importName}\\b`, "g")
  const usageCount = (code.match(usagePattern) || []).length

  if (usageCount > 1) {
    return null // Import is used
  }

  // Remove the import
  let fixed
  if (importLine.includes(",")) {
    // Multiple imports, just remove this one
    fixed = importLine.replace(
      new RegExp(`\\s*,?\\s*${importName}\\s*,?\\s*`),
      "",
    )
    // Clean up double commas
    fixed = fixed
      .replace(/,\s*,/g, ",")
      .replace(/{\s*,/g, "{")
      .replace(/,\s*}/g, "}")
  } else {
    // Single import, remove entire line
    fixed = ""
  }

  return {
    type: "UNUSED_IMPORT",
    original: importLine,
    fixed,
    line,
    confidence: 72,
    description: `Remove unused import: ${importName} from ${fromModule}`,
  }
}

/**
 * Generate fix for weak spots (survived mutations)
 */
function generateWeakSpotFix(weakSpot) {
  const { file, line, operator, category, suggestion } = weakSpot

  return {
    type: "WEAK_SPOT",
    file,
    line,
    operator,
    category,
    suggestion,
    testNeeded: true,
    description: `Add test: ${suggestion}`,
  }
}

/**
 * Get all fixes for a file
 */
async function getFixesForFile(filePath) {
  if (!memoryGraph) await initAutoFix()

  const fixes = []

  // Get prevention rules
  const rules = await memoryGraph.query(`
    MATCH (r:Rule)
    WHERE r.confidence > 70
    RETURN r.type as type, r.suggestion as suggestion, r.confidence as confidence
    ORDER BY r.confidence DESC
  `)

  // Get weak spots for this file
  const weakSpots = await memoryGraph.query(
    `
    MATCH (w:WeakSpot)
    WHERE w.file = $file
    RETURN w.line as line, w.operator as operator, w.category as category, 
           w.suggestion as suggestion, w.severity as severity
    ORDER BY w.severity DESC, w.count DESC
  `,
    {
      params: { file: filePath },
    },
  )

  console.log(`\n🔧 Generating fixes for ${filePath}...`)

  // Read file
  const code = fs.readFileSync(filePath, "utf-8")

  // Generate fixes based on rules
  if (rules?.data) {
    for (const rule of rules.data) {
      const { type, suggestion, confidence } = rule

      if (type === "MISSING_ERROR_HANDLING") {
        // Find async functions without error handling
        const asyncFuncPattern = /async\s+function\s+(\w+)\s*\([^)]*\)\s*{/g
        let match
        while ((match = asyncFuncPattern.exec(code)) !== null) {
          const funcName = match[1]
          const startLine = code.substring(0, match.index).split("\n").length

          // Find function end (simplified - just find next function or EOF)
          const nextFunc = code.indexOf("async function", match.index + 1)
          const endLine =
            nextFunc === -1
              ? code.split("\n").length
              : code.substring(0, nextFunc).split("\n").length

          const fix = generateErrorHandlingFix(
            code,
            funcName,
            startLine,
            endLine,
          )
          if (fix) {
            fixes.push({
              ...fix,
              file: filePath,
              startLine,
              endLine,
            })
          }
        }
      }

      if (type === "UNUSED_IMPORT") {
        // Find unused imports
        const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g
        let match
        while ((match = importPattern.exec(code)) !== null) {
          const imports = match[1].split(",").map((s) => s.trim())
          const fromModule = match[2]
          const line = code.substring(0, match.index).split("\n").length

          for (const imp of imports) {
            const fix = generateUnusedImportFix(code, imp, fromModule, line)
            if (fix) {
              fixes.push({
                ...fix,
                file: filePath,
              })
            }
          }
        }
      }
    }
  }

  // Generate fixes for weak spots
  if (weakSpots?.data) {
    for (const weakSpot of weakSpots.data) {
      const fix = generateWeakSpotFix(weakSpot)
      fixes.push({
        ...fix,
        file: filePath,
      })
    }
  }

  console.log(`   ✅ Generated ${fixes.length} fixes`)
  return fixes
}

/**
 * Apply a fix to a file
 */
function applyFix(fix) {
  if (fix.testNeeded) {
    // Can't auto-apply test fixes, just return suggestion
    return {
      applied: false,
      reason: "Test fix requires manual implementation",
      suggestion: fix.description,
    }
  }

  const code = fs.readFileSync(fix.file, "utf-8")

  if (fix.type === "UNUSED_IMPORT") {
    // Replace the import line
    const lines = code.split("\n")
    if (fix.fixed === "") {
      // Remove entire line
      lines.splice(fix.line - 1, 1)
    } else {
      // Replace line
      lines[fix.line - 1] = fix.fixed
    }
    const newCode = lines.join("\n")

    // Write back
    fs.writeFileSync(fix.file, newCode)

    return {
      applied: true,
      type: fix.type,
      description: fix.description,
    }
  }

  if (fix.type === "MISSING_ERROR_HANDLING") {
    // Replace function code
    const newCode = code.replace(fix.original, fix.fixed)

    // Write back
    fs.writeFileSync(fix.file, newCode)

    return {
      applied: true,
      type: fix.type,
      description: fix.description,
    }
  }

  return {
    applied: false,
    reason: "Unknown fix type",
  }
}

/**
 * Generate fix report
 */
async function generateFixReport(filePath) {
  const fixes = await getFixesForFile(filePath)

  console.log(`\n📋 Fix Report for ${filePath}:`)
  console.log(`   Total fixes: ${fixes.length}`)

  const byType = {}
  for (const fix of fixes) {
    byType[fix.type] = (byType[fix.type] || 0) + 1
  }

  console.log("\n📊 Fixes by type:")
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type}: ${count}`)
  }

  console.log("\n🔧 Suggested fixes:")
  for (const fix of fixes.slice(0, 10)) {
    // Show first 10
    console.log(`   ${fix.confidence || "N/A"}% - ${fix.description}`)
  }

  return fixes
}

/**
 * Interactive fix application
 */
async function applyFixesInteractive(filePath) {
  const fixes = await getFixesForFile(filePath)

  console.log(`\n🔧 Applying fixes to ${filePath}...`)

  let applied = 0
  let skipped = 0

  for (const fix of fixes) {
    if (fix.testNeeded) {
      console.log(`   ⏭️  Skipped: ${fix.description} (requires manual test)`)
      skipped++
      continue
    }

    const result = applyFix(fix)
    if (result.applied) {
      console.log(`   ✅ Applied: ${result.description}`)
      applied++
    } else {
      console.log(`   ❌ Failed: ${result.reason}`)
      skipped++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Applied: ${applied}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📝 Total: ${fixes.length}`)

  return { applied, skipped, total: fixes.length }
}

async function closeAutoFix() {
  if (db) {
    await db.close()
    db = null
    memoryGraph = null
    console.log("👋 AUTOFIX closed")
  }
}

export {
  initAutoFix,
  getFixesForFile,
  applyFix,
  generateFixReport,
  applyFixesInteractive,
  closeAutoFix,
}
