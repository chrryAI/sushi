import crypto from "node:crypto"

// Encryption configuration
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const _SALT_LENGTH = 64

/**
 * Get encryption key from environment variable
 * This should be a 32-byte (256-bit) key stored in ENCRYPTION_KEY env var
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // Ensure key is exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(key, "hex")
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)")
  }

  return keyBuffer
}

/**
 * Encrypt a string value (e.g., API key)
 * Returns: base64 encoded string containing IV + encrypted data + auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext must be a non-empty string")
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "hex"), authTag])

  return combined.toString("base64")
}

/**
 * Decrypt an encrypted string
 * Input: base64 encoded string containing IV + encrypted data + auth tag
 * Returns: original plaintext string
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== "string") {
    throw new Error("Encrypted data must be a non-empty string")
  }

  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, "base64")

  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(
    IV_LENGTH,
    combined.length - AUTH_TAG_LENGTH,
  )

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once and store the output in ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}
