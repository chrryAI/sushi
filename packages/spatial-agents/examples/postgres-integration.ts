/**
 * PostgreSQL + FalkorDB Integration Example
 * Shows how to use spatial agents with existing Drizzle schema
 */

import { HybridDB } from "../src/hybrid-schema"
import { PostgresSync } from "../src/postgres-sync"

async function main() {
  console.log("🔗 PostgreSQL + FalkorDB Integration Demo\n")

  // Initialize hybrid database
  const hybridDB = new HybridDB({
    postgres: {
      connectionString: process.env.DATABASE_URL || "",
    },
    falkordb: {
      host: "localhost",
      port: 6380,
      graphName: "chrry_workspace",
    },
  })

  await hybridDB.connect()

  const sync = new PostgresSync(hybridDB)

  // ============================================
  // 1. Sync existing PostgreSQL data to graph
  // ============================================
  console.log("📊 Step 1: Syncing PostgreSQL data to FalkorDB...\n")

  // Sync users
  await sync.syncUser({
    id: "user-1",
    name: "Alice (Senior Dev)",
    email: "alice@chrry.dev",
    role: "user",
    isAvailableForHire: true,
    hourlyRate: 150,
    expertise: ["TypeScript", "React", "Node.js"],
  })

  await sync.syncUser({
    id: "user-2",
    name: "Bob (Designer)",
    email: "bob@chrry.dev",
    role: "user",
    isAvailableForHire: true,
    hourlyRate: 120,
    expertise: ["UI/UX", "Figma", "Design Systems"],
  })

  // Sync team
  await sync.syncTeam({
    id: "team-1",
    name: "Chrry AI",
    slug: "chrryai",
    ownerId: "user-1",
    plan: "pro",
  })

  // Sync app
  await sync.syncApp({
    id: "app-1",
    name: "Vex Chat",
    slug: "vex-chat",
    userId: "user-1",
    teamId: "team-1",
  })

  // Sync Kanban board
  await sync.syncKanbanBoard({
    id: "board-1",
    name: "Sprint 24",
    userId: "user-1",
    appId: "app-1",
  })

  // Sync task states (columns)
  await sync.syncTaskState({
    id: "state-1",
    title: "To Do",
    order: 0,
    kanbanBoardId: "board-1",
  })

  await sync.syncTaskState({
    id: "state-2",
    title: "In Progress",
    order: 1,
    kanbanBoardId: "board-1",
  })

  await sync.syncTaskState({
    id: "state-3",
    title: "Done",
    order: 2,
    kanbanBoardId: "board-1",
  })

  // Sync tasks
  await sync.syncTask({
    id: "task-1",
    title: "Implement user authentication",
    description: "Add OAuth2 login flow",
    userId: "user-1",
    taskStateId: "state-1",
    appId: "app-1",
    order: 0,
  })

  await sync.syncTask({
    id: "task-2",
    title: "Design landing page",
    description: "Create hero section and CTA",
    userId: "user-2",
    taskStateId: "state-1",
    appId: "app-1",
    order: 1,
  })

  await sync.syncTask({
    id: "task-3",
    title: "Setup CI/CD pipeline",
    description: "Configure GitHub Actions",
    userId: "user-1",
    taskStateId: "state-2",
    appId: "app-1",
    order: 0,
  })

  console.log("✅ PostgreSQL data synced to FalkorDB\n")

  // ============================================
  // 2. Create spatial agents (graph-only)
  // ============================================
  console.log("🤖 Step 2: Creating spatial agents...\n")

  // Create PM Agent
  await hybridDB.syncFromPostgres({
    type: "PMAgent",
    id: "pm-1",
    properties: {
      name: "Project Manager AI",
      type: "planner",
      status: "active",
      capabilities: JSON.stringify([
        "task-assignment",
        "coordination",
        "reporting",
      ]),
      position: JSON.stringify({ x: 0, y: 0, z: 10 }), // High Z = manager
    },
  })

  // Create developer agents
  await hybridDB.syncFromPostgres({
    type: "Agent",
    id: "agent-1",
    properties: {
      name: "Coder Agent",
      type: "coder",
      status: "idle",
      capabilities: JSON.stringify(["typescript", "react", "testing"]),
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

  await hybridDB.syncFromPostgres({
    type: "Agent",
    id: "agent-2",
    properties: {
      name: "Designer Agent",
      type: "designer",
      status: "idle",
      capabilities: JSON.stringify(["ui-design", "figma", "prototyping"]),
      position: JSON.stringify({ x: 5, y: 5, z: 5 }),
    },
    relationships: [
      {
        type: "MANAGES",
        targetType: "PMAgent",
        targetId: "pm-1",
      },
    ],
  })

  console.log("✅ Spatial agents created\n")

  // ============================================
  // 3. PM Agent assigns tasks to agents
  // ============================================
  console.log("🎯 Step 3: PM Agent assigning tasks...\n")

  // Find optimal agent for task-1
  const assignment1 = await hybridDB.findOptimalAgentForTask("task-1")
  if (assignment1) {
    console.log(
      `   Task 1 → ${assignment1.agentId} (score: ${assignment1.score})`,
    )
    console.log(`   Reason: ${assignment1.reason}\n`)
  }

  // Find optimal agent for task-2
  const assignment2 = await hybridDB.findOptimalAgentForTask("task-2")
  if (assignment2) {
    console.log(
      `   Task 2 → ${assignment2.agentId} (score: ${assignment2.score})`,
    )
    console.log(`   Reason: ${assignment2.reason}\n`)
  }

  // ============================================
  // 4. PM Agent gets team overview
  // ============================================
  console.log("📊 Step 4: PM Agent team overview...\n")

  const overview = await hybridDB.getPMTeamOverview("pm-1")
  console.log(`   Total Agents: ${overview.totalAgents}`)
  console.log(`   Active Agents: ${overview.activeAgents}`)
  console.log(`   Total Tasks: ${overview.totalTasks}`)
  console.log(`   Tasks by Status:`, overview.tasksByStatus)
  console.log(`   Agent Workloads:`)
  for (const workload of overview.agentWorkloads) {
    console.log(`      ${workload.agentId}: ${workload.taskCount} tasks`)
  }
  console.log()

  // ============================================
  // 5. Check task dependencies
  // ============================================
  console.log("🔗 Step 5: Checking task dependencies...\n")

  const deps = await hybridDB.getTaskDependencies("task-1")
  console.log(`   Task 1 dependencies:`)
  console.log(`      Blocked by: ${deps.blockedBy.length} tasks`)
  console.log(`      Blocking: ${deps.blocking.length} tasks`)
  console.log(`      Can start: ${deps.canStart ? "Yes ✅" : "No ❌"}`)
  console.log()

  // ============================================
  // 6. Agent communication network
  // ============================================
  console.log("🕸️  Step 6: Agent communication network...\n")

  const network = await hybridDB.getAgentNetwork("agent-1", 2)
  console.log(`   Agent 1 network:`)
  console.log(`      Connected agents: ${network.agents.length}`)
  for (const agent of network.agents) {
    console.log(`         ${agent.name} (distance: ${agent.distance})`)
  }
  console.log(`      Connections: ${network.connections.length}`)
  console.log()

  // ============================================
  // Summary
  // ============================================
  console.log("✅ Integration Demo Complete!\n")
  console.log("📝 Summary:")
  console.log("   - PostgreSQL: Source of truth for users, teams, apps, tasks")
  console.log("   - FalkorDB: Graph relationships for agents, coordination")
  console.log("   - PM Agent: Manages team, assigns tasks optimally")
  console.log("   - Agents: Execute tasks based on capabilities and workload")
  console.log("   - Hybrid approach: Best of both worlds! 🚀\n")

  await hybridDB.disconnect()
}

main().catch(console.error)
