#!/usr/bin/env node

/**
 * Download Sample Images for Testing
 * Replaces local test images with diverse, high-quality samples
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")

const IMAGES_DIR = path.join(__dirname, "../src/shared/image")

// Diverse sample images from various sources
const sampleImages = [
  {
    url: "https://picsum.photos/id/1/1920/1080.jpg",
    filename: "testImage1.jpeg",
    title: "Nature Landscape",
  },
  {
    url: "https://picsum.photos/id/10/1920/1080.jpg",
    filename: "testImage2.jpeg",
    title: "Forest Path",
  },
  {
    url: "https://picsum.photos/id/20/1920/1080.jpg",
    filename: "testImage3.jpeg",
    title: "Mountain View",
  },
  {
    url: "https://picsum.photos/id/30/1920/1080.jpg",
    filename: "testImage4.jpeg",
    title: "Urban Architecture",
  },
  {
    url: "https://picsum.photos/id/40/1920/1080.jpg",
    filename: "testImage5.jpeg",
    title: "Wildlife",
  },
  {
    url: "https://picsum.photos/id/50/1920/1080.jpg",
    filename: "testImage6.jpeg",
    title: "Ocean Waves",
  },
  {
    url: "https://picsum.photos/id/60/1920/1080.jpg",
    filename: "testImage7.jpeg",
    title: "Desert Landscape",
  },
  {
    url: "https://picsum.photos/id/70/1920/1080.jpg",
    filename: "testImage8.jpeg",
    title: "City Skyline",
  },
  {
    url: "https://picsum.photos/id/80/1920/1080.jpg",
    filename: "testImage9.jpeg",
    title: "Abstract Art",
  },
  {
    url: "https://picsum.photos/id/90/1920/1080.jpg",
    filename: "testImage10.jpeg",
    title: "Vintage Photo",
  },
]

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject)
      }

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
  console.log("🖼️  Downloading Sample Images...\n")

  // Create images directory if it doesn't exist
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true })
  }

  // Remove old files
  const oldFiles = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => f.endsWith(".jpeg") || f.endsWith(".jpg"))
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(IMAGES_DIR, file))
    console.log(`🗑️  Removed old file: ${file}`)
  }

  console.log("")

  // Download new images
  let completed = 0
  for (const image of sampleImages) {
    const dest = path.join(IMAGES_DIR, image.filename)

    try {
      console.log(`⬇️  Downloading ${image.title}...`)
      await downloadFile(image.url, dest)

      const stats = fs.statSync(dest)
      const sizeKB = (stats.size / 1024).toFixed(2)

      completed++
      console.log(
        `✅ ${image.title} (${sizeKB}KB) [${completed}/${sampleImages.length}]\n`,
      )
    } catch (error) {
      console.error(`❌ Failed to download ${image.title}:`, error.message)
    }
  }

  console.log(
    `\n🎉 Done! Downloaded ${completed}/${sampleImages.length} images`,
  )
  console.log(`📁 Location: ${IMAGES_DIR}`)
}

main().catch(console.error)
