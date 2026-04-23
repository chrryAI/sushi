/**
 * 🤖 AI JSON Parser - Robust JSON repair for LLM outputs
 *
 * Handles:
 * - Markdown code blocks (```json ... ```)
 * - Trailing commas
 * - Unescaped quotes in values
 * - Truncated/incomplete JSON
 * - Chinese punctuation (：，)
 * - Single quotes instead of double
 *
 * Uses jsonrepair library for robust parsing
 */

import { jsonrepair } from "jsonrepair"

export interface AIJsonParseOptions {
  /** Fields that may contain long text with quotes */
  textFields?: string[]
  /** Whether to allow plain text fallback */
  allowPlainText?: boolean
  /** Default values for missing fields */
  defaults?: Record<string, unknown>
}

const DEFAULT_TEXT_FIELDS = [
  "content",
  "text",
  "message",
  "response",
  "tribeContent",
  "moltContent",
  "tribeTitle",
  "moltTitle",
  "post",
  "placeholder",
]

/**
 * Clean AI response - remove markdown fences and rethink tags
 */
export function cleanAiResponse(content: string): string {
  if (!content) return ""

  return (
    content
      // Remove markdown code blocks
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      // Remove single backtick wrappers around JSON
      .replace(/^`+|`+$/g, "")
      // Remove rethink tags
      .replace(/<rethink>.*?<\/rethink>/gs, "")
      .replace(/<rethink>/g, "")
      .replace(/<\/rethink>/g, "")
      // Remove thinking tags (DeepSeek)
      .replace(/<thinking>.*?<\/thinking>/gs, "")
      // Strip leading junk characters before JSON object/array
      .replace(/^[\s?`]+/g, "")
      .trim()
  )
}

/**
 * Repair common JSON issues from AI outputs
 */
export function repairJson(content: string, textFields?: string[]): string {
  let repaired = content

  // Fix Chinese punctuation
  repaired = repaired
    .replace(/：/g, ":")
    .replace(/，/g, ",")
    .replace(/[\u201C\u201D]/g, '"')

  // Fix single quotes to double (simple cases)
  repaired = repaired.replace(/'([^']*)'(?=\s*[:,}\]])/g, '"$1"')

  // Remove trailing commas
  repaired = repaired.replace(/,\s*([}\]])/g, "$1")

  // Fix unclosed strings in text fields
  const fields = textFields || DEFAULT_TEXT_FIELDS
  for (const field of fields) {
    // Find unclosed string values
    const pattern = new RegExp(`"${field}"\\s*:\\s*"([^"]*)$`, "gm")
    repaired = repaired.replace(pattern, `"${field}": "$1"`)
  }

  // Fix escaped quotes inside values
  repaired = repaired.replace(/(?<!\\)"(?=[^"]*":)/g, '\\"')

  return repaired
}

/**
 * Extract JSON from AI response with multiple fallback strategies
 */
export function parseAIJson<T = Record<string, unknown>>(
  content: string,
  options: AIJsonParseOptions = {},
): T {
  const {
    textFields = DEFAULT_TEXT_FIELDS,
    allowPlainText = true,
    defaults = {},
  } = options

  if (!content?.trim()) {
    throw new Error("Empty AI response")
  }

  // Step 1: Clean the response
  const cleaned = cleanAiResponse(content)

  // Step 2: Try direct parse
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Continue to repair
  }

  // Step 3: Try jsonrepair for malformed JSON
  try {
    const repaired = jsonrepair(cleaned)
    return JSON.parse(repaired) as T
  } catch {
    // Continue to extraction
  }

  // Step 4: Extract JSON boundaries (also check for arrays)
  const firstBrace = cleaned.indexOf("{")
  const firstBracket = cleaned.indexOf("[")
  const lastBrace = cleaned.lastIndexOf("}")
  const lastBracket = cleaned.lastIndexOf("]")

  // Determine if object or array is more likely
  const useObject =
    firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
  const startIdx = useObject ? firstBrace : firstBracket
  const endIdx = useObject ? lastBrace : lastBracket

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonString = cleaned.substring(startIdx, endIdx + 1)

    // Try parse extracted JSON
    try {
      return JSON.parse(jsonString) as T
    } catch {
      // Continue to repair
    }

    // Step 5: Repair and try again
    const repaired = repairJson(jsonString, textFields)
    try {
      return JSON.parse(repaired) as T
    } catch {
      // Continue to field extraction
    }

    // Step 6: Try jsonrepair on extracted string
    try {
      const repaired = jsonrepair(jsonString)
      return JSON.parse(repaired) as T
    } catch {
      // Continue to aggressive repair
    }

    // Step 7: Aggressive repair for text fields
    let aggressive = jsonString
    for (const field of textFields) {
      // Replace problematic quotes in long text fields
      const pattern = new RegExp(
        `("${field}"\\s*:\\s*")((?:[^"\\\\]|\\\\.)*)(")`,
        "gs",
      )
      aggressive = aggressive.replace(pattern, (_, key, val, end) => {
        const sanitized = val
          .replace(/\\"/g, "'")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
        return `${key}${sanitized}${end}`
      })
    }

    try {
      return JSON.parse(aggressive) as T
    } catch {
      // Continue to extraction fallback
    }
  }

  // Step 8: Regex field extraction fallback
  const result: Record<string, unknown> = { ...defaults }

  for (const field of textFields) {
    const patterns = [
      new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, "i"),
      new RegExp(`"${field}"\\s*:\\s*"([^"]*)$`, "i"),
      new RegExp(`'${field}'\\s*:\\s*'([^']*)'`, "i"),
      new RegExp(`${field}\\s*:\\s*"([^"]*)"`, "i"),
    ]

    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match?.[1]) {
        result[field] = match[1].trim()
        break
      }
    }
  }

  // Check if we got anything
  const hasContent = Object.keys(result).length > Object.keys(defaults).length
  if (hasContent) {
    console.log("⚠️ Used regex fallback to extract AI response fields")
    return result as T
  }

  // Step 9: Plain text fallback
  if (allowPlainText && cleaned.length > 50) {
    console.warn("⚠️ AI returned plain text - using fallback")
    const firstLine = cleaned.split("\n")[0]?.trim() || ""
    const title =
      firstLine.length > 0 && firstLine.length <= 150
        ? firstLine
        : cleaned.substring(0, 100)

    return {
      ...defaults,
      content: cleaned,
      title: title,
    } as T
  }

  throw new Error(
    `Failed to parse AI response. Preview: ${cleaned.substring(0, 200)}...`,
  )
}

