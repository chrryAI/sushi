import { FalkorDB } from "falkordb"

const FALKORDB_HOST = process.env.FALKORDB_HOST || "localhost"
const FALKORDB_PORT = Number.parseInt(process.env.FALKORDB_PORT || "6379", 10)

let _falkor: Awaited<ReturnType<typeof FalkorDB.connect>> | null = null
let _graphAvailable = false

try {
  _falkor = await FalkorDB.connect({
    socket: {
      host: FALKORDB_HOST,
      port: FALKORDB_PORT,
      connectTimeout: 3000, // Fail fast in CI / dev environments
    },
  })
  // Verify it's actually FalkorDB by sending a test query
  const testGraph = _falkor.selectGraph("_healthcheck")
  await testGraph.query("RETURN 1")
  _graphAvailable = true
} catch (err: any) {
  if (!process.env.DB_E2E_URL)
    console.warn(
      `⚠️ FalkorDB unavailable at ${FALKORDB_HOST}:${FALKORDB_PORT} — graph features disabled: ${err?.message}`,
    )
}

export const falkor = _falkor
export const isGraphAvailable = _graphAvailable

const noopGraph = {
  query: async () => ({ resultSet: [] }),
}

export const graph =
  _graphAvailable && _falkor ? _falkor.selectGraph("Vex") : (noopGraph as any)

export async function checkGraphConnection() {
  if (!_falkor) return false
  try {
    await _falkor.list()
    console.log(`✅ Connected to FalkorDB at ${FALKORDB_HOST}:${FALKORDB_PORT}`)
    return true
  } catch (error) {
    console.error("❌ Failed to connect to FalkorDB:", error)
    return false
  }
}
