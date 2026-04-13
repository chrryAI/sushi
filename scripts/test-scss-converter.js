#!/usr/bin/env node

/**
 * Test script for SCSS to TypeScript converter
 * Validates that the converter produces correct output
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const testScssPath = path.join(
  __dirname,
  "../packages/ui/__tests__/TestComponent.module.scss",
)
const testOutputPath = path.join(
  __dirname,
  "../packages/ui/__tests__/TestComponent.styles.ts",
)

console.log("🧪 Testing SCSS to TypeScript converter...\n")

// Generate the output
try {
  execSync(
    `node "${path.join(__dirname, "scss-to-universal.js")}" "${testScssPath}" "${testOutputPath}"`,
    {
      stdio: "inherit",
    },
  )
} catch (_error) {
  console.error("❌ Failed to generate TypeScript from SCSS")
  process.exit(1)
}

// Read the generated file
const content = fs.readFileSync(testOutputPath, "utf-8")

// Validation tests
const tests = [
  {
    name: "Has correct imports",
    check: () =>
      content.includes("import { createUnifiedStyles }") &&
      (content.includes("import { useInteractiveStyles }") ||
        content.includes("import { createStyleHook }")),
  },
  {
    name: "Converts basic styles",
    check: () => content.includes("container:") && content.includes("display:"),
  },
  {
    name: "Converts toRem.toRem() to numbers",
    check: () => content.includes("gap: 10") && content.includes("padding: 16"),
  },
  {
    name: "Converts CSS variables to clean var() syntax",
    check: () =>
      (content.includes("'var(--background)'") ||
        content.includes('"var(--background)"')) &&
      (content.includes("'var(--foreground)'") ||
        content.includes('"var(--foreground)"')),
  },
  {
    name: "Detects interactive states",
    check: () =>
      content.includes("button: {") &&
      content.includes("base: {") &&
      content.includes("hover: {"),
  },
  {
    name: "Handles responsive font sizes",
    check: () =>
      content.includes("fontSize: '4vw'") ||
      content.includes('fontSize: "4vw"'),
  },
  {
    name: "Converts kebab-case to camelCase",
    check: () =>
      content.includes("backgroundColor") &&
      content.includes("borderRadius") &&
      content.includes("flexDirection"),
  },
  {
    name: "Generates proper TypeScript types",
    check: () =>
      content.includes("type TestComponentStylesHook") &&
      content.includes("export const useTestComponentStyles"),
  },
  {
    name: "Non-interactive styles are flat",
    check: () => {
      const containerMatch = content.match(/container:\s*{[^}]*display:/)
      const hasBase = content.match(/container:\s*{[^}]*base:/)
      return containerMatch && !hasBase
    },
  },
  {
    name: "Interactive styles have proper structure",
    check: () => {
      const buttonMatch = content.match(
        /button:\s*{[\s\S]*?base:[\s\S]*?hover:/,
      )
      return !!buttonMatch
    },
  },
  {
    name: "Nested modifiers create unique names (mainEmpty)",
    check: () =>
      content.includes("mainEmpty:") && content.includes("paddingTop: 0"),
  },
  {
    name: "Nested modifiers create unique names (headerEmpty)",
    check: () =>
      content.includes("headerEmpty:") &&
      (content.includes("position: 'static'") ||
        content.includes('position: "static"')),
  },
  {
    name: "Multiple modifiers per parent work correctly",
    check: () =>
      content.includes("mainFullscreen:") &&
      content.includes("headerTransparent:"),
  },
  {
    name: "Parent styles remain separate from modifiers",
    check: () => {
      const mainHasBase = content.match(/main:\s*{[\s\S]*?padding:/)
      const headerHasBase = content.match(/header:\s*{[\s\S]*?display:/)
      return mainHasBase && headerHasBase
    },
  },
]

// Run tests
let passed = 0
let failed = 0

console.log("\n📋 Running validation tests:\n")

tests.forEach((test, index) => {
  try {
    const result = test.check()
    if (result) {
      console.log(`✅ ${index + 1}. ${test.name}`)
      passed++
    } else {
      console.log(`❌ ${index + 1}. ${test.name}`)
      failed++
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${test.name} (error: ${error.message})`)
    failed++
  }
})

// Summary
console.log(`\n📊 Test Results: ${passed}/${tests.length} passed`)

if (failed > 0) {
  console.log(`\n❌ ${failed} test(s) failed!`)
  console.log("\n💡 Check the generated file at:")
  console.log(`   ${testOutputPath}`)
  process.exit(1)
} else {
  console.log("\n✅ All tests passed! SCSS converter is working correctly.")
  process.exit(0)
}
