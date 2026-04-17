#!/usr/bin/env node
import * as p from "@clack/prompts"
import { execa } from "execa"
import { setupAgency } from "./modes/agency.js"
import { setupLocal } from "./modes/local.js"
import { setupSovereign } from "./modes/sovereign.js"

async function main() {
  console.clear()

  p.intro("🍣 chopstick — vex sovereign AI platform")

  const weapon = await p.select({
    message: "Choose your weapon",
    options: [
      {
        value: "local",
        label: "⚔️  Local",
        hint: "Run everything on your machine (Colima + Docker)",
      },
      {
        value: "sovereign",
        label: "🏰  Sovereign",
        hint: "Self-hosted on your own server — $1,000/mo",
      },
      {
        value: "agency",
        label: "🚀  Agency",
        hint: "We host it for you — container + subdomain — $5,000/mo",
      },
    ],
  })

  if (p.isCancel(weapon)) {
    p.cancel("Cancelled.")
    process.exit(0)
  }

  switch (weapon) {
    case "local":
      await setupLocal()
      break
    case "sovereign":
      await setupSovereign()
      break
    case "agency":
      await setupAgency()
      break
  }

  p.outro("🍒 Done! Welcome to the vex ecosystem.")
}

main().catch((err) => {
  p.log.error(String(err))
  process.exit(1)
})
