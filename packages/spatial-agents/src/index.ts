/**
 * @chrryai/spatial-agents - Spatial Multi-Agent Coordination System
 * Uses FalkorDB graph database for agent positioning, communication, and task coordination
 */

import { FalkorDB } from "falkordb"

export interface SpatialConfig {
  host?: string
  port?: number
  graphName?: string
}

export interface Agent {
  id: string
  name: string
  type: "coder" | "tester" | "reviewer" | "planner" | "debugger"
  position: { x: number; y: number; z: number } // 3D spatial coordinates
  capabilities: string[]
  status: "idle" | "working" | "blocked" | "waiting"
  currentTask?: string
  metadata?: Record<string, any>
}

export interface Task {
  id: string
  title: string
  description: string
  type: string
  priority: number
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed"
  assignedTo?: string // Agent ID
  dependencies?: string[] // Task IDs
  position?: { x: number; y: number; z: number } // Task location in space
  metadata?: Record<string, any>
}

export interface Message {
  from: string // Agent ID
  to: string // Agent ID or 'broadcast'
  content: string
  type: "request" | "response" | "notification" | "coordination"
  timestamp: number
  metadata?: Record<string, any>
}

export class SpatialAgentSystem {
  private db: any = null
  private graph: any = null
  private config: Required<SpatialConfig>

  constructor(config: SpatialConfig = {}) {
    this.config = {
      host: config.host || "localhost",
      port: config.port || 6380,
      graphName: config.graphName || "spatial_agents",
    }
  }

