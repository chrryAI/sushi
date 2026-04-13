#!/usr/bin/env node

/**
 * Download Sample Audio Files for Testing
 * Replaces local test audio with diverse, high-quality samples
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")

const AUDIO_DIR = path.join(__dirname, "../src/shared/audio")

// Diverse sample audio files from public sources
const sampleAudio = [
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    filename: "testAudio1.mp3",
    title: "SoundHelix Song 1",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    filename: "testAudio2.mp3",
    title: "SoundHelix Song 2",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    filename: "testAudio3.mp3",
    title: "SoundHelix Song 3",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    filename: "testAudio4.mp3",
    title: "SoundHelix Song 4",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    filename: "testAudio5.mp3",
    title: "SoundHelix Song 5",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    filename: "testAudio6.mp3",
    title: "SoundHelix Song 6",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    filename: "testAudio7.mp3",
    title: "SoundHelix Song 7",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    filename: "testAudio8.mp3",
    title: "SoundHelix Song 8",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    filename: "testAudio9.mp3",
    title: "SoundHelix Song 9",
  },
  {
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    filename: "testAudio10.mp3",
    title: "SoundHelix Song 10",
  },
]

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    const protocol = url.startsWith("https") ? https : require("node:http")

    const request = protocol.get(url, (response) => {
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
  console.log("🎵 Downloading Sample Audio Files...\n")

  // Create audio directory if it doesn't exist
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true })
  }

  // Remove old files
  const oldFiles = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith(".wav") || f.endsWith(".mp3"))
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(AUDIO_DIR, file))
    console.log(`🗑️  Removed old file: ${file}`)
  }

  console.log("")

  // Download new audio files
  let completed = 0
  for (const audio of sampleAudio) {
    const dest = path.join(AUDIO_DIR, audio.filename)

    try {
      console.log(`⬇️  Downloading ${audio.title}...`)
      await downloadFile(audio.url, dest)

      const stats = fs.statSync(dest)
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

      completed++
      console.log(
        `✅ ${audio.title} (${sizeMB}MB) [${completed}/${sampleAudio.length}]\n`,
      )
    } catch (error) {
      console.error(`❌ Failed to download ${audio.title}:`, error.message)
      console.log(`   Skipping and continuing...\n`)
    }
  }

  console.log(
    `\n🎉 Done! Downloaded ${completed}/${sampleAudio.length} audio files`,
  )
  console.log(`📁 Location: ${AUDIO_DIR}`)
}

main().catch(console.error)
