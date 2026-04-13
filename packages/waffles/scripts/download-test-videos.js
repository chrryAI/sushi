#!/usr/bin/env node

/**
 * Download SMALL Google Sample Videos for Testing
 * All videos under 15MB to avoid GitHub file size limits
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")

const VIDEOS_DIR = path.join(__dirname, "../src/shared/video")

// Google's SMALLEST sample videos (all under 15MB)
const sampleVideos = [
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    filename: "testVideo1.mp4",
    title: "For Bigger Blazes",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    filename: "testVideo2.mp4",
    title: "For Bigger Escapes",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    filename: "testVideo3.mp4",
    title: "For Bigger Fun",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    filename: "testVideo4.mp4",
    title: "For Bigger Joyrides",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    filename: "testVideo5.mp4",
    title: "For Bigger Meltdowns",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    filename: "testVideo6.mp4",
    title: "We Are Going On Bullrun",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    filename: "testVideo7.mp4",
    title: "For Bigger Blazes (2)",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    filename: "testVideo8.mp4",
    title: "For Bigger Escapes (2)",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    filename: "testVideo9.mp4",
    title: "For Bigger Joyrides (2)",
  },
  {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    filename: "testVideo10.mp4",
    title: "For Bigger Meltdowns (2)",
  },
]

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    const request = https.get(url.replace("http:", "https:"), (response) => {
      if (response.statusCode === 200) {
        response.pipe(file)
      } else {
        file.close()
        fs.unlink(dest, () => {})
        reject(new Error(`Failed to download: ${response.statusCode}`))
      }
    })

    file.on("finish", () => {
      file.close()
      resolve()
    })

    request.on("error", (err) => {
      file.close()
      fs.unlink(dest, () => {})
      reject(err)
    })

    file.on("error", (err) => {
      file.close()
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

/**
 * Main execution
 */
async function main() {
  console.log("🎬 Downloading SMALL Google Sample Videos...\n")

  // Create videos directory if it doesn't exist
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  }

  // Remove old video files
  const oldFiles = fs
    .readdirSync(VIDEOS_DIR)
    .filter((f) => f.endsWith(".mp4") || f.endsWith(".webm"))
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(VIDEOS_DIR, file))
    console.log(`🗑️  Removed old file: ${file}`)
  }

  console.log("")

  // Download new videos
  let completed = 0
  let totalSize = 0
  for (const video of sampleVideos) {
    const dest = path.join(VIDEOS_DIR, video.filename)

    try {
      console.log(`⬇️  Downloading ${video.title}...`)
      await downloadFile(video.url, dest)

      const stats = fs.statSync(dest)
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
      totalSize += stats.size

      completed++
      console.log(
        `✅ ${video.title} (${sizeMB}MB) [${completed}/${sampleVideos.length}]\n`,
      )
    } catch (error) {
      console.error(`❌ Failed to download ${video.title}:`, error.message)
    }
  }

  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
  console.log(
    `\n🎉 Done! Downloaded ${completed}/${sampleVideos.length} videos`,
  )
  console.log(`📁 Location: ${VIDEOS_DIR}`)
  console.log(`📊 Total size: ${totalSizeMB}MB (GitHub-friendly!)`)
}

main().catch(console.error)
