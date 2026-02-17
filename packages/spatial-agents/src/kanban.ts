/**
 * Kanban Board System for Spatial Agents
 * Manages tasks across different stages with FalkorDB
 */

import { FalkorDB } from "falkordb"

export interface KanbanConfig {
  host?: string
  port?: number
  graphName?: string
}

export interface KanbanColumn {
  id: string
  name: string
  order: number
  wipLimit?: number // Work in progress limit
}

export interface KanbanCard {
  id: string
  title: string
  description: string
  columnId: string
  assignedTo?: string // Agent ID
  priority: number
  tags: string[]
  createdAt: number
  updatedAt: number
  metadata?: Record<string, any>
}

export interface KanbanBoard {
  id: string
  name: string
  columns: KanbanColumn[]
  cards: KanbanCard[]
}

export class KanbanSystem {
  private db: any = null
  private graph: any = null
  private config: Required<KanbanConfig>

  constructor(config: KanbanConfig = {}) {
    this.config = {
      host: config.host || "localhost",
      port: config.port || 6380,
      graphName: config.graphName || "kanban_board",
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
  // BOARD MANAGEMENT
  // ============================================

  async createBoard(boardId: string, name: string): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      CREATE (b:Board {
        id: $id,
        name: $name,
        createdAt: $timestamp
      })
    `,
      {
        params: {
          id: boardId,
          name,
          timestamp: Date.now(),
        },
      },
    )

    // Create default columns
    const defaultColumns = [
      { id: "backlog", name: "Backlog", order: 0 },
      { id: "todo", name: "To Do", order: 1 },
      { id: "in-progress", name: "In Progress", order: 2, wipLimit: 3 },
      { id: "review", name: "Review", order: 3 },
      { id: "done", name: "Done", order: 4 },
    ]

    for (const col of defaultColumns) {
      await this.createColumn(boardId, col)
    }
  }

  async createColumn(boardId: string, column: KanbanColumn): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})
      CREATE (c:Column {
        id: $id,
        name: $name,
        order: $order,
        wipLimit: $wipLimit
      })
      CREATE (b)-[:HAS_COLUMN]->(c)
    `,
      {
        params: {
          boardId,
          id: column.id,
          name: column.name,
          order: column.order,
          wipLimit: column.wipLimit || 0,
        },
      },
    )
  }

  // ============================================
  // CARD MANAGEMENT
  // ============================================

