# PostgreSQL + FalkorDB Integration Guide

**Hybrid Database Architecture for Spatial Multi-Agent System**

## Overview

This package uses a **hybrid database approach**:

- **PostgreSQL (Drizzle ORM)**: Source of truth for all application data
- **FalkorDB (Graph DB)**: Spatial relationships, agent coordination, task optimization

## Why Hybrid?

### PostgreSQL Strengths

✅ ACID transactions  
✅ Complex queries with JOINs  
✅ Mature ecosystem  
✅ Your existing data

### FalkorDB Strengths

✅ Graph relationships (agent networks)  
✅ Spatial queries (proximity-based assignment)  
✅ Fast path finding (task dependencies)  
✅ Real-time coordination

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PostgreSQL (Drizzle ORM)          FalkorDB (Graph)    │
│  ├─ users                          ├─ Agent nodes       │
│  ├─ teams                          ├─ PMAgent nodes     │
│  ├─ apps                           ├─ Task nodes        │
│  ├─ tasks                          ├─ MANAGES edges     │
│  ├─ kanbanBoards                   ├─ ASSIGNED_TO edges │
│  └─ taskStates                     └─ DEPENDS_ON edges  │
│                                                          │
│              ↕ Sync Layer ↕                             │
│         (postgres-sync.ts)                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Compatible Tables

The system syncs these Drizzle tables to FalkorDB:

### Core Entities

- `users` → `User` nodes
- `guests` → `Guest` nodes
- `teams` → `Team` nodes
- `apps` → `App` nodes

### Kanban System

- `kanbanBoards` → `KanbanBoard` nodes
- `taskStates` → `TaskState` nodes (columns)
- `tasks` → `Task` nodes

### Relationships Created

- `User -[OWNS]-> Team`
- `User -[OWNS]-> KanbanBoard`
- `Task -[BELONGS_TO]-> TaskState`
- `Task -[DEPENDS_ON]-> Task`
- `Agent -[ASSIGNED_TO]-> Task`
- `PMAgent -[MANAGES]-> Agent`
- `PMAgent -[COORDINATES]-> Task`

## Setup

### 1. Install Dependencies

```bash
npm install falkordb
```

### 2. Start FalkorDB

```bash
docker run -p 6380:6379 falkordb/falkordb:latest
```

### 3. Initialize Hybrid DB

```typescript
import { HybridDB } from "@chrryai/spatial-agents/hybrid-schema"
import { PostgresSync } from "@chrryai/spatial-agents/postgres-sync"

const hybridDB = new HybridDB({
  postgres: {
    connectionString: process.env.DATABASE_URL!,
  },
  falkordb: {
    host: "localhost",
    port: 6380,
    graphName: "your_workspace",
  },
})

await hybridDB.connect()
```

## Usage Patterns

### Pattern 1: Sync Existing Data

```typescript
const sync = new PostgresSync(hybridDB)

// Sync a user
await sync.syncUser({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isAvailableForHire: user.isAvailableForHire,
  hourlyRate: user.hourlyRate,
  expertise: user.expertise,
})

// Sync a task
await sync.syncTask({
  id: task.id,
  title: task.title,
  description: task.description,
  userId: task.userId,
  taskStateId: task.taskStateId,
  appId: task.appId,
})
```

### Pattern 2: Batch Sync Workspace

```typescript
await sync.syncWorkspace({
  users: await db.select().from(users),
  teams: await db.select().from(teams),
  apps: await db.select().from(apps),
  boards: await db.select().from(kanbanBoards),
  states: await db.select().from(taskStates),
  tasks: await db.select().from(tasks),
})
```

### Pattern 3: Create Spatial Agents

```typescript
// Create PM Agent (graph-only entity)
await hybridDB.syncFromPostgres({
  type: "PMAgent",
  id: "pm-1",
  properties: {
    name: "Project Manager AI",
    type: "planner",
    status: "active",
    capabilities: JSON.stringify(["task-assignment", "coordination"]),
    position: JSON.stringify({ x: 0, y: 0, z: 10 }),
  },
})

// Create developer agent
await hybridDB.syncFromPostgres({
  type: "Agent",
  id: "agent-1",
  properties: {
    name: "Coder Agent",
    type: "coder",
    status: "idle",
    capabilities: JSON.stringify(["typescript", "react"]),
    position: JSON.stringify({ x: 0, y: 0, z: 5 }),
  },
  relationships: [
    {
      type: "MANAGES",
      targetType: "PMAgent",
      targetId: "pm-1",
    },
  ],
})
```

### Pattern 4: Graph Queries

```typescript
// Find optimal agent for task
const assignment = await hybridDB.findOptimalAgentForTask("task-123")
// { agentId: 'agent-1', score: 85, reason: 'Workload-optimized' }

// Get PM team overview
const overview = await hybridDB.getPMTeamOverview("pm-1")
// { totalAgents: 5, activeAgents: 3, totalTasks: 12, ... }

// Check task dependencies
const deps = await hybridDB.getTaskDependencies("task-123")
// { blockedBy: ['task-100'], blocking: ['task-124'], canStart: false }

// Get agent network
const network = await hybridDB.getAgentNetwork("agent-1", 2)
// { agents: [...], connections: [...] }
```

