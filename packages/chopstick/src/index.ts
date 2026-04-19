#!/usr/bin/env node

// chopstick mcp  → start MCP server
// chopstick      → setup wizard

const [, , subcommand] = process.argv

if (subcommand === "mcp") {
  import("./mcp/index.js")
} else if (subcommand === "proxy") {
  import("./proxy/index.js")
} else {
  import("./cli/index.js")
}
