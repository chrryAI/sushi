// #!/usr/bin/env tsx
// /**
//  * Ensure Database Script
//  *
//  * This script ensures the database is fully set up before the app runs:
//  * 1. Creates the database if it doesn't exist (CREATE DATABASE IF NOT EXISTS)
//  * 2. Creates required extensions (vector, uuid-ossp)
//  * 3. Runs Drizzle migrations (idempotent — won't re-run applied migrations)
//  * 4. Seeds the database with default data
//  *
//  * Usage:
//  *   tsx scripts/dev/ensure-db.ts        # Uses DB_URL from env
//  *   tsx scripts/dev/ensure-db.ts --seed # Also run seed after migrations
//  *   pnpm ensure-db                      # Via package.json script
//  */

// import { execSync } from "node:child_process"
// import * as dotenv from "dotenv"
// import postgres from "postgres"

// // Load environment variables
// dotenv.config({ path: ".env.local" })
// dotenv.config()

// const DB_URL = process.env.DB_URL || process.env.DATABASE_URL
// const SHOULD_SEED = process.argv.includes("--seed")

// if (!DB_URL) {
//   console.error("❌ DB_URL or DATABASE_URL environment variable is not set.")
//   console.error("   Please configure your database connection string.")
//   process.exit(1)
// }

// // Parse connection string to extract components
// function parseConnectionString(url: string) {
//   const regex = /postgresql?:\/\/([^:]+):?([^@]*)@([^:]+):?(\d+)\/(.+)/
//   const match = url.match(regex)

//   if (!match || match.length < 6) {
//     throw new Error(`Unable to parse connection string: ${url}`)
//   }

//   return {
//     user: match[1]!,
//     password: match[2] || undefined,
//     host: match[3]!,
//     port: Number(match[4]) || 5432,
//     database: match[5]!,
//   }
// }

// // Connect to PostgreSQL without specifying a database (connects to 'postgres' system db)
// function getSystemConnectionString(url: string): string {
//   const parsed = parseConnectionString(url)
//   const passwordPart = parsed.password ? `:${parsed.password}` : ""
//   return `postgresql://${parsed.user}${passwordPart}@${parsed.host}:${parsed.port}/postgres`
// }

// async function ensureDatabase() {
//   console.log("🔧 Ensuring database exists...")
//   console.log(`   Target DB: ${parseConnectionString(DB_URL!).database}`)

//   const systemUrl = getSystemConnectionString(DB_URL!)
//   const targetDb = parseConnectionString(DB_URL!).database

//   // Connect to system 'postgres' database to create target DB
//   const sql = postgres(systemUrl, {
//     max: 1,
//     idle_timeout: 5,
//     connect_timeout: 10,
//   })

//   try {
//     // Check if database exists
//     const result = await sql`
//       SELECT 1 FROM pg_database WHERE datname = ${targetDb}
//     `

//     if (result.length === 0) {
//       console.log(`   🆕 Creating database '${targetDb}'...`)
//       // PostgreSQL doesn't support CREATE DATABASE IF NOT EXISTS with parameters,
//       // so we use the check above and create it directly
//       await sql.unsafe(`CREATE DATABASE "${targetDb}"`)
//       console.log(`   ✅ Database '${targetDb}' created.`)
//     } else {
//       console.log(`   ✅ Database '${targetDb}' already exists.`)
//     }
//   } catch (error) {
//     console.error(`   ❌ Failed to create database:`, error)
//     throw error
//   } finally {
//     await sql.end()
//   }
// }

// async function ensureExtensions() {
//   console.log("🔧 Ensuring PostgreSQL extensions...")

//   const sql = postgres(DB_URL!, {
//     max: 1,
//     idle_timeout: 5,
//     connect_timeout: 10,
//   })

//   try {
//     await sql`CREATE EXTENSION IF NOT EXISTS vector`
//     console.log("   ✅ pgvector extension ready.")

//     await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
//     console.log("   ✅ uuid-ossp extension ready.")
//   } catch (error) {
//     console.error("   ❌ Failed to create extensions:", error)
//     throw error
//   } finally {
//     await sql.end()
//   }
// }

