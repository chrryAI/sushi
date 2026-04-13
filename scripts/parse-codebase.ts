#!/usr/bin/env tsx

import { execSync } from "node:child_process"
import path from "node:path"
import {
  calculateEmbeddingCost,
  estimateTokens,
  generateCodeEmbeddings,
  storeEmbeddings,
} from "../apps/api/lib/ast/generateEmbeddings"
import { parseDirectory } from "../apps/api/lib/ast/parseCodebase"
import { storeASTInGraph } from "../apps/api/lib/ast/storeFalkorGraph"

const REPO_NAME = "chrryAI/vex"
const REPO_PATH = path.resolve(__dirname, "..")

async function main() {
  console.log("🚀 Starting codebase parsing and embedding generation...")
  console.log(`📁 Repository: ${REPO_NAME}`)
  console.log(`📂 Path: ${REPO_PATH}`)

  // Get current git commit hash
  let commitHash: string
  try {
    commitHash = execSync("git rev-parse HEAD", {
      cwd: REPO_PATH,
      encoding: "utf-8",
      env: {
        ...process.env,
        PATH: "/usr/bin:/bin:/usr/local/bin", // Safe, fixed PATH
      },
    }).trim()
    console.log(`📌 Commit: ${commitHash.slice(0, 8)}`)
  } catch (_error) {
    console.error("❌ Failed to get git commit hash")
    process.exit(1)
  }

  // Step 1: Parse codebase with AST
  console.log("\n📊 Step 1: Parsing codebase with AST...")
  const startParse = Date.now()

  const nodes = await parseDirectory(REPO_PATH, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    exclude: [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      ".turbo",
      "out",
      ".git",
    ],
  })

  const parseDuration = Date.now() - startParse
  console.log(`✅ Parsed ${nodes.length} AST nodes in ${parseDuration}ms`)

  // Show breakdown by type
  const breakdown = nodes.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  console.log("\n📊 Node breakdown:")
  Object.entries(breakdown).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`)
  })

  // Step 2: Store in FalkorDB graph
  console.log("\n📊 Step 2: Storing AST in FalkorDB graph...")
  const startGraph = Date.now()

  try {
    await storeASTInGraph(nodes, REPO_NAME, commitHash)
    const graphDuration = Date.now() - startGraph
    console.log(`✅ Stored in FalkorDB graph in ${graphDuration}ms`)
  } catch (error) {
    console.error("❌ Failed to store in FalkorDB:", error)
    console.log("⚠️ Continuing with embeddings generation...")
  }

  // Step 3: Generate embeddings
  console.log("\n🧠 Step 3: Generating embeddings...")

  // Estimate cost first
  const estimatedTokens = estimateTokens(
    nodes.map((n) => ({
      id: n.id,
      repoName: REPO_NAME,
      commitHash,
      filepath: n.filepath,
      type: n.type,
      name: n.name,
      content: n.content,
    })),
  )
  const estimatedCost = calculateEmbeddingCost(estimatedTokens)

  console.log(`💰 Estimated tokens: ${estimatedTokens.toLocaleString()}`)
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`)

  // Ask for confirmation if cost is high
  if (estimatedCost > 0.1) {
    console.log(
      "\n⚠️ Cost exceeds $0.10. Set CONFIRM_EMBEDDINGS=true to proceed.",
    )
    if (process.env.CONFIRM_EMBEDDINGS !== "true") {
      console.log("❌ Aborting embedding generation")
      process.exit(0)
    }
  }

  const startEmbed = Date.now()
  const chunks = await generateCodeEmbeddings(nodes, REPO_NAME, commitHash)
  const embedDuration = Date.now() - startEmbed
  console.log(`✅ Generated embeddings in ${embedDuration}ms`)

  // Step 4: Store embeddings in PostgreSQL
  console.log("\n💾 Step 4: Storing embeddings in database...")
  const startStore = Date.now()

  await storeEmbeddings(chunks)

  const storeDuration = Date.now() - startStore
  console.log(`✅ Stored embeddings in ${storeDuration}ms`)

  // Summary
  const totalDuration = Date.now() - startParse
  console.log(`\n${"=".repeat(50)}`)
  console.log("✅ CODEBASE PARSING COMPLETE!")
  console.log("=".repeat(50))
  console.log(`📊 Total nodes: ${nodes.length}`)
  console.log(`🧠 Embeddings: ${chunks.length}`)
  console.log(`⏱️ Total time: ${(totalDuration / 1000).toFixed(2)}s`)
  console.log(`💰 Actual cost: $${estimatedCost.toFixed(4)}`)
  console.log("=".repeat(50))
}

main().catch((error) => {
  console.error("❌ Fatal error:", error)
  process.exit(1)
})
