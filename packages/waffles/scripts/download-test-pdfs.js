#!/usr/bin/env node

/**
 * Download Real-World Sample PDFs for Testing
 * Small, reliable PDFs from trusted sources
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")
const http = require("node:http")

const PDFS_DIR = path.join(__dirname, "../src/shared/pdf")

// Real-world sample PDFs from reliable sources (all under 1MB)
const samplePDFs = [
  {
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    filename: "testPdf1.pdf",
    title: "W3C Dummy PDF",
  },
  {
    url: "https://www.ets.org/pdfs/gre/sample-issue-task.pdf",
    filename: "testPdf2.pdf",
    title: "GRE Sample Task",
  },
  {
    url: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
    filename: "testPdf3.pdf",
    title: "Sample Document",
  },
  {
    url: "https://www.clickdimensions.com/links/TestPDFfile.pdf",
    filename: "testPdf4.pdf",
    title: "Test PDF File",
  },
  {
    url: "https://www.orimi.com/pdf-test.pdf",
    filename: "testPdf5.pdf",
    title: "PDF Test",
  },
  {
    url: "https://pdfobject.com/pdf/sample.pdf",
    filename: "testPdf6.pdf",
    title: "PDFObject Sample",
  },
  {
    url: "https://www.africau.edu/images/default/sample.pdf",
    filename: "testPdf7.pdf",
    title: "University Sample",
  },
  {
    url: "http://www.pdf995.com/samples/pdf.pdf",
    filename: "testPdf8.pdf",
    title: "PDF995 Sample",
  },
  {
    url: "https://www.soundczech.cz/temp/lorem-ipsum.pdf",
    filename: "testPdf9.pdf",
    title: "Lorem Ipsum",
  },
  {
    url: "https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf",
    filename: "testPdf10.pdf",
    title: "XSL-FO Basic Link",
  },
]

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith("https") ? https : http

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlink(dest, () => {})
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject)
      }

      if (response.statusCode === 200) {
        response.pipe(file)

        file.on("finish", () => {
          file.close()
          resolve()
        })
      } else {
        file.close()
        fs.unlink(dest, () => {})
        reject(new Error(`HTTP ${response.statusCode}`))
      }
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

    request.setTimeout(10000, () => {
      request.destroy()
      file.close()
      fs.unlink(dest, () => {})
      reject(new Error("Download timeout"))
    })
  })
}

/**
 * Main execution
 */
async function main() {
  console.log("📄 Downloading Real-World Sample PDFs...\n")

  // Create PDFs directory if it doesn't exist
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true })
  }

  // Remove old files
  const oldFiles = fs.readdirSync(PDFS_DIR).filter((f) => f.endsWith(".pdf"))
  for (const file of oldFiles) {
    fs.unlinkSync(path.join(PDFS_DIR, file))
    console.log(`🗑️  Removed old file: ${file}`)
  }

  console.log("")

  // Download new PDFs
  let completed = 0
  for (const pdf of samplePDFs) {
    const dest = path.join(PDFS_DIR, pdf.filename)

    try {
      console.log(`⬇️  Downloading ${pdf.title}...`)
      await downloadFile(pdf.url, dest)

      const stats = fs.statSync(dest)
      const sizeKB = (stats.size / 1024).toFixed(2)

      completed++
      console.log(
        `✅ ${pdf.title} (${sizeKB}KB) [${completed}/${samplePDFs.length}]\n`,
      )
    } catch (error) {
      console.error(`❌ Failed to download ${pdf.title}: ${error.message}`)
      console.log(`   Skipping...\n`)
    }
  }

  console.log(`\n🎉 Done! Downloaded ${completed}/${samplePDFs.length} PDFs`)
  console.log(`📁 Location: ${PDFS_DIR}`)

  if (completed < samplePDFs.length) {
    console.log(`\n⚠️  ${samplePDFs.length - completed} PDFs failed to download`)
  }
}

main().catch(console.error)