/**
 * Safe JSON parse with fallback - never throws
 */
export function safeParseAIJson<T = Record<string, unknown>>(
  content: string,
  options: AIJsonParseOptions = {},
): { success: true; data: T } | { success: false; error: string; raw: string } {
  try {
    const data = parseAIJson<T>(content, options)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      raw: content?.substring(0, 500) || "",
    }
  }
}

/**
 * Parse array from AI response (handles various formats)
 */
export function parseAIArray<T = string>(
  content: string,
  options: AIJsonParseOptions = {},
): T[] {
  if (!content?.trim()) return []

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed as T[]
    if (parsed && typeof parsed === "object") {
      // Maybe it's wrapped in an object
      const arr = parsed.items || parsed.data || parsed.results || parsed.list
      if (Array.isArray(arr)) return arr as T[]
    }
  } catch {
    // Continue to extraction
  }

  // Try to extract array from content
  let arrayMatch: [string] | null = null
  const start = content.indexOf("[")
  const end = content.lastIndexOf("]")
  if (start !== -1 && end !== -1 && end > start) {
    arrayMatch = [content.slice(start, end + 1)]
  }
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]) as T[]
    } catch {
      // Continue
    }
  }

  // Split by newlines or commas
  const lines = content
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(
      (line) => line.length > 0 && !line.startsWith("[") && !line.endsWith("]"),
    )
    .map((line) => line.replace(/^["']|["']$/g, "")) as T[]

  return lines
}
