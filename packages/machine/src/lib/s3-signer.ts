import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const verifiedBuckets = new Set<string>()

export interface S3Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
}

type StorageContext =
  | "thread"
  | "chat"
  | "apps"
  | "other"
  | "user"
  | "tribe"
  | "desktop"
  | "ramen"
  | "app"

function isAwsEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return false
  try {
    const url = new URL(
      endpoint.includes("://") ? endpoint : `https://${endpoint}`,
    )
    const hostname = url.hostname
    return hostname === "amazonaws.com" || hostname.endsWith(".amazonaws.com")
  } catch {
    return false
  }
}

function getBucketForContext(context: StorageContext): string {
  const bucketMap: Record<StorageContext, string> = {
    thread:
      process.env.S3_BUCKET_NAME_PRIVATE ||
      process.env.S3_BUCKET_PRIVATE ||
      "chrry-private-prod-eu",
    chat: process.env.S3_BUCKET_NAME || "chrry-chat-files-prod-eu",
    apps: process.env.S3_BUCKET_NAME_APPS || "chrry-app-profiles-prod-eu",
    other: process.env.S3_BUCKET_NAME_OTHER || "chrry-files-prod-eu",
    user: process.env.S3_BUCKET_NAME_USER || "chrry-user-files-prod-eu",
    tribe: process.env.S3_BUCKET_NAME_TRIBE || "chrry-tribe-files-prod-eu",
    desktop: process.env.S3_BUCKET_NAME_DESKTOP || "chrry-desktop-prod-eu",
    ramen: process.env.S3_BUCKET_NAME_RAMEN || "chrry-ramen-prod-eu",
    app: process.env.S3_BUCKET_NAME_APP || "chrry-app-files-prod-eu",
  }
  return bucketMap[context]
}

export async function getS3Config(
  context: StorageContext = "chat",
): Promise<S3Config | null> {
  if (
    !process.env.S3_ENDPOINT ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  ) {
    return null
  }

  const bucket =
    getBucketForContext(context) ||
    process.env.S3_BUCKET_NAME ||
    "chrry-chat-files-prod-eu"

  const isAWS = isAwsEndpoint(process.env.S3_ENDPOINT)
  const publicUrl = isAWS
    ? `https://${bucket}.s3.${process.env.S3_REGION || "eu-central-1"}.amazonaws.com`
    : process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT

  return {
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket,
    publicUrl,
  }
}

export function getS3Client(config: S3Config): S3Client {
  const isAWS = isAwsEndpoint(config.endpoint)

  return new S3Client({
    endpoint: config.endpoint,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: !isAWS,
  })
}

export async function getPresignedUrl(
  s3Key: string,
  context: StorageContext = "chat",
  expiresIn = 900,
): Promise<string | null> {
  try {
    const config = await getS3Config(context)
    if (!config) {
      console.log(`❌ getPresignedUrl: config is null`)
      return null
    }

    const s3Client = getS3Client(config)

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: s3Key,
    })

    const presignedUrl = await getSignedUrl(s3Client as any, command, {
      expiresIn,
    })

    if (config.endpoint !== config.publicUrl) {
      const presignedUrlObj = new URL(presignedUrl)
      const publicUrlObj = new URL(config.publicUrl)
      presignedUrlObj.protocol = publicUrlObj.protocol
      presignedUrlObj.hostname = publicUrlObj.hostname
      presignedUrlObj.port = publicUrlObj.port
      return presignedUrlObj.toString()
    }

    return presignedUrl
  } catch (err) {
    console.error("❌ Failed to generate presigned URL:", err)
    return null
  }
}
