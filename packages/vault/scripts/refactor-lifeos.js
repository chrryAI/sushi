import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcPath = path.join(__dirname, "../src/dna/createStores.ts")
let content = fs.readFileSync(srcPath, "utf8")

function extractVariable(varName) {
  if (!varName) return null
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
  if (!payloadName) return null
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

function generatePayloadFunc(
  funcName,
  basePayloadStr,
  structName,
  parentAppName,
  storeIdVar,
) {
  if (!basePayloadStr) return `// Could not find ${funcName}`
  let replaced = basePayloadStr
  replaced = replaced.replace(new RegExp(`^const ${structName} = `), "")
  replaced = replaced.replace(new RegExp(`\\.\\.\\.${parentAppName},`), "")
  replaced = replaced.replace(/userId:\s*admin\.id,/, "userId: params.userId,")

  // Replace storeId with params.storeId
  replaced = replaced.replace(
    /storeId:\s*[a-zA-Z0-9_.]+,.*\n?/,
    "storeId: params.storeId,\n",
  )

  replaced = replaced.replace(/extends: params\.parentAppIds,/, "")

  return `export const ${funcName} = async (params: { userId: string, storeId: string, parentAppIds: string[] }) => {\n    const payload = ${replaced}\n    return { ...payload, extends: params.parentAppIds };\n}`
}

const apps = [
  {
    slug: "chrry",
    instructions: "chrryInstructions",
    systemPrompt: "chrrySystemPrompt",
    payload: "chrryPayload",
    func: "getChrryPayload",
    storeIdVar: "blossom.id",
  },
  {
    slug: "peach",
    instructions: "peachInstructions",
    systemPrompt: "peachSystemPrompt",
    payload: "peachPayload",
    func: "getPeachPayload",
    storeIdVar: "blossom.id",
  },
  {
    slug: "bloom",
    instructions: "bloomInstructions",
    systemPrompt: "bloomSystemPrompt",
    payload: "bloomPayload",
    func: "getBloomPayload",
    storeIdVar: "blossom.id",
  },
  {
    slug: "vault",
    instructions: "vaultInstructions",
    systemPrompt: "vaultSystemPrompt",
    payload: "vaultPayload",
    func: "getVaultPayload",
    storeIdVar: "blossom.id",
  },
  {
    slug: "atlas",
    instructions: "atlasInstructions",
    systemPrompt: "atlasSystemPrompt",
    payload: "atlasPayload",
    func: "getAtlasPayload",
    storeIdVar: "compass.id",
  },
  {
    slug: "focus",
    instructions: "focusInstructions",
    systemPrompt: "focusSystemPrompt",
    payload: "focusAppPayload",
    func: "getFocusPayload",
    storeIdVar: "blossom.id",
  },
  {
    slug: "vex",
    instructions: "defaultInstructions",
    systemPrompt: "vexSystemPrompt",
    payload: "vexPayload",
    func: "getVexPayload",
    storeIdVar: "blossom.id",
  },
]

const variablesToRemove = []
const payloadsToReplace = []
let allImports = ""

for (const app of apps) {
  const instStr = extractVariable(app.instructions)
  const sysPromptStr = extractVariable(app.systemPrompt)
  const payloadStr = extractPayload(app.payload)

  if (instStr) variablesToRemove.push(app.instructions)
  if (sysPromptStr) variablesToRemove.push(app.systemPrompt)
  if (payloadStr)
    payloadsToReplace.push({
      name: app.payload,
      func: app.func,
      storeId: app.storeIdVar,
    })

  let fileContent = `import { encrypt } from "../../../index"\nimport { commonAppSection } from "../createStores"\nimport {\n  getExampleInstructions,\n  type instructionBase,\n  translateInstruction,\n} from "../utils/exampleInstructions"\n\n`

  fileContent += `// --- Instructions ---\n${instStr || "// No instructions found"}\n\n`
  fileContent += `// --- System Prompts ---\nexport ${sysPromptStr || "// No system prompt found"}\n\n`
  fileContent += `// --- Payloads ---\n${generatePayloadFunc(app.func, payloadStr, app.payload, app.slug, app.storeIdVar)}\n`

  fs.writeFileSync(
    path.join(__dirname, `../src/dna/apps/${app.slug}.ts`),
    fileContent,
  )
  console.log(`${app.slug}.ts generated.`)

  allImports += `import { ${app.func} } from "./apps/${app.slug}"\n`
}

// ================= CLEANUP createStores.ts =================

for (const v of variablesToRemove) {
  const block = extractVariable(v)
  if (block) {
    content = content.replace(block, "")
  }
}

for (const p of payloadsToReplace) {
  const block = extractPayload(p.name)
  if (block) {
    content = content.replace(block, "")
    const regex1 = new RegExp(`app:\\s*${p.name},`, "g")
    const regex2 = new RegExp(`app:\\s*${p.name}\\s*\\}`, "g")

    const replacement = `app: await ${p.func}({ userId: admin.id, storeId: ${p.storeId}, parentAppIds: [] }),`
    const replacement2 = `app: await ${p.func}({ userId: admin.id, storeId: ${p.storeId}, parentAppIds: [] }) }`

    content = content.replace(regex1, replacement)
    content = content.replace(regex2, replacement2)
  }
}

// Insert right after the previous imports
content = content.replace(
  "import { getchopstick",
  `${allImports}import { getchopstick}`,
)

fs.writeFileSync(srcPath, content)
console.log("createStores.ts updated.")
