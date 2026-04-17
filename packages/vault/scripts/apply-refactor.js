import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.join(__dirname, "../src/dna/createStores.ts")
let content = fs.readFileSync(srcPath, "utf8")

function extractVariable(varName) {
  const startRegex = new RegExp(`const ${varName} = `)
  const match = content.match(startRegex)
  if (!match) return null

  const startIdx = match.index

  // Check if what follows is an open bracket or template literal
  const declarationPart = match[0]
  let bodyStart = startIdx + declarationPart.length

  // Skip any newlines or spaces after the equals
  while (
    content[bodyStart] === " " ||
    content[bodyStart] === "\n" ||
    content[bodyStart] === "\r"
  ) {
    bodyStart++
  }

  let endIdx = -1

  if (content[bodyStart] === "`") {
    // Template literal
    for (let i = bodyStart + 1; i < content.length; i++) {
      if (content[i] === "`") {
        // we ignore escaped ones for simplicity as there usually aren't
        // Check if escaped
        if (content[i - 1] !== "\\") {
          endIdx = i + 1
          break
        }
      }
    }
  } else if (content[bodyStart] === "[") {
    let depth = 0
    for (let i = bodyStart; i < content.length; i++) {
      if (content[i] === "[") depth++
      if (content[i] === "]") {
        depth--
        if (depth === 0) {
          endIdx = i + 1
          break
        }
      }
    }
  } else if (
    content.slice(startIdx, startIdx + 150).includes("getExampleInstructions")
  ) {
    endIdx = content.indexOf(")\n", startIdx)
    if (endIdx !== -1) endIdx += 2
  }

  if (endIdx !== -1) {
    // Also capture trailing semicolon or newlines so `replace` cleanly removes the statement
    while (
      content[endIdx] === ";" ||
      content[endIdx] === " " ||
      content[endIdx] === "\r" ||
      content[endIdx] === "\n"
    ) {
      endIdx++
      // stop after two newlines to avoid deleting too much vertical whitespace
      if (content.slice(endIdx - 2, endIdx) === "\n\n") break
    }
    return content.slice(startIdx, endIdx)
  }
  return null
}

function extractPayload(payloadName) {
  const startRegex = new RegExp(`const ${payloadName} \\= \\{`)
  const match = content.match(startRegex)
  if (!match) return null

  let depth = 0
  for (let i = match.index; i < content.length; i++) {
    if (content[i] === "{") depth++
    if (content[i] === "}") {
      depth--
      if (depth === 0) {
        return content.slice(match.index, i + 1)
      }
    }
  }
  return null
}

// Variables to remove
const varsToRemove = [
  // Claude
  "claudeWriterInstructions",
  "claudeCodeReviewInstructions",
  "claudeResearchInstructions",
  "claudeCreativeInstructions",
  "claudeSystemPrompt",
  "writerSystemPrompt",
  "reviewerSystemPrompt",
  "researcherSystemPrompt",

  // Perplexity
  "perplexityGeneralInstructions",
  "perplexitySearchInstructions",
  "perplexityNewsInstructions",
  "perplexityScholarInstructions",
  "_perplexityOldSearchInstructions",
  "perplexitySystemPrompt",
  "searchSystemPrompt",
  "newsSystemPrompt",
  "academicSystemPrompt",

  // Sushi
  "sushiGeneralInstructions",
  "sushiCoderInstructions",
  "sushiDebuggerInstructions",
  "sushiArchitectInstructions",
  "_sushiCodeInstructions",
  "sushiSystemPrompt",
  "coderSystemPrompt",
  "debuggerSystemPrompt",
  "architectSystemPrompt",
]

for (const v of varsToRemove) {
  const block = extractVariable(v)
  if (block) {
    content = content.replace(block, "")
  }
}

// Payloads to replace
const payloadsToReplace = [
  {
    name: "claudeAppPayload",
    func: "getClaudePayload",
    storeId: "claudeStore.id",
  },
  {
    name: "writerPayload",
    func: "getWriterPayload",
    storeId: "claudeStore.id",
  },
  {
    name: "reviewerPayload",
    func: "getReviewerPayload",
    storeId: "claudeStore.id",
  },
  {
    name: "researcherPayload",
    func: "getResearcherPayload",
    storeId: "claudeStore.id",
  },

  {
    name: "perplexityAppPayload",
    func: "getPerplexityPayload",
    storeId: "perplexityStore.id",
  },
  {
    name: "searchPayload",
    func: "getSearchPayload",
    storeId: "perplexityStore.id",
  },
  {
    name: "newsPayload",
    func: "getNewsPayload",
    storeId: "perplexityStore.id",
  },
  {
    name: "academicPayload",
    func: "getAcademicPayload",
    storeId: "perplexityStore.id",
  },

  {
    name: "sushiAppPayload",
    func: "getchopstick",
    storeId: "sushiStore.id",
  },
  { name: "coderPayload", func: "getCoderPayload", storeId: "sushiStore.id" },
  {
    name: "debuggerPayload",
    func: "getDebuggerPayload",
    storeId: "sushiStore.id",
  },
  {
    name: "architectPayload",
    func: "getArchitectPayload",
    storeId: "sushiStore.id",
  },
]

for (const p of payloadsToReplace) {
  const block = extractPayload(p.name)
  if (block) {
    // Also find `app: ${p.name}` and replace it.
    // The payload definition block itself is removed.
    content = content.replace(block, "")
    // We might have `app: ${p.name},` or `app: ${p.name}`
    const regex1 = new RegExp(`app:\\s*${p.name},`, "g")
    const regex2 = new RegExp(`app:\\s*${p.name}\\s*\\}`, "g")

    const replacement = `app: await ${p.func}({ userId: admin.id, storeId: ${p.storeId}, parentAppIds: [] }),`
    const replacement2 = `app: await ${p.func}({ userId: admin.id, storeId: ${p.storeId}, parentAppIds: [] }) }`

    content = content.replace(regex1, replacement)
    content = content.replace(regex2, replacement2)
  }
}

// Add imports at the top
const imports = `import { getClaudePayload, getWriterPayload, getReviewerPayload, getResearcherPayload } from "./apps/claude"\nimport { getPerplexityPayload, getSearchPayload, getNewsPayload, getAcademicPayload } from "./apps/perplexity"\nimport { getchopstick, getCoderPayload, getDebuggerPayload, getArchitectPayload } from "./apps/sushi"\n`

content = imports + content

fs.writeFileSync(srcPath, content)
console.log("createStores.ts updated.")
