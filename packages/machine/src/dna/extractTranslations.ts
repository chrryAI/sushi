#!/usr/bin/env node

/**
 * Extract translatable content from database and generate translation file
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { db, getStores, isProd, isSeedSafe } from "../../index"
import { apps } from "../schema"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const _isCI = process.env.CI

export async function extractTranslations() {
  if (isProd || isSeedSafe) {
    return
  }

  console.log("\n🌍 Extracting translations from database...\n")

  // Load existing translations to avoid duplicates
  const translationPath = path.join(__dirname, "en.json")
  let existingTranslations: Record<string, string> = {}

  if (fs.existsSync(translationPath)) {
    existingTranslations = JSON.parse(fs.readFileSync(translationPath, "utf-8"))
  }

  const translations: Record<string, string> = { ...existingTranslations }
  let newCount = 0

  // Helper to add translation (only if key doesn't exist)
  function addTranslation(key: string, value: string) {
    if (!value || typeof value !== "string") return
    if (translations[key]) {
      return // Skip existing
    }
    translations[key] = value
    newCount++
  }

  // Get all stores from database
  const storesResult = await getStores({ includePublic: true })
  const stores = storesResult.stores

  console.log(`📦 Processing ${stores.length} stores...`)

  for (const { store } of stores) {
    addTranslation(store.name, store.name)
    if (store.title) {
      addTranslation(store.title, store.title)
    }
    if (store.description) {
      addTranslation(store.description, store.description)
    }
  }

  // Get all apps from database
  const appsResult = await db.select().from(apps).limit(1000)

  console.log(`🎯 Processing ${appsResult.length} apps...`)

  for (const app of appsResult) {
    addTranslation(app.name, app.name)
    addTranslation(app.title, app.title)

    if (app.subtitle) {
      addTranslation(app.subtitle, app.subtitle)
    }

    if (app.description) {
      addTranslation(app.description, app.description)
    }

    if (app.placeholder) {
      addTranslation(app.placeholder, app.placeholder)
    }

    if (app.tipsTitle) {
      addTranslation(app.tipsTitle, app.tipsTitle)
    }

    if (app.tips && Array.isArray(app.tips)) {
      app.tips.forEach((tip) => {
        if (tip.content) {
          addTranslation(tip.content, tip.content)
        }
      })
    }

    if (app.highlights && Array.isArray(app.highlights)) {
      app.highlights.forEach((highlight) => {
        if (highlight.title) {
          addTranslation(highlight.title, highlight.title)
        }
        if (highlight.content) {
          addTranslation(highlight.content, highlight.content)
        }
      })
    }

    if (app.featureList && Array.isArray(app.featureList)) {
      app.featureList.forEach((feature) => {
        addTranslation(feature, feature)
      })
    }
  }

  // Write to file
  const outputDir = path.dirname(translationPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(
    translationPath,
    JSON.stringify(translations, null, 2),
    "utf-8",
  )

  console.log(`\n✅ Translation file generated: ${translationPath}`)
  console.log(`📊 Total keys: ${Object.keys(translations).length}`)
  console.log(`🆕 New keys added: ${newCount}`)
}