  async connect(): Promise<void> {
    if (this.graph) return

    this.db = await FalkorDB.connect({
      socket: { host: this.config.host, port: this.config.port },
    })
    this.graph = this.db.selectGraph(this.config.graphName)
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.graph = null
    }
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  async registerAgent(agent: Agent): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      CREATE (a:Agent {
        id: $id,
        name: $name,
        type: $type,
        x: $x,
        y: $y,
        z: $z,
        capabilities: $capabilities,
        status: $status,
        currentTask: $currentTask,
        metadata: $metadata,
        registeredAt: $timestamp
      })
    `,
      {
        params: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          x: agent.position.x,
          y: agent.position.y,
          z: agent.position.z,
          capabilities: JSON.stringify(agent.capabilities),
          status: agent.status,
          currentTask: agent.currentTask || "",
          metadata: JSON.stringify(agent.metadata || {}),
          timestamp: Date.now(),
        },
      },
    )
  }

  async updateAgentPosition(
    agentId: string,
    position: { x: number; y: number; z: number },
  ): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      MATCH (a:Agent {id: $id})
      SET a.x = $x, a.y = $y, a.z = $z, a.lastMoved = $timestamp
    `,
      {
        params: {
          id: agentId,
          x: position.x,
          y: position.y,
          z: position.z,
          timestamp: Date.now(),
        },
      },
    )
  }

  async updateAgentStatus(
    agentId: string,
    status: Agent["status"],
    currentTask?: string,
  ): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      MATCH (a:Agent {id: $id})
      SET a.status = $status, a.currentTask = $currentTask, a.lastUpdated = $timestamp
    `,
      {
        params: {
          id: agentId,
          status,
          currentTask: currentTask || "",
          timestamp: Date.now(),
        },
      },
    )
  }

  async findNearbyAgents(
    position: { x: number; y: number; z: number },
    radius: number,
  ): Promise<Agent[]> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(
      `
      MATCH (a:Agent)
      WITH a, 
           sqrt(pow(a.x - $x, 2) + pow(a.y - $y, 2) + pow(a.z - $z, 2)) as distance
      WHERE distance <= $radius
      RETURN a.id as id, a.name as name, a.type as type, 
             a.x as x, a.y as y, a.z as z,
             a.capabilities as capabilities, a.status as status,
             a.currentTask as currentTask, distance
      ORDER BY distance ASC
    `,
      {
        params: {
          x: position.x,
          y: position.y,
          z: position.z,
          radius,
        },
      },
    )

    if (!result || !result.data) return []

    return result.data.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      position: { x: row.x, y: row.y, z: row.z },
      capabilities: JSON.parse(row.capabilities || "[]"),
      status: row.status,
      currentTask: row.currentTask,
    }))
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  async createTask(task: Task): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      CREATE (t:Task {
        id: $id,
        title: $title,
        description: $description,
        type: $type,
        priority: $priority,
        status: $status,
        assignedTo: $assignedTo,
        x: $x,
        y: $y,
        z: $z,
        metadata: $metadata,
        createdAt: $timestamp
      })
    `,
      {
        params: {
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo || "",
          x: task.position?.x || 0,
          y: task.position?.y || 0,
          z: task.position?.z || 0,
          metadata: JSON.stringify(task.metadata || {}),
          timestamp: Date.now(),
        },
      },
    )

    // Create dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        await this.graph.query(
          `
          MATCH (t1:Task {id: $taskId}), (t2:Task {id: $depId})
          CREATE (t1)-[:DEPENDS_ON]->(t2)
        `,
          {
            params: {
              taskId: task.id,
              depId,
            },
          },
        )
      }
    }
  }

  async assignTask(taskId: string, agentId: string): Promise<void> {
    if (!this.graph) await this.connect()

    // Update task
    await this.graph.query(
      `
      MATCH (t:Task {id: $taskId})
      SET t.assignedTo = $agentId, t.status = 'assigned', t.assignedAt = $timestamp
    `,
      {
        params: {
          taskId,
          agentId,
          timestamp: Date.now(),
        },
      },
    )

    // Create relationship
    await this.graph.query(
      `
      MATCH (a:Agent {id: $agentId}), (t:Task {id: $taskId})
      CREATE (a)-[:ASSIGNED_TO]->(t)
    `,
      {
        params: {
          agentId,
          taskId,
        },
      },
    )

    // Update agent status
    await this.updateAgentStatus(agentId, "working", taskId)
  }

  async findOptimalAgent(task: Task): Promise<Agent | null> {
    if (!this.graph) await this.connect()

    // Find idle agents with matching capabilities near task location
    const result = await this.graph.query(
      `
      MATCH (a:Agent)
      WHERE a.status = 'idle'
      WITH a, 
           sqrt(pow(a.x - $x, 2) + pow(a.y - $y, 2) + pow(a.z - $z, 2)) as distance
      RETURN a.id as id, a.name as name, a.type as type,
             a.x as x, a.y as y, a.z as z,
             a.capabilities as capabilities, distance
      ORDER BY distance ASC
      LIMIT 1
    `,
      {
        params: {
          x: task.position?.x || 0,
          y: task.position?.y || 0,
          z: task.position?.z || 0,
        },
      },
    )

    if (!result || !result.data || result.data.length === 0) return null

    const row = result.data[0]
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      position: { x: row.x, y: row.y, z: row.z },
      capabilities: JSON.parse(row.capabilities || "[]"),
      status: "idle",
    }
  }

  // ============================================
  // AGENT COMMUNICATION
  // ============================================

  async sendMessage(message: Message): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      CREATE (m:Message {
        from: $from,
        to: $to,
        content: $content,
        type: $type,
        timestamp: $timestamp,
        metadata: $metadata,
        read: false
      })
    `,
      {
        params: {
          from: message.from,
          to: message.to,
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          metadata: JSON.stringify(message.metadata || {}),
        },
      },
    )

    // Create relationship
    if (message.to !== "broadcast") {
      await this.graph.query(
        `
        MATCH (sender:Agent {id: $from}), (receiver:Agent {id: $to}), (m:Message {timestamp: $timestamp})
        CREATE (sender)-[:SENT]->(m)-[:TO]->(receiver)
      `,
        {
          params: {
            from: message.from,
            to: message.to,
            timestamp: message.timestamp,
          },
        },
      )
    }
  }

  async getMessages(
    agentId: string,
    unreadOnly: boolean = false,
  ): Promise<Message[]> {
    if (!this.graph) await this.connect()

    const query = unreadOnly
      ? `
        MATCH (m:Message)
        WHERE (m.to = $agentId OR m.to = 'broadcast') AND m.read = false
        RETURN m.from as from, m.to as to, m.content as content, 
               m.type as type, m.timestamp as timestamp, m.metadata as metadata
        ORDER BY m.timestamp DESC
      `
      : `
        MATCH (m:Message)
        WHERE m.to = $agentId OR m.to = 'broadcast'
        RETURN m.from as from, m.to as to, m.content as content,
               m.type as type, m.timestamp as timestamp, m.metadata as metadata
        ORDER BY m.timestamp DESC
      `

    const result = await this.graph.query(query, {
      params: { agentId },
    })

    if (!result || !result.data) return []

    return result.data.map((row: any) => ({
      from: row.from,
      to: row.to,
      content: row.content,
      type: row.type,
      timestamp: row.timestamp,
      metadata: JSON.parse(row.metadata || "{}"),
    }))
  }

  // ============================================
  // SPATIAL QUERIES
  // ============================================

  async getAgentNetwork(agentId: string, depth: number = 2): Promise<any> {
    if (!this.graph) await this.connect()

    // Get agent's communication network
    const result = await this.graph.query(
      `
      MATCH path = (a:Agent {id: $agentId})-[:SENT|TO*1..$depth]-(other:Agent)
      RETURN other.id as id, other.name as name, other.type as type,
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

    if (!result || !result.data) return { agents: [], connections: [] }

    return {
      agents: result.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        distance: row.distance,
      })),
    }
  }

  async getSystemStats(): Promise<{
    totalAgents: number
    activeAgents: number
    totalTasks: number
    completedTasks: number
    messageCount: number
  }> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(`
      MATCH (a:Agent)
      WITH COUNT(a) as totalAgents, 
           SUM(CASE WHEN a.status = 'working' THEN 1 ELSE 0 END) as activeAgents
      MATCH (t:Task)
      WITH totalAgents, activeAgents,
           COUNT(t) as totalTasks,
           SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTasks
      MATCH (m:Message)
      RETURN totalAgents, activeAgents, totalTasks, completedTasks, COUNT(m) as messageCount
    `)

    if (!result || !result.data || result.data.length === 0) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        totalTasks: 0,
        completedTasks: 0,
        messageCount: 0,
      }
    }

    const row = result.data[0]
    return {
      totalAgents: row.totalAgents || 0,
      activeAgents: row.activeAgents || 0,
      totalTasks: row.totalTasks || 0,
      completedTasks: row.completedTasks || 0,
      messageCount: row.messageCount || 0,
    }
  }
}

export default SpatialAgentSystem
