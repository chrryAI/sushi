/**
 * Hybrid PostgreSQL + FalkorDB Schema
 * Compatible with existing Drizzle ORM schema
 *
 * Strategy:
 * - PostgreSQL: Source of truth for all data (users, teams, apps, tasks, etc.)
 * - FalkorDB: Graph relationships for spatial agents, task coordination, analytics
 * - Sync layer: Keep FalkorDB in sync with PostgreSQL changes
 */

import { FalkorDB } from "falkordb"

export interface HybridConfig {
  postgres: {
    connectionString: string
  }
  falkordb: {
    host: string
    port: number
    graphName: string
  }
}

/**
 * Graph Node Types (mirrors PostgreSQL tables)
 */
export type GraphNodeType =
  | "User"
  | "Guest"
  | "Team"
  | "App"
  | "Thread"
  | "Message"
  | "Task"
  | "TaskState"
  | "KanbanBoard"
  | "Agent"
  | "PMAgent"
  | "ApiKey"

/**
 * Graph Relationship Types
 */
export type GraphRelationType =
  | "OWNS" // User/Team owns App/Board
  | "MEMBER_OF" // User member of Team
  | "ASSIGNED_TO" // Agent assigned to Task
  | "MANAGES" // PM Agent manages other Agents
  | "COORDINATES" // PM Agent coordinates Tasks
  | "BELONGS_TO" // Task belongs to Board/Column
  | "DEPENDS_ON" // Task depends on another Task
  | "COMMUNICATES_WITH" // Agent communicates with Agent
  | "HAS_ACCESS_TO" // Agent has access to ApiKey
  | "CREATED_BY" // Entity created by User
  | "RELATED_TO" // Generic relationship

/**
 * Sync Strategy
 */
export interface SyncStrategy {
  mode: "realtime" | "batch" | "manual"
  batchInterval?: number // milliseconds
  tables: string[] // Which PostgreSQL tables to sync
}

/**
 * Hybrid Database Manager
 * Manages both PostgreSQL and FalkorDB
 */
export class HybridDB {
  private pgClient: any = null
  private falkorDB: any = null
  private graph: any = null
  private config: HybridConfig

  constructor(config: HybridConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    // Connect to FalkorDB
    this.falkorDB = await FalkorDB.connect({
      socket: {
        host: this.config.falkordb.host,
        port: this.config.falkordb.port,
      },
    })
    this.graph = this.falkorDB.selectGraph(this.config.falkordb.graphName)

    console.log("✅ Connected to FalkorDB")
  }

  async disconnect(): Promise<void> {
    if (this.falkorDB) {
      await this.falkorDB.close()
      this.falkorDB = null
      this.graph = null
    }
  }

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  /**
   * Sync PostgreSQL data to FalkorDB graph
   */
  async syncFromPostgres(data: {
    type: GraphNodeType
    id: string
    properties: Record<string, any>
    relationships?: Array<{
      type: GraphRelationType
      targetType: GraphNodeType
      targetId: string
    }>
  }): Promise<void> {
    if (!this.graph) await this.connect()

    // Create or update node
    await this.graph.query(
      `
      MERGE (n:${data.type} {id: $id})
      SET n += $properties
    `,
      {
        params: {
          id: data.id,
          properties: data.properties,
        },
      },
    )

    // Create relationships
    if (data.relationships) {
      for (const rel of data.relationships) {
        await this.graph.query(
          `
          MATCH (source:${data.type} {id: $sourceId})
          MATCH (target:${rel.targetType} {id: $targetId})
          MERGE (source)-[:${rel.type}]->(target)
        `,
          {
            params: {
              sourceId: data.id,
              targetId: rel.targetId,
            },
          },
        )
      }
    }
  }

  /**
   * Batch sync multiple entities
   */
  async batchSync(
    entities: Array<{
      type: GraphNodeType
      id: string
      properties: Record<string, any>
    }>,
  ): Promise<void> {
    if (!this.graph) await this.connect()

    for (const entity of entities) {
      await this.syncFromPostgres(entity)
    }
  }

  // ============================================
  // QUERY OPERATIONS (Graph-specific)
  // ============================================

  /**
   * Find optimal agent for task based on graph relationships
   */
  async findOptimalAgentForTask(taskId: string): Promise<{
    agentId: string
    score: number
    reason: string
  } | null> {
    if (!this.graph) await this.connect()

    // Find agents with:
    // 1. Low current workload
    // 2. Similar past tasks
    // 3. Good performance history
    const result = await this.graph.query(
      `
      MATCH (task:Task {id: $taskId})
      MATCH (agent:Agent)
      WHERE agent.status = 'idle' OR agent.status = 'working'
      
      // Calculate workload
      OPTIONAL MATCH (agent)-[:ASSIGNED_TO]->(otherTask:Task)
      WHERE otherTask.status <> 'done'
      WITH task, agent, COUNT(otherTask) as workload
      
      // Calculate experience with similar tasks
      OPTIONAL MATCH (agent)-[:ASSIGNED_TO]->(completedTask:Task)
      WHERE completedTask.status = 'done' 
        AND completedTask.tags IN task.tags
      WITH task, agent, workload, COUNT(completedTask) as experience
      
      // Calculate score
      WITH agent, 
           (100 - workload * 10) as workloadScore,
           (experience * 5) as experienceScore,
           (100 - workload * 10 + experience * 5) as totalScore
      
      WHERE totalScore > 50
      RETURN agent.id as agentId, totalScore as score
      ORDER BY totalScore DESC
      LIMIT 1
    `,
      {
        params: { taskId },
      },
    )

    if (!result || !result.data || result.data.length === 0) {
      return null
    }

    const row = result.data[0]
    return {
      agentId: row.agentId,
      score: row.score,
      reason: `Workload-optimized assignment (score: ${row.score})`,
    }
  }

