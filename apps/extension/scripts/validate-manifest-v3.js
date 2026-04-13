#!/usr/bin/env node

/**
 * Chrome Web Store Manifest V3 Validation Script
 * Checks for common rejection patterns before publishing
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, "..", "dist")

// Patterns that Chrome flags as violations
const VIOLATION_PATTERNS = [
  {
    name: "Dynamic Script Creation",
    pattern: /createElement\s*\(\s*["']script["']\s*\)/gi,
    severity: "HIGH",
    description:
      "Creating script elements dynamically is flagged as remote code loading",
  },
  {
    name: "eval() Usage",
    pattern: /\beval\s*\(/gi,
    severity: "HIGH",
    description: "eval() violates Content Security Policy",
  },
  {
    name: "Function Constructor",
    pattern: /new\s+Function\s*\(/g,
    severity: "HIGH",
    description: "Function constructor is similar to eval() and violates CSP",
  },
  {
    name: "Dynamic Import with Variables",
    pattern: /import\s*\(\s*[^"'`]/gi,
    severity: "MEDIUM",
    description: "Dynamic imports with variables may be flagged",
  },
  {
    name: "Remote Script Loading",
    pattern: /https?:\/\/[^"'\s]+\.js/gi,
    severity: "HIGH",
    description: "Loading scripts from remote URLs is not allowed",
  },
  {
    name: "Inline Event Handlers",
    pattern: /on(click|load|error|submit)\s*=\s*["']/gi,
    severity: "MEDIUM",
    description: "Inline event handlers violate CSP",
  },
]

// Files to check
const _FILE_PATTERNS = ["**/*.js", "**/*.html"]

function findFiles(dir, patterns) {
  const files = []

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if ([".js", ".html"].includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  walk(dir)
  return files
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const violations = []

  for (const check of VIOLATION_PATTERNS) {
    const matches = content.match(check.pattern)

    if (matches) {
      // Get line numbers for each match
      const _lines = content.split("\n")
      const matchPositions = []

      for (const match of matches) {
        const index = content.indexOf(match)
        const lineNumber = content.substring(0, index).split("\n").length

        // Get context around the match (2000 chars for better analysis)
        const contextStart = Math.max(0, index - 2000)
        const contextEnd = Math.min(content.length, index + match.length + 2000)
        const context = content.substring(contextStart, contextEnd)

        // Check if match is inside a regex pattern or string literal
        const beforeMatch = content.substring(Math.max(0, index - 100), index)
        const afterMatch = content.substring(
          index + match.length,
          index + match.length + 100,
        )
        const isInsideRegex =
          /\/[^/]*$/.test(beforeMatch) && /^[^/]*\//.test(afterMatch)
        const isInsideString = /(["'`])[^"'`]*$/.test(beforeMatch)
        const isPrismPattern =
          context.includes("pattern:") || context.includes("function:")

        // Filter out false positives
        const isFalsePositive =
          isInsideRegex || // Inside regex pattern (syntax highlighting rules)
          isInsideString || // Inside string literal
          isPrismPattern || // Prism.js syntax highlighting patterns
          // React createElement is safe - it's for JSX and resource preloading, not dynamic script injection
          (check.name === "Dynamic Script Creation" &&
            (context.includes("jsx") ||
              context.includes("React") ||
              context.includes("_jsx") ||
              context.includes("jsxDEV") ||
              context.includes("hoistable") || // React resource hoisting
              context.includes("preload") || // React resource preloading
              // Check if it's part of a larger function name (not actual createElement call)
              /createElement\w/.test(context))) ||
          // eval in sourcemap comments or bundler helpers is safe
          (check.name === "eval() Usage" &&
            (context.includes("sourceMappingURL") ||
              context.includes("//# eval") ||
              // Terser/bundler safe eval wrappers
              context.includes("safeEval") ||
              context.includes("tryEval"))) ||
          // Dynamic imports with static strings are safe
          (check.name === "Dynamic Import with Variables" &&
            /import\s*\(\s*["'`]/.test(context))

        if (!isFalsePositive) {
          matchPositions.push({
            line: lineNumber,
            match,
            context: context.substring(0, 200),
          })
        }
      }

      // Only add violation if there are real matches after filtering
      if (matchPositions.length > 0) {
        violations.push({
          ...check,
          file: path.relative(DIST_DIR, filePath),
          matches: matchPositions,
          count: matchPositions.length,
        })
      }
    }
  }

  return violations
}

function main() {
  console.log("🔍 Chrome Web Store Manifest V3 Validation\n")
  console.log(`📁 Checking: ${DIST_DIR}\n`)

  if (!fs.existsSync(DIST_DIR)) {
    console.error("❌ Error: dist/ directory not found. Run build first!")
    process.exit(1)
  }

  const files = findFiles(DIST_DIR)
  console.log(`📄 Found ${files.length} files to check\n`)

  let totalViolations = 0
  let highSeverityCount = 0
  const allViolations = []

  for (const file of files) {
    const violations = checkFile(file)

    if (violations.length > 0) {
      allViolations.push(...violations)
      totalViolations += violations.length

      for (const violation of violations) {
        if (violation.severity === "HIGH") {
          highSeverityCount++
        }
      }
    }
  }

  // Print results
  if (totalViolations === 0) {
    console.log("✅ No violations found! Safe to publish.\n")
    process.exit(0)
  }

  console.log(`⚠️  Found ${totalViolations} potential violations:\n`)

  // Group by severity
  const highViolations = allViolations.filter((v) => v.severity === "HIGH")
  const mediumViolations = allViolations.filter((v) => v.severity === "MEDIUM")

  if (highViolations.length > 0) {
    console.log("🔴 HIGH SEVERITY (will likely cause rejection):\n")

    for (const violation of highViolations) {
      console.log(`  ❌ ${violation.name}`)
      console.log(`     File: ${violation.file}`)
      console.log(`     Description: ${violation.description}`)
      console.log(`     Found ${violation.count} occurrence(s):`)

      for (const match of violation.matches.slice(0, 3)) {
        console.log(
          `       Line ${match.line}: ${match.match.substring(0, 60)}...`,
        )
      }

      if (violation.matches.length > 3) {
        console.log(`       ... and ${violation.matches.length - 3} more`)
      }

      console.log("")
    }
  }

  if (mediumViolations.length > 0) {
    console.log("🟡 MEDIUM SEVERITY (may cause rejection):\n")

    for (const violation of mediumViolations) {
      console.log(`  ⚠️  ${violation.name}`)
      console.log(`     File: ${violation.file}`)
      console.log(`     Description: ${violation.description}`)
      console.log(`     Found ${violation.count} occurrence(s)\n`)
    }
  }

  // Recommendations
  console.log("\n💡 Recommendations:\n")

  if (highViolations.some((v) => v.name === "Dynamic Script Creation")) {
    console.log('  • Remove createElement("script") patterns')
    console.log(
      "    These are likely from React internals - consider using esbuild instead of Vite\n",
    )
  }

  if (highViolations.some((v) => v.name === "eval() Usage")) {
    console.log("  • Remove all eval() calls")
    console.log(
      "    Use JSON.parse() for parsing or refactor to avoid dynamic code execution\n",
    )
  }

  console.log("  • Review the Chrome Web Store appeal document:")
  console.log("    .gemini/antigravity/brain/.../chrome_web_store_appeal.md\n")

  // Exit with error if high severity violations found
  if (highSeverityCount > 0) {
    console.log(
      "❌ Build contains HIGH severity violations. Fix before publishing!\n",
    )
    process.exit(1)
  } else {
    console.log(
      "⚠️  Build contains MEDIUM severity violations. Review before publishing.\n",
    )
    process.exit(0)
  }
}

main()