## Real-time Sync

### Option 1: Manual Sync on Changes

```typescript
// After creating/updating in PostgreSQL
const newTask = await db.insert(tasks).values({...}).returning();
await sync.syncTask(newTask[0]);
```

### Option 2: PostgreSQL Triggers (Advanced)

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION notify_task_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('task_change', json_build_object(
    'operation', TG_OP,
    'data', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER task_change_trigger
AFTER INSERT OR UPDATE ON task
FOR EACH ROW EXECUTE FUNCTION notify_task_change();
```

```typescript
// Listen for changes
import { RealtimeSync } from "@chrryai/spatial-agents/postgres-sync"

const realtimeSync = new RealtimeSync(hybridDB)

pgClient.on("notification", async (msg) => {
  const event = JSON.parse(msg.payload)
  await realtimeSync.handleChange({
    table: "task",
    operation: event.operation,
    data: event.data,
  })
})

await pgClient.query("LISTEN task_change")
```

## API Key Management (PM Agent)

```typescript
// Store API key in graph (encrypted in production!)
await hybridDB.syncFromPostgres({
  type: "ApiKey",
  id: "key-1",
  properties: {
    service: "openai",
    key: process.env.OPENAI_API_KEY!,
    description: "OpenAI API for agent coordination",
    createdAt: Date.now(),
  },
  relationships: [
    {
      type: "HAS_ACCESS_TO",
      targetType: "PMAgent",
      targetId: "pm-1",
    },
  ],
})

// Query API keys for PM Agent
const result = await graph.query(
  `
  MATCH (pm:PMAgent {id: $pmId})-[:HAS_ACCESS_TO]->(key:ApiKey)
  RETURN key.service as service, key.key as key
`,
  { params: { pmId: "pm-1" } },
)
```

## Best Practices

### 1. Data Consistency

- PostgreSQL is source of truth
- Sync to FalkorDB after PostgreSQL writes
- Use transactions for atomic operations

### 2. Sync Strategy

- **Development**: Manual sync on changes
- **Production**: Real-time sync with triggers
- **Batch jobs**: Nightly full sync for consistency

### 3. Graph Queries

- Use graph for relationships (agent networks, task dependencies)
- Use PostgreSQL for complex business logic
- Cache graph results when appropriate

### 4. Security

- Encrypt API keys before storing
- Use separate FalkorDB instances per workspace
- Implement access control in graph queries

## Example: Full Workflow

```typescript
// 1. User creates task in your app (PostgreSQL)
const task = await db
  .insert(tasks)
  .values({
    title: "Implement feature X",
    description: "Add new feature",
    userId: currentUser.id,
    taskStateId: "todo-column",
    appId: currentApp.id,
  })
  .returning()

// 2. Sync to FalkorDB
await sync.syncTask(task[0])

// 3. PM Agent finds optimal agent
const assignment = await hybridDB.findOptimalAgentForTask(task[0].id)

// 4. Assign in both databases
await db
  .update(tasks)
  .set({ assignedTo: assignment.agentId })
  .where(eq(tasks.id, task[0].id))

await graph.query(
  `
  MATCH (agent:Agent {id: $agentId}), (task:Task {id: $taskId})
  CREATE (agent)-[:ASSIGNED_TO]->(task)
`,
  {
    params: {
      agentId: assignment.agentId,
      taskId: task[0].id,
    },
  },
)

// 5. Agent executes task (your business logic)
// 6. Update status in both databases
```

## Migration Guide

### From Existing Drizzle Schema

```typescript
// 1. Install package
npm install @chrryai/spatial-agents

// 2. Initialize hybrid DB
const hybridDB = new HybridDB({...});
await hybridDB.connect();

// 3. Initial sync
const sync = new PostgresSync(hybridDB);
await sync.syncWorkspace({
  users: await db.select().from(users),
  teams: await db.select().from(teams),
  // ... other tables
});

// 4. Add sync calls to your mutations
// After: await db.insert(tasks).values({...})
// Add: await sync.syncTask(newTask);

// 5. Use graph queries for agent coordination
const assignment = await hybridDB.findOptimalAgentForTask(taskId);
```

## Performance

### PostgreSQL

- Use indexes on foreign keys
- Optimize complex JOINs
- Use connection pooling

### FalkorDB

- Create indexes on frequently queried properties
- Use LIMIT in queries
- Batch operations when possible

```cypher
-- Create index
CREATE INDEX ON :Task(status)
CREATE INDEX ON :Agent(status)
```

## Troubleshooting

### Sync Issues

```typescript
// Check if node exists
const result = await graph.query(
  `
  MATCH (n:Task {id: $id})
  RETURN n
`,
  { params: { id: taskId } },
)

if (!result.data || result.data.length === 0) {
  console.log("Node not found, resyncing...")
  await sync.syncTask(task)
}
```

### Connection Issues

```typescript
try {
  await hybridDB.connect()
} catch (error) {
  console.error("FalkorDB connection failed:", error)
  // Fallback to PostgreSQL-only mode
}
```

## License

MIT

---

**Ready to integrate?** Check out `examples/postgres-integration.ts` for a complete working example! 🚀
