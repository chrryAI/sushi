import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.join(__dirname, "../src/dna/createStores.ts")
const content = fs.readFileSync(srcPath, "utf8")

function extractVariable(varName) {
  const startRegex = new RegExp(`const ${varName} =`)
  const match = content.match(startRegex)
  if (!match) return null

  const startIdx = match.index

  let endIdx = -1
  if (content[startIdx + match[0].length + 1] === "[") {
    endIdx = content.indexOf("]\n", startIdx)
    if (endIdx !== -1) endIdx += 2
  } else if (content.slice(startIdx).includes(commonAppSection)) {
    endIdx = content.indexOf("`\n", startIdx + match[0].length + 4)
    if (endIdx !== -1) endIdx += 2
  } else {
    endIdx = content.indexOf("\n\n", startIdx)
  }

  if (endIdx !== -1) {
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

// Function replacement
function generatePayloadFunc(
  funcName,
  basePayloadStr,
  structName,
  removedLines,
  isPerplexity,
  isSushi,
) {
  if (!basePayloadStr) return `// Could not find ${funcName}`
  let replaced = basePayloadStr
  replaced = replaced.replace(new RegExp(`^const ${structName} = `), "")
  removedLines.forEach((line) => {
    replaced = replaced.replace(line, "")
  })
  replaced = replaced.replace(/userId:\s*admin\.id,/, "userId: params.userId,")

  if (isPerplexity) {
    replaced = replaced.replace(
      /storeId:\s*perplexityStore\.id,/,
      "storeId: params.storeId,",
    )
  } else if (isSushi) {
    replaced = replaced.replace(
      /storeId:\s*sushiStore\.id,/,
      "storeId: params.storeId,",
    )
  }
  replaced = replaced.replace(/extends: params\.parentAppIds,/, "")

  return `export const ${funcName} = (params: { userId: string, storeId: string, parentAppIds: string[] }) => {\n    const payload = ${replaced}\n    return { ...payload, extends: params.parentAppIds };\n}`
}

// ---------------- PERPLEXITY ----------------
const perplexityGeneralInstructions = extractVariable(
  "perplexityGeneralInstructions",
)
const perplexitySearchInstructions = extractVariable(
  "perplexitySearchInstructions",
)
const perplexityNewsInstructions = extractVariable("perplexityNewsInstructions")
const perplexityScholarInstructions = extractVariable(
  "perplexityScholarInstructions",
)
const _perplexityOldSearchInstructions = extractVariable(
  "_perplexityOldSearchInstructions",
)

const perplexitySystemPrompt = extractVariable("perplexitySystemPrompt")
const searchSystemPrompt = extractVariable("searchSystemPrompt")
const newsSystemPrompt = extractVariable("newsSystemPrompt")
const academicSystemPrompt = extractVariable("academicSystemPrompt")

const perplexityAppPayload = extractPayload("perplexityAppPayload")
const searchPayload = extractPayload("searchPayload")
const newsPayload = extractPayload("newsPayload")
const academicPayload = extractPayload("academicPayload")

const perplexityTs = `import { encrypt } from "../../../index"\nimport { commonAppSection } from "../createStores"\n
// --- Instructions ---
${perplexityGeneralInstructions}

${perplexitySearchInstructions}

${perplexityNewsInstructions}

${perplexityScholarInstructions}

${_perplexityOldSearchInstructions}

// --- System Prompts ---
export ${perplexitySystemPrompt}

export ${searchSystemPrompt}

export ${newsSystemPrompt}

export ${academicSystemPrompt}

// --- Payloads ---
${generatePayloadFunc("getPerplexityPayload", perplexityAppPayload, "perplexityAppPayload", ["...perplexityApp,"], true, false)}

${generatePayloadFunc("getSearchPayload", searchPayload, "searchPayload", ["...search,"], true, false)}

${generatePayloadFunc("getNewsPayload", newsPayload, "newsPayload", ["...news,"], true, false)}

${generatePayloadFunc("getAcademicPayload", academicPayload, "academicPayload", ["...academic,"], true, false)}
`
fs.writeFileSync(
  path.join(__dirname, "../src/dna/apps/perplexity.ts"),
  perplexityTs,
)
console.log("perplexity.ts generated.")

// ---------------- SUSHI ----------------
const sushiGeneralInstructions = extractVariable("sushiGeneralInstructions")
const sushiCoderInstructions = extractVariable("sushiCoderInstructions")
const sushiDebuggerInstructions = extractVariable("sushiDebuggerInstructions")
const sushiArchitectInstructions = extractVariable("sushiArchitectInstructions")
const _sushiCodeInstructions = extractVariable("_sushiCodeInstructions")

const sushiSystemPrompt = extractVariable("sushiSystemPrompt")
const coderSystemPrompt = extractVariable("coderSystemPrompt")
const debuggerSystemPrompt = extractVariable("debuggerSystemPrompt")
const architectSystemPrompt = extractVariable("architectSystemPrompt")

const sushiAppPayload = extractPayload("sushiAppPayload")
const coderPayload = extractPayload("coderPayload")
const debuggerPayload = extractPayload("debuggerPayload")
const architectPayload = extractPayload("architectPayload")

const sushiTs = `import { encrypt } from "../../../index"\nimport { commonAppSection } from "../createStores"\n
// --- Instructions ---
${sushiGeneralInstructions}

${sushiCoderInstructions}

${sushiDebuggerInstructions}

${sushiArchitectInstructions}

${_sushiCodeInstructions}

// --- System Prompts ---
export ${sushiSystemPrompt}

export ${coderSystemPrompt}

export ${debuggerSystemPrompt}

export ${architectSystemPrompt}

// --- Payloads ---
${generatePayloadFunc("getchopstick", sushiAppPayload, "sushiAppPayload", ["...sushiApp,"], false, true)}

${generatePayloadFunc("getCoderPayload", coderPayload, "coderPayload", ["...coder,"], false, true)}

${generatePayloadFunc("getDebuggerPayload", debuggerPayload, "debuggerPayload", ["...debuggerApp,"], false, true)}

${generatePayloadFunc("getArchitectPayload", architectPayload, "architectPayload", ["...architect,"], false, true)}
`
fs.writeFileSync(path.join(__dirname, "../src/dna/apps/sushi.ts"), sushiTs)
console.log("sushi.ts generated.")
