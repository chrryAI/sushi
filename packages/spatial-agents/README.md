# @chrryai/spatial-agents

**Spatial Multi-Agent Coordination System using FalkorDB Graph Database**

A powerful system for coordinating multiple AI agents in 3D space using graph-based relationships and spatial queries.

## Features

- 🌍 **3D Spatial Positioning**: Agents exist in (x, y, z) coordinates
- 🤝 **Agent Communication**: Message passing with graph-based routing
- 📋 **Task Management**: Assign tasks based on proximity and capabilities
- 🔍 **Spatial Queries**: Find nearby agents, optimal assignments
- 📊 **Network Analysis**: Analyze agent communication patterns
- 🎯 **Smart Assignment**: Auto-assign tasks to optimal agents

## Installation

```bash
npm install @chrryai/spatial-agents
# or
pnpm add @chrryai/spatial-agents
```

## Quick Start

```typescript
import { SpatialAgentSystem } from "@chrryai/spatial-agents"

// Initialize system
const system = new SpatialAgentSystem({
  host: "localhost",
  port: 6380,
  graphName: "my_agents",
})

await system.connect()

// Register agents
await system.registerAgent({
  id: "coder-1",
  name: "Alice",
  type: "coder",
  position: { x: 0, y: 0, z: 0 },
  capabilities: ["typescript", "react", "testing"],
  status: "idle",
})

await system.registerAgent({
  id: "tester-1",
  name: "Bob",
  type: "tester",
  position: { x: 10, y: 5, z: 0 },
  capabilities: ["unit-testing", "e2e-testing"],
  status: "idle",
})

// Create task
await system.createTask({
  id: "task-1",
  title: "Fix bug in login",
  description: "User login fails on mobile",
  type: "bugfix",
  priority: 10,
  status: "pending",
  position: { x: 2, y: 1, z: 0 },
})

// Find optimal agent for task
const task = await system.findOptimalAgent({
  id: "task-1",
  title: "Fix bug",
  type: "bugfix",
  priority: 10,
  status: "pending",
  position: { x: 2, y: 1, z: 0 },
})

// Assign task
if (task) {
  await system.assignTask("task-1", task.id)
}

// Send message
await system.sendMessage({
  from: "coder-1",
  to: "tester-1",
  content: "Bug fixed, ready for testing",
  type: "notification",
  timestamp: Date.now(),
})

// Get system stats
const stats = await system.getSystemStats()
console.log(stats)
// {
//   totalAgents: 2,
//   activeAgents: 1,
//   totalTasks: 1,
//   completedTasks: 0,
//   messageCount: 1
// }
```

## Use Cases

### 1. Multi-Agent Code Review System

```typescript
// Register reviewer agents at different positions
await system.registerAgent({
  id: "reviewer-senior",
  name: "Senior Reviewer",
  type: "reviewer",
  position: { x: 0, y: 0, z: 10 }, // Higher Z = more experience
  capabilities: ["architecture", "security", "performance"],
  status: "idle",
})

await system.registerAgent({
  id: "reviewer-junior",
  name: "Junior Reviewer",
  type: "reviewer",
  position: { x: 0, y: 0, z: 2 },
  capabilities: ["code-style", "testing"],
  status: "idle",
})

// Create review task
await system.createTask({
  id: "review-pr-123",
  title: "Review authentication refactor",
  type: "code-review",
  priority: 8,
  status: "pending",
  position: { x: 0, y: 0, z: 9 }, // High complexity = higher Z
})

// System will assign to senior reviewer (closer in Z-axis)
```

### 2. Distributed Testing Pipeline

```typescript
// Register test agents in different regions
await system.registerAgent({
  id: "test-us-east",
  type: "tester",
  position: { x: -75, y: 40, z: 0 }, // NYC coordinates
  capabilities: ["e2e", "performance"],
  status: "idle",
})

await system.registerAgent({
  id: "test-eu-west",
  type: "tester",
  position: { x: 0, y: 51, z: 0 }, // London coordinates
  capabilities: ["e2e", "performance"],
  status: "idle",
})

// Create test task
await system.createTask({
  id: "test-checkout",
  title: "Test checkout flow",
  type: "e2e-test",
  priority: 10,
  status: "pending",
  position: { x: -74, y: 41, z: 0 }, // Near NYC
})

// System assigns to closest agent (test-us-east)
```

### 3. Agent Communication Network

```typescript
// Find nearby agents for collaboration
const nearby = await system.findNearbyAgents(
  { x: 0, y: 0, z: 0 },
  50, // radius
)

console.log(`Found ${nearby.length} nearby agents`)

// Broadcast message to all agents
await system.sendMessage({
  from: "coordinator",
  to: "broadcast",
  content: "System maintenance in 10 minutes",
  type: "notification",
  timestamp: Date.now(),
})

// Get agent's communication network
const network = await system.getAgentNetwork("coder-1", 2)
console.log("Connected agents:", network.agents)
```

## API Reference

### `SpatialAgentSystem`

#### Constructor

```typescript
new SpatialAgentSystem(config?: SpatialConfig)
```

#### Methods

- `connect()`: Connect to FalkorDB
- `disconnect()`: Disconnect from FalkorDB
- `registerAgent(agent: Agent)`: Register new agent
- `updateAgentPosition(agentId, position)`: Move agent in space
- `updateAgentStatus(agentId, status, currentTask?)`: Update agent status
- `findNearbyAgents(position, radius)`: Find agents within radius
- `createTask(task: Task)`: Create new task
- `assignTask(taskId, agentId)`: Assign task to agent
- `findOptimalAgent(task: Task)`: Find best agent for task
- `sendMessage(message: Message)`: Send message between agents
- `getMessages(agentId, unreadOnly?)`: Get agent's messages
- `getAgentNetwork(agentId, depth)`: Get agent's communication network
- `getSystemStats()`: Get system statistics

## Integration with BAM + STRIKE

```typescript
import { BAM } from "@chrryai/bam"
import { SpatialAgentSystem } from "@chrryai/spatial-agents"

const bam = new BAM()
const agents = new SpatialAgentSystem()

await bam.connect()
await agents.connect()

// Register debugger agent
await agents.registerAgent({
  id: "debugger-1",
  name: "Bug Hunter",
  type: "debugger",
  position: { x: 0, y: 0, z: 0 },
  capabilities: ["bug-detection", "static-analysis"],
  status: "idle",
})

// Scan for bugs
const bugs = await bam.scanDirectory("./src")

// Create task for each bug
for (const bug of bugs) {
  await agents.createTask({
    id: `fix-${bug.file}-${bug.line}`,
    title: `Fix ${bug.type} in ${bug.file}`,
    description: bug.message,
    type: "bugfix",
    priority: bug.severity === "HIGH" ? 10 : 5,
    status: "pending",
    position: { x: 0, y: 0, z: 0 },
  })
}

// Auto-assign to debugger agent
const stats = await agents.getSystemStats()
console.log(`Created ${stats.totalTasks} bug fix tasks`)
```

## License

MIT

## Author

Chrry AI