  /**
   * Get PM Agent's team overview
   */
  async getPMTeamOverview(pmAgentId: string): Promise<{
    totalAgents: number
    activeAgents: number
    totalTasks: number
    tasksByStatus: Record<string, number>
    agentWorkloads: Array<{ agentId: string; taskCount: number }>
  }> {
    if (!this.graph) await this.connect()

    // Get all agents managed by PM
    const agentsResult = await this.graph.query(
      `
      MATCH (pm:PMAgent {id: $pmAgentId})-[:MANAGES]->(agent:Agent)
      RETURN COUNT(agent) as total,
             SUM(CASE WHEN agent.status = 'working' THEN 1 ELSE 0 END) as active
    `,
      { params: { pmAgentId } },
    )

    // Get task distribution
    const tasksResult = await this.graph.query(
      `
      MATCH (pm:PMAgent {id: $pmAgentId})-[:COORDINATES]->(task:Task)
      RETURN COUNT(task) as total, task.status as status
    `,
      { params: { pmAgentId } },
    )

    // Get agent workloads
    const workloadResult = await this.graph.query(
      `
      MATCH (pm:PMAgent {id: $pmAgentId})-[:MANAGES]->(agent:Agent)
      OPTIONAL MATCH (agent)-[:ASSIGNED_TO]->(task:Task)
      WHERE task.status <> 'done'
      RETURN agent.id as agentId, COUNT(task) as taskCount
      ORDER BY taskCount DESC
    `,
      { params: { pmAgentId } },
    )

    const tasksByStatus: Record<string, number> = {}
    if (tasksResult && tasksResult.data) {
      for (const row of tasksResult.data) {
        tasksByStatus[row.status] = row.total
      }
    }

    const agentWorkloads: Array<{ agentId: string; taskCount: number }> = []
    if (workloadResult && workloadResult.data) {
      for (const row of workloadResult.data) {
        agentWorkloads.push({
          agentId: row.agentId,
          taskCount: row.taskCount,
        })
      }
    }

    return {
      totalAgents: agentsResult?.data?.[0]?.total || 0,
      activeAgents: agentsResult?.data?.[0]?.active || 0,
      totalTasks: Object.values(tasksByStatus).reduce((a, b) => a + b, 0),
      tasksByStatus,
      agentWorkloads,
    }
  }

  /**
   * Find task dependencies and blockers
   */
  async getTaskDependencies(taskId: string): Promise<{
    blockedBy: string[]
    blocking: string[]
    canStart: boolean
  }> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(
      `
      MATCH (task:Task {id: $taskId})
      
      // Find tasks this depends on
      OPTIONAL MATCH (task)-[:DEPENDS_ON]->(blocker:Task)
      WHERE blocker.status <> 'done'
      
      // Find tasks that depend on this
      OPTIONAL MATCH (blocked:Task)-[:DEPENDS_ON]->(task)
      
      RETURN 
        COLLECT(DISTINCT blocker.id) as blockedBy,
        COLLECT(DISTINCT blocked.id) as blocking
    `,
      { params: { taskId } },
    )

    if (!result || !result.data || result.data.length === 0) {
      return { blockedBy: [], blocking: [], canStart: true }
    }

    const row = result.data[0]
    const blockedBy = row.blockedBy.filter((id: string) => id !== null)
    const blocking = row.blocking.filter((id: string) => id !== null)

    return {
      blockedBy,
      blocking,
      canStart: blockedBy.length === 0,
    }
  }

  /**
   * Get agent communication network
   */
  async getAgentNetwork(
    agentId: string,
    depth: number = 2,
  ): Promise<{
    agents: Array<{ id: string; name: string; distance: number }>
    connections: Array<{ from: string; to: string; type: string }>
  }> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(
      `
      MATCH path = (agent:Agent {id: $agentId})-[:COMMUNICATES_WITH*1..$depth]-(other:Agent)
      RETURN 
        other.id as id,
        other.name as name,
        length(path) as distance
      ORDER BY distance ASC
    `,
      {
        params: {
          agentId,
          depth,
        },
      },
    )

    const agents: Array<{ id: string; name: string; distance: number }> = []
    if (result && result.data) {
      for (const row of result.data) {
        agents.push({
          id: row.id,
          name: row.name,
          distance: row.distance,
        })
      }
    }

    // Get connections
    const connectionsResult = await this.graph.query(
      `
      MATCH (a1:Agent)-[r:COMMUNICATES_WITH]-(a2:Agent)
      WHERE a1.id IN $agentIds OR a2.id IN $agentIds
      RETURN a1.id as from, a2.id as to, type(r) as type
    `,
      {
        params: {
          agentIds: [agentId, ...agents.map((a) => a.id)],
        },
      },
    )

    const connections: Array<{ from: string; to: string; type: string }> = []
    if (connectionsResult && connectionsResult.data) {
      for (const row of connectionsResult.data) {
        connections.push({
          from: row.from,
          to: row.to,
          type: row.type,
        })
      }
    }

    return { agents, connections }
  }
}

export default HybridDB
