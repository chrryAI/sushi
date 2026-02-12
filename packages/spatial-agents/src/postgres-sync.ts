/**
 * PostgreSQL to FalkorDB Sync Utilities
 * Syncs Drizzle ORM entities to FalkorDB graph
 */

import { HybridDB } from "./hybrid-schema"

/**
 * Sync utilities for different entity types
 */
export class PostgresSync {
  constructor(private hybridDB: HybridDB) {}

  /**
   * Sync User to graph
   */
  async syncUser(user: {
    id: string
    name: string | null
    email: string
    role: string
    isAvailableForHire?: boolean
    hourlyRate?: number | null
    expertise?: string[]
  }): Promise<void> {
    await this.hybridDB.syncFromPostgres({
      type: "User",
      id: user.id,
      properties: {
        name: user.name || "Anonymous",
        email: user.email,
        role: user.role,
        isAvailableForHire: user.isAvailableForHire || false,
        hourlyRate: user.hourlyRate || 0,
        expertise: JSON.stringify(user.expertise || []),
        syncedAt: Date.now(),
      },
    })
  }

  /**
   * Sync Team to graph
   */
  async syncTeam(team: {
    id: string
    name: string
    slug: string
    ownerId: string
    plan: string
  }): Promise<void> {
    await this.hybridDB.syncFromPostgres({
      type: "Team",
      id: team.id,
      properties: {
        name: team.name,
        slug: team.slug,
        plan: team.plan,
        syncedAt: Date.now(),
      },
      relationships: [
        {
          type: "OWNS",
          targetType: "User",
          targetId: team.ownerId,
        },
      ],
    })
  }

  /**
   * Sync App to graph
   */
  async syncApp(app: {
    id: string
    name: string
    slug: string
    userId?: string | null
    teamId?: string | null
  }): Promise<void> {
    const relationships: Array<{
      type: any
      targetType: any
      targetId: string
    }> = []

    if (app.userId) {
      relationships.push({
        type: "CREATED_BY",
        targetType: "User",
        targetId: app.userId,
      })
    }

    if (app.teamId) {
      relationships.push({
        type: "BELONGS_TO",
        targetType: "Team",
        targetId: app.teamId,
      })
    }

    await this.hybridDB.syncFromPostgres({
      type: "App",
      id: app.id,
      properties: {
        name: app.name,
        slug: app.slug,
        syncedAt: Date.now(),
      },
      relationships,
    })
  }

  /**
   * Sync Task to graph (Kanban)
   */
  async syncTask(task: {
    id: string
    title: string
    description: string | null
    userId?: string | null
    taskStateId?: string | null
    appId?: string | null
    order?: number | null
  }): Promise<void> {
    const relationships: Array<{
      type: any
      targetType: any
      targetId: string
    }> = []

    if (task.userId) {
      relationships.push({
        type: "CREATED_BY",
        targetType: "User",
        targetId: task.userId,
      })
    }

    if (task.taskStateId) {
      relationships.push({
        type: "BELONGS_TO",
        targetType: "TaskState",
        targetId: task.taskStateId,
      })
    }

    if (task.appId) {
      relationships.push({
        type: "RELATED_TO",
        targetType: "App",
        targetId: task.appId,
      })
    }

    await this.hybridDB.syncFromPostgres({
      type: "Task",
      id: task.id,
      properties: {
        title: task.title,
        description: task.description || "",
        order: task.order || 0,
        status: "pending", // Default status
        syncedAt: Date.now(),
      },
      relationships,
    })
  }

  /**
   * Sync Kanban Board to graph
   */
  async syncKanbanBoard(board: {
    id: string
    name: string
    userId?: string | null
    appId?: string | null
  }): Promise<void> {
    const relationships: Array<{
      type: any
      targetType: any
      targetId: string
    }> = []

    if (board.userId) {
      relationships.push({
        type: "OWNS",
        targetType: "User",
        targetId: board.userId,
      })
    }

    if (board.appId) {
      relationships.push({
        type: "RELATED_TO",
        targetType: "App",
        targetId: board.appId,
      })
    }

    await this.hybridDB.syncFromPostgres({
      type: "KanbanBoard",
      id: board.id,
      properties: {
        name: board.name,
        syncedAt: Date.now(),
      },
      relationships,
    })
  }

  /**
   * Sync TaskState (Kanban column) to graph
   */
  async syncTaskState(state: {
    id: string
    title: string
    order: number
    kanbanBoardId: string
  }): Promise<void> {
    await this.hybridDB.syncFromPostgres({
      type: "TaskState",
      id: state.id,
      properties: {
        title: state.title,
        order: state.order,
        syncedAt: Date.now(),
      },
      relationships: [
        {
          type: "BELONGS_TO",
          targetType: "KanbanBoard",
          targetId: state.kanbanBoardId,
        },
      ],
    })
  }

  /**
   * Batch sync entire workspace
   */
  async syncWorkspace(data: {
    users: Array<any>
    teams: Array<any>
    apps: Array<any>
    boards: Array<any>
    states: Array<any>
    tasks: Array<any>
  }): Promise<void> {
    console.log("🔄 Syncing workspace to FalkorDB...")

    // Sync in order of dependencies
    for (const user of data.users) {
      await this.syncUser(user)
    }

    for (const team of data.teams) {
      await this.syncTeam(team)
    }

    for (const app of data.apps) {
      await this.syncApp(app)
    }

    for (const board of data.boards) {
      await this.syncKanbanBoard(board)
    }

    for (const state of data.states) {
      await this.syncTaskState(state)
    }

    for (const task of data.tasks) {
      await this.syncTask(task)
    }

    console.log("✅ Workspace synced successfully")
  }
}

/**
 * Real-time sync using PostgreSQL triggers (conceptual)
 */
export class RealtimeSync {
  constructor(private hybridDB: HybridDB) {}

  /**
   * Handle PostgreSQL change event
   */
  async handleChange(event: {
    table: string
    operation: "INSERT" | "UPDATE" | "DELETE"
    data: any
  }): Promise<void> {
    const sync = new PostgresSync(this.hybridDB)

    switch (event.table) {
      case "user":
        if (event.operation === "DELETE") {
          // Delete from graph
          await this.deleteNode("User", event.data.id)
        } else {
          await sync.syncUser(event.data)
        }
        break

      case "teams":
        if (event.operation === "DELETE") {
          await this.deleteNode("Team", event.data.id)
        } else {
          await sync.syncTeam(event.data)
        }
        break

      case "task":
        if (event.operation === "DELETE") {
          await this.deleteNode("Task", event.data.id)
        } else {
          await sync.syncTask(event.data)
        }
        break

      // Add more cases as needed
    }
  }

  private async deleteNode(type: string, id: string): Promise<void> {
    const graph = (this.hybridDB as any).graph
    if (!graph) return

    await graph.query(
      `
      MATCH (n:${type} {id: $id})
      DETACH DELETE n
    `,
      { params: { id } },
    )
  }
}

export default PostgresSync
