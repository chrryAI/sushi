#!/usr/bin/env node

/**
 * Upload DMG files to MinIO
 * Uses the existing MinIO configuration from apps/api
 */

import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from "dotenv"

dotenv.config({ path: join(__dirname, "../../apps/api/.env") })

// MinIO configuration from your existing setup
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
})

const BUCKET = "vex" // Your bucket name
const INSTALLS_PATH = "../../public/installs"
const PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT

async function uploadDMGs() {
  console.log("🚀 Uploading DMGs to MinIO...")
  console.log(`📦 Bucket: ${BUCKET}`)
  console.log(`🔗 Endpoint: ${process.env.S3_ENDPOINT}`)
  console.log("")

  // Get all DMG files
  const installsDir = join(__dirname, INSTALLS_PATH)
  const files = readdirSync(installsDir).filter(
    (f) => f.endsWith(".dmg") && !f.includes("🍒"),
  )

  console.log(`Found ${files.length} DMG files:`)
  files.forEach((f) => console.log(`  - ${f}`))
  console.log("")

  // Upload each file
  for (const file of files) {
    const filePath = join(installsDir, file)
    const fileBuffer = readFileSync(filePath)
    const key = `installs/${file}`

    console.log(`📤 Uploading ${file}...`)

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: "application/x-apple-diskimage",
          CacheControl: "public, max-age=31536000",
        }),
      )

      const url = `${PUBLIC_URL}/${BUCKET}/${key}`
      console.log(`✅ Uploaded: ${url}`)
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message)
    }
  }

  // Set public read policy
  console.log("")
  console.log("🔓 Setting public read policy...")
  try {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/installs/*`],
        },
      ],
    }

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET,
        Policy: JSON.stringify(policy),
      }),
    )
    console.log("✅ Public read policy set")
  } catch (error) {
    console.log("⚠️  Policy already set or error:", error.message)
  }

  console.log("")
  console.log("✅ Deployment complete!")
  console.log("")
  console.log("📍 Apps available at:")
  files.forEach((file) => {
    console.log(`   ${PUBLIC_URL}/${BUCKET}/installs/${file}`)
  })
  console.log("")
  console.log("🎉 Ready to announce!")
}

uploadDMGs().catch(console.error)
