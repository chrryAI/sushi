import { FalkorDB } from "falkordb"

const FALKORDB_HOST = process.env.FALKORDB_HOST || "127.0.0.1"
const FALKORDB_PORT = Number.parseInt(process.env.FALKORDB_PORT || "6380", 10)

console.log(`🔷 FalkorDB config: host=${FALKORDB_HOST} port=${FALKORDB_PORT}`)

export type Graph = any

let _singletonGraph: Graph | null = null
let _falkor: unknown | FalkorDB | null = null
let _isGraphAvailable = false
export let isGraphAvailable = false

function setGraphAvailable(value: boolean) {
  _isGraphAvailable = value
  isGraphAvailable = value
}

const noopGraph: Graph = {
  async query(query: string) {
    console.warn("⚠️ FalkorDB disconnected:", query.slice(0, 100))
    return { data: [] }
  },
} as unknown as Graph

function escapeCypherParam(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string") return `"${value.replace(/["\\]/g, "\\$&")}"`
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
  if (Array.isArray(value)) {
    return `[${value.map(escapeCypherParam).join(", ")}]`
  }
  return `"${String(value).replace(/["\\]/g, "\\$&")}"`
}

function buildCypherQuery(
  query: string,
  params?: Record<string, unknown>,
): string {
  if (!params || Object.keys(params).length === 0) return query
  const parts = Object.entries(params).map(
    ([k, v]) => `${k}=${escapeCypherParam(v)}`,
  )
  return `CYPHER ${parts.join(" ")} ${query}`
}

class FalkorSingleton {
  private static instance: FalkorSingleton

  static getInstance(): FalkorSingleton {
    if (!FalkorSingleton.instance) {
      FalkorSingleton.instance = new FalkorSingleton()
    }
    return FalkorSingleton.instance
  }

  private constructor() {}

  private async ensureConnected(): Promise<Graph> {
    if (_singletonGraph && _isGraphAvailable) return _singletonGraph

    try {
      const falkor = await FalkorDB.connect({
        socket: {
          host: FALKORDB_HOST,
          port: FALKORDB_PORT,
          family: 4,
          connectTimeout: 5000,
        },
      })

      await falkor.selectGraph("_healthcheck").query("RETURN 1")

      _falkor = falkor
      _singletonGraph = falkor.selectGraph("Vex")
      setGraphAvailable(true)

      console.log(`✅ FalkorDB connected: ${FALKORDB_HOST}:${FALKORDB_PORT}`)
      return _singletonGraph!
    } catch (err: any) {
      console.warn(`⚠️ FalkorDB failed: ${err.message}`)
      setGraphAvailable(false)
      if (process.env.NODE_ENV === "development") throw err
      return noopGraph
    }
  }

  async queryGraph(query: string, options?: any): Promise<any> {
    const graph = await this.ensureConnected()
    const fullQuery = buildCypherQuery(query.trim(), options?.params)
    console.debug("🗺️ Query:", fullQuery.slice(0, 300))
    return graph.query(fullQuery)
  }

  /** Create a vector index via FalkorDB JS API (more reliable than Cypher procedure) */
  async createVectorIndex(
    label: string,
    dim: number,
    similarityFunction: string,
    property: string,
  ): Promise<any> {
    const graph = await this.ensureConnected()
    try {
      return await graph.createNodeVectorIndex(
        label,
        dim,
        similarityFunction,
        property,
      )
    } catch (err: any) {
      // Already exists or unsupported
      if (
        err.message?.includes("already exists") ||
        err.message?.includes("Index already exists") ||
        err.message?.includes("Duplicate")
      ) {
        return { status: "already_exists" }
      }
      throw err
    }
  }

  async getGraph(): Promise<Graph> {
    return this.ensureConnected()
  }

  async checkConnection(): Promise<boolean> {
    const graph = await this.ensureConnected()
    const connected = graph !== noopGraph
    setGraphAvailable(connected)
    return connected
  }

  close() {
    ;(_falkor as any)?.close()
  }
}

export const queryGraph = FalkorSingleton.getInstance().queryGraph.bind(
  FalkorSingleton.getInstance(),
)
export const getGraph = FalkorSingleton.getInstance().getGraph.bind(
  FalkorSingleton.getInstance(),
)
export const checkGraphConnection =
  FalkorSingleton.getInstance().checkConnection.bind(
    FalkorSingleton.getInstance(),
  )
export const closeGraph = FalkorSingleton.getInstance().close.bind(
  FalkorSingleton.getInstance(),
)

/** Create a vector index via FalkorDB JS API */
export async function createVectorIndex(
  label: string,
  dim: number,
  similarityFunction: string,
  property: string,
): Promise<any> {
  return FalkorSingleton.getInstance().createVectorIndex(
    label,
    dim,
    similarityFunction,
    property,
  )
}

export const graph = { query: queryGraph } as any
export default queryGraph