// function runMigrations() {
//   console.log("🔧 Running Drizzle migrations...")
//   console.log("   (This may take a while for large schemas...)")

//   try {
//     // Run drizzle-kit migrate from packages/vault
//     // Use inherit so user sees progress spinner in real-time
//     execSync("pnpm exec drizzle-kit migrate", {
//       cwd: "packages/vault",
//       stdio: "inherit",
//       env: { ...process.env, MODE: "dev" },
//       timeout: 600_000, // 10 minutes for large schemas
//     })
//     console.log("   ✅ Migrations completed.")
//   } catch (error: any) {
//     console.warn("   ⚠️  drizzle-kit migrate failed, trying fallback...")
//     runMigrationsFallback()
//   }
// }

// function runMigrationsFallback() {
//   console.log("🔧 Applying migrations via fallback (psql)...")

//   const vaultDir = "packages/vault"
//   const drizzleDir = `${vaultDir}/drizzle`

//   // Find all .sql migration files and sort them
//   const fs = require("node:fs")
//   const path = require("node:path")

//   const sqlFiles = fs
//     .readdirSync(drizzleDir)
//     .filter((f: string) => f.endsWith(".sql"))
//     .sort()

//   if (sqlFiles.length === 0) {
//     console.log("   ✅ No migration files found.")
//     return
//   }

//   for (const file of sqlFiles) {
//     const tag = file.replace(".sql", "")
//     console.log(`   📄 Applying ${file}...`)

//     try {
//       // Run the SQL file via psql
//       execSync(`psql "${DB_URL}" -a -f "${path.join(drizzleDir, file)}"`, {
//         stdio: "pipe",
//         timeout: 600_000,
//         encoding: "utf-8",
//       })

//       // Mark as applied in journal
//       const sql = postgres(DB_URL!, { max: 1 })
//       sql`INSERT INTO drizzle."__drizzle_migrations" (id, hash, created_at)
//           VALUES (${sqlFiles.indexOf(file) + 1}, ${tag}, ${Date.now()})
//           ON CONFLICT DO NOTHING`
//         .then(() => sql.end())
//         .catch(() => sql.end())

//       console.log(`   ✅ ${file} applied.`)
//     } catch (err: any) {
//       // If the error is about objects already existing, it's likely fine
//       const stderr = err.stderr || ""
//       if (
//         stderr.includes("already exists") ||
//         err.message?.includes("already exists")
//       ) {
//         console.log(`   ✅ ${file} already applied (skipping).`)
//       } else {
//         console.error(`   ❌ ${file} failed:`, err.message || err)
//         throw err
//       }
//     }
//   }

//   console.log("   ✅ Fallback migrations completed.")
// }

// function runSeed() {
//   console.log("🌱 Seeding database...")

//   try {
//     // Seed script lives in packages/machine/seed.ts
//     // Vault depends on machine, so we run it from machine directory
//     execSync("pnpm exec tsx seed.ts", {
//       cwd: "packages/machine",
//       stdio: "inherit",
//       env: { ...process.env, MODE: "dev" },
//       timeout: 300_000, // 5 minutes for seed
//     })
//     console.log("   ✅ Seed completed.")
//   } catch (error: any) {
//     console.error("   ❌ Seed failed:", error.message || error)
//     throw error
//   }
// }

// async function main() {
//   console.log("🚀 Starting database ensure process...\n")

//   try {
//     // Step 1: Ensure database exists
//     await ensureDatabase()
//     console.log()

//     // Step 2: Ensure extensions exist
//     await ensureExtensions()
//     console.log()

//     // Step 3: Run migrations (idempotent)
//     runMigrations()
//     console.log()

//     // Step 4: Seed if requested
//     if (SHOULD_SEED) {
//       runSeed()
//       console.log()
//     }

//     console.log("🎉 Database is ready!")
//     if (!SHOULD_SEED) {
//       console.log("   💡 Run with --seed flag to also seed the database.")
//     }
//   } catch (error) {
//     console.error("\n💥 Database ensure process failed.")
//     process.exit(1)
//   }
// }

// main()
