/**
 * Multi-Agent Coordination Demo
 * Shows how agents collaborate on tasks using spatial positioning
 */

import { SpatialAgentSystem } from "../src/index"

async function main() {
  console.log("🌍 Spatial Multi-Agent System Demo\n")

  const system = new SpatialAgentSystem({
    host: "localhost",
    port: 6380,
    graphName: "demo_agents",
  })

  await system.connect()

  // ============================================
  // 1. Register Development Team
  // ============================================
  console.log("👥 Registering agents...\n")

  await system.registerAgent({
    id: "coder-alice",
    name: "Alice (Senior Dev)",
    type: "coder",
    position: { x: 0, y: 0, z: 10 }, // High Z = senior
    capabilities: ["typescript", "react", "architecture", "testing"],
    status: "idle",
  })

  await system.registerAgent({
    id: "coder-bob",
    name: "Bob (Junior Dev)",
    type: "coder",
    position: { x: 5, y: 5, z: 3 }, // Lower Z = junior
    capabilities: ["typescript", "react"],
    status: "idle",
  })

  await system.registerAgent({
    id: "tester-charlie",
    name: "Charlie (QA)",
    type: "tester",
    position: { x: 10, y: 0, z: 5 },
    capabilities: ["unit-testing", "e2e-testing", "performance"],
    status: "idle",
  })

  await system.registerAgent({
    id: "reviewer-diana",
    name: "Diana (Tech Lead)",
    type: "reviewer",
    position: { x: 0, y: 10, z: 15 }, // Highest Z = most experienced
    capabilities: ["architecture", "security", "performance", "mentoring"],
    status: "idle",
  })

  await system.registerAgent({
    id: "debugger-eve",
    name: "Eve (Bug Hunter)",
    type: "debugger",
    position: { x: -5, y: 5, z: 8 },
    capabilities: ["debugging", "profiling", "static-analysis"],
    status: "idle",
  })

  console.log("✅ 5 agents registered\n")

  // ============================================
  // 2. Create Tasks with Dependencies
  // ============================================
  console.log("📋 Creating tasks...\n")

  await system.createTask({
    id: "task-1",
    title: "Design authentication system",
    description: "Design secure auth with JWT",
    type: "architecture",
    priority: 10,
    status: "pending",
    position: { x: 0, y: 10, z: 15 }, // Near Diana (reviewer)
  })

  await system.createTask({
    id: "task-2",
    title: "Implement login component",
    description: "Build React login form",
    type: "feature",
    priority: 8,
    status: "pending",
    position: { x: 0, y: 0, z: 10 }, // Near Alice (senior coder)
    dependencies: ["task-1"],
  })

  await system.createTask({
    id: "task-3",
    title: "Write unit tests for auth",
    description: "Test auth logic",
    type: "testing",
    priority: 7,
    status: "pending",
    position: { x: 10, y: 0, z: 5 }, // Near Charlie (tester)
    dependencies: ["task-2"],
  })

  await system.createTask({
    id: "task-4",
    title: "Fix memory leak in dashboard",
    description: "Dashboard component leaking memory",
    type: "bugfix",
    priority: 9,
    status: "pending",
    position: { x: -5, y: 5, z: 8 }, // Near Eve (debugger)
  })

  console.log("✅ 4 tasks created with dependencies\n")

  // ============================================
  // 3. Smart Task Assignment
  // ============================================
  console.log("🎯 Assigning tasks to optimal agents...\n")

  const tasks = [
    { id: "task-1", position: { x: 0, y: 10, z: 15 } },
    { id: "task-2", position: { x: 0, y: 0, z: 10 } },
    { id: "task-3", position: { x: 10, y: 0, z: 5 } },
    { id: "task-4", position: { x: -5, y: 5, z: 8 } },
  ]

  for (const task of tasks) {
    const agent = await system.findOptimalAgent({
      id: task.id,
      title: "",
      description: "",
      type: "feature",
      priority: 5,
      status: "pending",
      position: task.position,
    })

    if (agent) {
      await system.assignTask(task.id, agent.id)
      console.log(`   ✅ Task ${task.id} → ${agent.name}`)
    }
  }

  console.log()

  // ============================================
  // 4. Agent Communication
  // ============================================
  console.log("💬 Agents communicating...\n")

  await system.sendMessage({
    from: "coder-alice",
    to: "tester-charlie",
    content: "Login component ready for testing",
    type: "notification",
    timestamp: Date.now(),
  })

  await system.sendMessage({
    from: "debugger-eve",
    to: "coder-bob",
    content: "Found the memory leak - useEffect cleanup missing",
    type: "coordination",
    timestamp: Date.now(),
  })

  await system.sendMessage({
    from: "reviewer-diana",
    to: "broadcast",
    content: "Code review meeting in 30 minutes",
    type: "notification",
    timestamp: Date.now(),
  })

  console.log("   ✅ 3 messages sent\n")

  // ============================================
  // 5. Spatial Queries
  // ============================================
  console.log("🔍 Finding nearby agents...\n")

  const nearbyToAlice = await system.findNearbyAgents({ x: 0, y: 0, z: 10 }, 15)
  console.log(`   Agents near Alice (radius 15):`)
  for (const agent of nearbyToAlice) {
    console.log(`      - ${agent.name} (${agent.type})`)
  }

  console.log()

  // ============================================
  // 6. Communication Network
  // ============================================
  console.log("🕸️  Analyzing communication network...\n")

  const aliceNetwork = await system.getAgentNetwork("coder-alice", 2)
  console.log(`   Alice's network (depth 2):`)
  for (const agent of aliceNetwork.agents) {
    console.log(`      - ${agent.name} (distance: ${agent.distance})`)
  }

  console.log()

  // ============================================
  // 7. System Statistics
  // ============================================
  console.log("📊 System Statistics:\n")

  const stats = await system.getSystemStats()
  console.log(`   Total Agents: ${stats.totalAgents}`)
  console.log(`   Active Agents: ${stats.activeAgents}`)
  console.log(`   Total Tasks: ${stats.totalTasks}`)
  console.log(`   Completed Tasks: ${stats.completedTasks}`)
  console.log(`   Messages: ${stats.messageCount}`)

  console.log("\n✅ Demo complete!\n")

  await system.disconnect()
}

main().catch(console.error)