  async createCard(boardId: string, card: KanbanCard): Promise<void> {
    if (!this.graph) await this.connect()

    await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})-[:HAS_COLUMN]->(c:Column {id: $columnId})
      CREATE (card:Card {
        id: $id,
        title: $title,
        description: $description,
        assignedTo: $assignedTo,
        priority: $priority,
        tags: $tags,
        createdAt: $createdAt,
        updatedAt: $updatedAt,
        metadata: $metadata
      })
      CREATE (c)-[:CONTAINS]->(card)
    `,
      {
        params: {
          boardId,
          columnId: card.columnId,
          id: card.id,
          title: card.title,
          description: card.description,
          assignedTo: card.assignedTo || "",
          priority: card.priority,
          tags: JSON.stringify(card.tags),
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          metadata: JSON.stringify(card.metadata || {}),
        },
      },
    )

    // Link to agent if assigned
    if (card.assignedTo) {
      await this.graph.query(
        `
        MATCH (card:Card {id: $cardId}), (agent:Agent {id: $agentId})
        CREATE (agent)-[:ASSIGNED_TO]->(card)
      `,
        {
          params: {
            cardId: card.id,
            agentId: card.assignedTo,
          },
        },
      )
    }
  }

  async moveCard(cardId: string, toColumnId: string): Promise<void> {
    if (!this.graph) await this.connect()

    // Remove old column relationship
    await this.graph.query(
      `
      MATCH (c:Column)-[r:CONTAINS]->(card:Card {id: $cardId})
      DELETE r
    `,
      {
        params: { cardId },
      },
    )

    // Create new column relationship
    await this.graph.query(
      `
      MATCH (c:Column {id: $columnId}), (card:Card {id: $cardId})
      CREATE (c)-[:CONTAINS]->(card)
      SET card.updatedAt = $timestamp
    `,
      {
        params: {
          columnId: toColumnId,
          cardId,
          timestamp: Date.now(),
        },
      },
    )
  }

  async assignCard(cardId: string, agentId: string): Promise<void> {
    if (!this.graph) await this.connect()

    // Remove old assignment
    await this.graph.query(
      `
      MATCH (agent:Agent)-[r:ASSIGNED_TO]->(card:Card {id: $cardId})
      DELETE r
    `,
      {
        params: { cardId },
      },
    )

    // Create new assignment
    await this.graph.query(
      `
      MATCH (agent:Agent {id: $agentId}), (card:Card {id: $cardId})
      CREATE (agent)-[:ASSIGNED_TO]->(card)
      SET card.assignedTo = $agentId, card.updatedAt = $timestamp
    `,
      {
        params: {
          agentId,
          cardId,
          timestamp: Date.now(),
        },
      },
    )
  }

  // ============================================
  // QUERIES
  // ============================================

  async getBoard(boardId: string): Promise<KanbanBoard | null> {
    if (!this.graph) await this.connect()

    // Get board info
    const boardResult = await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})
      RETURN b.name as name
    `,
      {
        params: { boardId },
      },
    )

    if (!boardResult || !boardResult.data || boardResult.data.length === 0) {
      return null
    }

    const boardName = boardResult.data[0].name

    // Get columns
    const columnsResult = await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})-[:HAS_COLUMN]->(c:Column)
      RETURN c.id as id, c.name as name, c.order as order, c.wipLimit as wipLimit
      ORDER BY c.order ASC
    `,
      {
        params: { boardId },
      },
    )

    if (
      !columnsResult ||
      !columnsResult.data ||
      columnsResult.data.length === 0
    ) {
      return null
    }

    const columns: KanbanColumn[] = columnsResult.data.map((row: any) => ({
      id: row.id,
      name: row.name,
      order: row.order,
      wipLimit: row.wipLimit || undefined,
    }))

    // Get cards scoped to this board
    const cardsResult = await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})-[:HAS_COLUMN]->(c:Column)-[:CONTAINS]->(card:Card)
      RETURN card.id as id, card.title as title, card.description as description,
             c.id as columnId, card.assignedTo as assignedTo, card.priority as priority,
             card.tags as tags, card.createdAt as createdAt, card.updatedAt as updatedAt,
             card.metadata as metadata
    `,
      {
        params: { boardId },
      },
    )

    const cards: KanbanCard[] = []
    if (cardsResult?.data) {
      for (const row of cardsResult.data) {
        cards.push({
          id: row.id,
          title: row.title,
          description: row.description,
          columnId: row.columnId,
          assignedTo: row.assignedTo || undefined,
          priority: row.priority,
          tags: JSON.parse(row.tags || "[]"),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          metadata: JSON.parse(row.metadata || "{}"),
        })
      }
    }

    return {
      id: boardId,
      name: boardName,
      columns,
      cards,
    }
  }

  async getCardsByColumn(columnId: string): Promise<KanbanCard[]> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(
      `
      MATCH (c:Column {id: $columnId})-[:CONTAINS]->(card:Card)
      RETURN card.id as id, card.title as title, card.description as description,
             card.assignedTo as assignedTo, card.priority as priority,
             card.tags as tags, card.createdAt as createdAt, card.updatedAt as updatedAt
      ORDER BY card.priority DESC, card.createdAt ASC
    `,
      {
        params: { columnId },
      },
    )

    if (!result || !result.data) return []

    return result.data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      columnId,
      assignedTo: row.assignedTo || undefined,
      priority: row.priority,
      tags: JSON.parse(row.tags || "[]"),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  }

  async getAgentWorkload(agentId: string): Promise<{
    total: number
    byColumn: Record<string, number>
  }> {
    if (!this.graph) await this.connect()

    const result = await this.graph.query(
      `
      MATCH (agent:Agent {id: $agentId})-[:ASSIGNED_TO]->(card:Card)<-[:CONTAINS]-(c:Column)
      RETURN c.id as columnId, COUNT(card) as count
    `,
      {
        params: { agentId },
      },
    )

    const workload = {
      total: 0,
      byColumn: {} as Record<string, number>,
    }

    if (result?.data) {
      for (const row of result.data) {
        workload.byColumn[row.columnId] = row.count
        workload.total += row.count
      }
    }

    return workload
  }

  async getBoardStats(boardId: string): Promise<{
    totalCards: number
    cardsByColumn: Record<string, number>
    cardsByAgent: Record<string, number>
  }> {
    if (!this.graph) await this.connect()

    const columnStats = await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})-[:HAS_COLUMN]->(c:Column)-[:CONTAINS]->(card:Card)
      RETURN c.id as columnId, COUNT(card) as count
    `,
      {
        params: { boardId },
      },
    )

    const agentStats = await this.graph.query(
      `
      MATCH (b:Board {id: $boardId})-[:HAS_COLUMN]->(c:Column)-[:CONTAINS]->(card:Card),
            (agent:Agent)-[:ASSIGNED_TO]->(card)
      RETURN agent.id as agentId, COUNT(card) as count
    `,
      {
        params: { boardId },
      },
    )

    const stats = {
      totalCards: 0,
      cardsByColumn: {} as Record<string, number>,
      cardsByAgent: {} as Record<string, number>,
    }

    if (columnStats?.data) {
      for (const row of columnStats.data) {
        stats.cardsByColumn[row.columnId] = row.count
        stats.totalCards += row.count
      }
    }

    if (agentStats?.data) {
      for (const row of agentStats.data) {
        stats.cardsByAgent[row.agentId] = row.count
      }
    }

    return stats
  }
}

export default KanbanSystem
