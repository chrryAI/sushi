// ─────────────────────────────────────────────────────────────────
// tokenOptimizer.test.ts — Unit tests for prompt compression
// ─────────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  countTokens,
  generateCacheKey,
  tokenOptimizerUtils,
} from "../../ai/sushi/tokenOptimizer"

// ─────────────────────────────────────────────────────────────────
// Tests (use standalone utilities - no Redis needed)
// ─────────────────────────────────────────────────────────────────

describe("Token Counting", () => {
  it("should estimate tokens for short text", () => {
    const text = "Hello world"
    const tokens = countTokens(text)
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(10)
  })

  it("should estimate more tokens for longer text", () => {
    const short = "Hello"
    const long =
      "Hello this is a much longer sentence with many more words to test token counting"
    const shortTokens = countTokens(short)
    const longTokens = countTokens(long)
    expect(longTokens).toBeGreaterThan(shortTokens)
  })

  it("should handle empty string", () => {
    expect(countTokens("")).toBe(0)
  })

  it("should handle unicode characters", () => {
    const turkish = "Merhaba dünya nasılsın? İyiyim teşekkür ederim!"
    const tokens = countTokens(turkish)
    expect(tokens).toBeGreaterThan(0)
  })
})

describe("Cache Key Generation", () => {
  it("should generate consistent keys for same text", () => {
    const text = "Hello world"
    const key1 = generateCacheKey(text)
    const key2 = generateCacheKey(text)
    expect(key1).toBe(key2)
  })

  it("should generate different keys for different text", () => {
    const key1 = generateCacheKey("Hello")
    const key2 = generateCacheKey("World")
    expect(key1).not.toBe(key2)
  })

  it("should include prefix in key", () => {
    const key = generateCacheKey("test")
    expect(key).toMatch(/^prompt:opt:/)
  })

  it("should handle custom prefix", () => {
    const key = generateCacheKey("test", "custom:prefix:")
    expect(key).toMatch(/^custom:prefix:/)
  })
})

describe("Compression", () => {
  it("should compress and decompress text correctly", () => {
    const original = "Hello world this is a test of compression"
    const { value, compressed } = tokenOptimizerUtils.compress(original)

    if (compressed) {
      const decompressed = tokenOptimizerUtils.decompress(value)
      expect(decompressed).toBe(original)
    } else {
      expect(value).toBe(original)
    }
  })

  it("should compress large repetitive text efficiently", () => {
    const repetitive = "The quick brown fox jumps over the lazy dog. ".repeat(
      100,
    )
    const { value, compressed } = tokenOptimizerUtils.compress(repetitive)

    expect(compressed).toBe(true)
    // Base64 should be smaller than original
    expect(value.length).toBeLessThan(repetitive.length / 2)
  })

  it("should not compress small text", () => {
    const small = "Hi"
    const { compressed } = tokenOptimizerUtils.compress(small)
    expect(compressed).toBe(false)
  })

  it("should produce decompressible output that matches original", () => {
    const original =
      "System prompt for AI assistant with detailed instructions. ".repeat(50)
    const { value, compressed } = tokenOptimizerUtils.compress(original)
    expect(compressed).toBe(true)

    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(original)
  })
})

describe("Compression ratio for real-world content", () => {
  it("should compress system prompts efficiently", () => {
    const systemPrompt = `
You are Vex, Your AI-Powered Life. Experience the future of AI interaction.
You can handle text, images, and files with multimodal capabilities.
You support real-time collaboration - users can work with teammates in shared conversations.
When users ask about weather, provide this information directly.
User's primary language is Turkish.
Timezone: Europe/Amsterdam
Calendar tool rules:
- Execute immediately
- Use past tense
- No confirmation requests
- Be specific
- Multi-step actions in one response
User location: Amsterdam, Netherlands
Available apps: Vex, Chrry, Peach, Bloom, Vault, Atlas, Hippo, Focus
Grape: Click the Grape button to discover Wine apps and earn credits for feedback
`.repeat(10)

    const { value, compressed, tokens } =
      tokenOptimizerUtils.compress(systemPrompt)

    expect(compressed).toBe(true)
    expect(tokens).toBeGreaterThan(500)

    // Compression should reduce size significantly
    expect(value.length).toBeLessThan(systemPrompt.length / 3)

    // Should decompress back to original
    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(systemPrompt)
  })

  it("should handle Turkish content well", () => {
    const turkishContent = `
Merhaba! Sana nasıl yardımcı olabilirim?
Bugün İstanbul'da hava çok güzel, 25 derece güneşli.
Amsterdam'da yaşıyorum, burada hava oldukça serin.
Santorini'de şirket inzivası olacak, çok heyecanlıyım.
AI sistemleri üzerine çalışıyorum, özellikle M2M feedback loops.
`.repeat(20)

    const { value, compressed } = tokenOptimizerUtils.compress(turkishContent)
    expect(compressed).toBe(true)

    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(turkishContent)
  })

  it("should handle JSON-like content", () => {
    const jsonContent = JSON.stringify({
      user: {
        name: "Iliyan Velinov",
        location: "Amsterdam",
        preferences: ["Turkish", "English"],
        timezone: "Europe/Amsterdam",
      },
      context: {
        appName: "Vex",
        agentName: "sushi",
        credits: 41869,
      },
      calendar: [
        { title: "Weekly Standup", startTime: "2026-05-24T08:00:00Z" },
        { title: "Company Retreat", location: "Santorini" },
      ],
    }).repeat(20)

    const { value, compressed } = tokenOptimizerUtils.compress(jsonContent)
    expect(compressed).toBe(true)

    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(jsonContent)
  })
})

describe("Edge cases", () => {
  it("should handle very long single word (no spaces)", () => {
    const longWord = "a".repeat(10000)
    const { value, compressed } = tokenOptimizerUtils.compress(longWord)
    expect(compressed).toBe(true)
    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(longWord)
  })

  it("should handle special characters", () => {
    const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~\n\t\r".repeat(100)
    const { value, compressed } = tokenOptimizerUtils.compress(specialChars)
    expect(compressed).toBe(true)
    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(specialChars)
  })

  it("should handle emoji content", () => {
    const emojiContent = "🎯🚀💡📝🔧✨🎭👥🎯📌💭👋😅".repeat(50)
    const { value, compressed } = tokenOptimizerUtils.compress(emojiContent)

    // Large enough content should be compressed
    expect(compressed).toBe(true)

    const decompressed = tokenOptimizerUtils.decompress(value)
    expect(decompressed).toBe(emojiContent)
  })
})
