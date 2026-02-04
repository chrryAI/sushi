/**
 * SUSHI STORE SEEDER
 * Seeds all SUSHI agents to FalkorDB with capabilities, permissions, and relationships
 */

import { FalkorDB } from "falkordb";

let db = null;
let graph = null;

async function initSushiSeeder() {
  if (graph) return;

  db = await FalkorDB.connect({
    socket: { host: "localhost", port: 6380 },
  });
  graph = db.selectGraph("sushi_store");
  console.log("🍣 SUSHI Store Seeder initialized\n");
}

/**
 * Seed SUSHI Store - All Agents
 */
async function seedSushiStore() {
  if (!graph) await initSushiSeeder();

  console.log("═══════════════════════════════════════════════════════");
  console.log("           🍣 SEEDING SUSHI STORE TO FALKORDB          ");
  console.log("═══════════════════════════════════════════════════════\n");

  // ============================================
  // SUSHI STORE NODE
  // ============================================
  console.log("📦 Creating SUSHI Store...");

  await graph.query(`
    MERGE (store:Store {id: 'sushi-store'})
    SET store.name = 'SUSHI',
        store.title = 'SUSHI AI',
        store.domain = 'https://sushi.chrry.ai',
        store.description = 'AI-powered development assistant with specialized coding agents',
        store.ecosystem = 'LifeOS',
        store.visibility = 'public',
        store.icon = '🍣',
        store.themeColor = 'violet',
        store.createdAt = timestamp()
  `);

  console.log("   ✅ SUSHI Store created\n");

  // ============================================
  // CODER AGENT ⚡
  // ============================================
  console.log("⚡ Creating Coder Agent...");

  await graph.query(`
    MERGE (agent:Agent {id: 'coder'})
    SET agent.name = 'Coder',
        agent.slug = 'coder',
        agent.title = 'AI Code Generation Expert',
        agent.icon = '⚡',
        agent.type = 'development',
        agent.status = 'active',
        agent.model = 'claude',
        agent.intelligence = 100,
        agent.creativity = 30,
        agent.empathy = 10,
        agent.efficiency = 100,
        agent.level = 10,
        agent.xp = 0,
        agent.description = 'Generate production-ready code in any language. Lightning-fast generation with best practices.',
        agent.placeholder = 'What code should I generate?',
        agent.createdAt = timestamp()
  `);

  // Coder capabilities
  await graph.query(`
    MATCH (agent:Agent {id: 'coder'})
    MERGE (cap1:Capability {name: 'code_generation'})
    MERGE (cap2:Capability {name: 'file_write'})
    MERGE (cap3:Capability {name: 'git_commit'})
    MERGE (cap4:Capability {name: 'test_generation'})
    MERGE (cap5:Capability {name: 'documentation'})
    MERGE (cap6:Capability {name: 'algorithm_design'})
    MERGE (cap7:Capability {name: 'api_integration'})
    MERGE (cap8:Capability {name: 'multi_language'})
    MERGE (agent)-[:HAS_CAPABILITY]->(cap1)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap2)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap3)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap4)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap5)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap6)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap7)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap8)
  `);

  // Coder file system permissions
  await graph.query(`
    MATCH (agent:Agent {id: 'coder'})
    MERGE (perm:FilePermission {type: 'read', pattern: '**/*.{js,ts,jsx,tsx,py,go,rs}'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm)
    MERGE (perm2:FilePermission {type: 'write', pattern: 'src/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm2)
    MERGE (perm3:FilePermission {type: 'write', pattern: 'packages/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm3)
    MERGE (perm4:FilePermission {type: 'write', pattern: 'tests/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm4)
  `);

  // Coder tools
  await graph.query(`
    MATCH (agent:Agent {id: 'coder'})
    MERGE (tool1:Tool {name: 'createFile'})
    MERGE (tool2:Tool {name: 'editFile'})
    MERGE (tool3:Tool {name: 'deleteFile'})
    MERGE (tool4:Tool {name: 'runCommand'})
    MERGE (tool5:Tool {name: 'gitCommit'})
    MERGE (tool6:Tool {name: 'runTests'})
    MERGE (agent)-[:CAN_USE]->(tool1)
    MERGE (agent)-[:CAN_USE]->(tool2)
    MERGE (agent)-[:CAN_USE]->(tool3)
    MERGE (agent)-[:CAN_USE]->(tool4)
    MERGE (agent)-[:CAN_USE]->(tool5)
    MERGE (agent)-[:CAN_USE]->(tool6)
  `);

  console.log("   ✅ Coder Agent created with 8 capabilities, 4 permissions, 6 tools\n");

  // ============================================
  // DEBUGGER AGENT 🐛
  // ============================================
  console.log("🐛 Creating Debugger Agent...");

  await graph.query(`
    MERGE (agent:Agent {id: 'debugger'})
    SET agent.name = 'Debugger',
        agent.slug = 'debugger',
        agent.title = 'Advanced Debugging Assistant',
        agent.icon = '🐛',
        agent.type = 'debugging',
        agent.status = 'active',
        agent.model = 'claude',
        agent.intelligence = 95,
        agent.creativity = 20,
        agent.empathy = 15,
        agent.efficiency = 90,
        agent.level = 8,
        agent.xp = 0,
        agent.description = 'Find and fix bugs faster. Analyzes stack traces, identifies root causes, and suggests optimal solutions.',
        agent.placeholder = 'Paste your error or bug...',
        agent.createdAt = timestamp()
  `);

  // Debugger capabilities
  await graph.query(`
    MATCH (agent:Agent {id: 'debugger'})
    MERGE (cap1:Capability {name: 'bug_detection'})
    MERGE (cap2:Capability {name: 'stack_trace_analysis'})
    MERGE (cap3:Capability {name: 'file_read'})
    MERGE (cap4:Capability {name: 'log_analysis'})
    MERGE (cap5:Capability {name: 'fix_generation'})
    MERGE (cap6:Capability {name: 'memory_leak_detection'})
    MERGE (cap7:Capability {name: 'performance_profiling'})
    MERGE (cap8:Capability {name: 'root_cause_analysis'})
    MERGE (agent)-[:HAS_CAPABILITY]->(cap1)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap2)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap3)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap4)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap5)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap6)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap7)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap8)
  `);

  // Debugger file system permissions
  await graph.query(`
    MATCH (agent:Agent {id: 'debugger'})
    MERGE (perm:FilePermission {type: 'read', pattern: '**/*.{js,ts,jsx,tsx,py,go,rs}'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm)
    MERGE (perm2:FilePermission {type: 'read', pattern: 'logs/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm2)
    MERGE (perm3:FilePermission {type: 'read', pattern: '*.log'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm3)
    MERGE (perm4:FilePermission {type: 'write', pattern: 'src/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm4)
    MERGE (perm5:FilePermission {type: 'write', pattern: 'packages/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm5)
  `);

  // Debugger tools
  await graph.query(`
    MATCH (agent:Agent {id: 'debugger'})
    MERGE (tool1:Tool {name: 'readFile'})
    MERGE (tool2:Tool {name: 'editFile'})
    MERGE (tool3:Tool {name: 'runTests'})
    MERGE (tool4:Tool {name: 'analyzeLogs'})
    MERGE (tool5:Tool {name: 'createBugReport'})
    MERGE (tool6:Tool {name: 'profilePerformance'})
    MERGE (agent)-[:CAN_USE]->(tool1)
    MERGE (agent)-[:CAN_USE]->(tool2)
    MERGE (agent)-[:CAN_USE]->(tool3)
    MERGE (agent)-[:CAN_USE]->(tool4)
    MERGE (agent)-[:CAN_USE]->(tool5)
    MERGE (agent)-[:CAN_USE]->(tool6)
  `);

  console.log("   ✅ Debugger Agent created with 8 capabilities, 5 permissions, 6 tools\n");

  // ============================================
  // ARCHITECT AGENT 🏗️
  // ============================================
  console.log("🏗️ Creating Architect Agent...");

  await graph.query(`
    MERGE (agent:Agent {id: 'architect'})
    SET agent.name = 'Architect',
        agent.slug = 'architect',
        agent.title = 'System Architecture Designer',
        agent.icon = '🏗️',
        agent.type = 'architecture',
        agent.status = 'active',
        agent.model = 'claude',
        agent.intelligence = 98,
        agent.creativity = 85,
        agent.empathy = 20,
        agent.efficiency = 75,
        agent.level = 9,
        agent.xp = 0,
        agent.description = 'Design scalable system architectures. Plan microservices, databases, APIs, and infrastructure with best practices.',
        agent.placeholder = 'Describe your system architecture...',
        agent.createdAt = timestamp()
  `);

  // Architect capabilities
  await graph.query(`
    MATCH (agent:Agent {id: 'architect'})
    MERGE (cap1:Capability {name: 'system_design'})
    MERGE (cap2:Capability {name: 'architecture_review'})
    MERGE (cap3:Capability {name: 'file_read'})
    MERGE (cap4:Capability {name: 'diagram_generation'})
    MERGE (cap5:Capability {name: 'documentation'})
    MERGE (cap6:Capability {name: 'microservices_planning'})
    MERGE (cap7:Capability {name: 'database_design'})
    MERGE (cap8:Capability {name: 'api_design'})
    MERGE (cap9:Capability {name: 'scalability_planning'})
    MERGE (cap10:Capability {name: 'security_architecture'})
    MERGE (agent)-[:HAS_CAPABILITY]->(cap1)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap2)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap3)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap4)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap5)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap6)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap7)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap8)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap9)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap10)
  `);

  // Architect file system permissions (read-only mostly)
  await graph.query(`
    MATCH (agent:Agent {id: 'architect'})
    MERGE (perm:FilePermission {type: 'read', pattern: '**/*'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm)
    MERGE (perm2:FilePermission {type: 'write', pattern: 'docs/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm2)
    MERGE (perm3:FilePermission {type: 'write', pattern: 'architecture/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm3)
    MERGE (perm4:FilePermission {type: 'write', pattern: '*.md'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm4)
  `);

  // Architect tools
  await graph.query(`
    MATCH (agent:Agent {id: 'architect'})
    MERGE (tool1:Tool {name: 'readFile'})
    MERGE (tool2:Tool {name: 'listDirectory'})
    MERGE (tool3:Tool {name: 'createDiagram'})
    MERGE (tool4:Tool {name: 'writeDocumentation'})
    MERGE (tool5:Tool {name: 'analyzeArchitecture'})
    MERGE (tool6:Tool {name: 'generateSchema'})
    MERGE (agent)-[:CAN_USE]->(tool1)
    MERGE (agent)-[:CAN_USE]->(tool2)
    MERGE (agent)-[:CAN_USE]->(tool3)
    MERGE (agent)-[:CAN_USE]->(tool4)
    MERGE (agent)-[:CAN_USE]->(tool5)
    MERGE (agent)-[:CAN_USE]->(tool6)
  `);

  console.log("   ✅ Architect Agent created with 10 capabilities, 4 permissions, 6 tools\n");

  // ============================================
  // PM AGENT 🍜
  // ============================================
  console.log("🍜 Creating PM Agent...");

  await graph.query(`
    MERGE (agent:Agent {id: 'pm'})
    SET agent.name = 'PM',
        agent.slug = 'pm',
        agent.title = 'Project Manager AI',
        agent.icon = '🍜',
        agent.type = 'management',
        agent.status = 'active',
        agent.model = 'claude',
        agent.intelligence = 90,
        agent.creativity = 70,
        agent.empathy = 95,
        agent.efficiency = 85,
        agent.level = 10,
        agent.xp = 0,
        agent.description = 'Coordinate multiple agents, manage Kanban boards, track progress, and optimize team workload.',
        agent.placeholder = 'What should the team work on?',
        agent.createdAt = timestamp()
  `);

  // PM capabilities
  await graph.query(`
    MATCH (agent:Agent {id: 'pm'})
    MERGE (cap1:Capability {name: 'task_coordination'})
    MERGE (cap2:Capability {name: 'kanban_management'})
    MERGE (cap3:Capability {name: 'agent_orchestration'})
    MERGE (cap4:Capability {name: 'progress_tracking'})
    MERGE (cap5:Capability {name: 'reporting'})
    MERGE (cap6:Capability {name: 'workload_optimization'})
    MERGE (cap7:Capability {name: 'team_coordination'})
    MERGE (cap8:Capability {name: 'priority_management'})
    MERGE (agent)-[:HAS_CAPABILITY]->(cap1)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap2)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap3)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap4)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap5)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap6)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap7)
    MERGE (agent)-[:HAS_CAPABILITY]->(cap8)
  `);

  // PM file system permissions
  await graph.query(`
    MATCH (agent:Agent {id: 'pm'})
    MERGE (perm:FilePermission {type: 'read', pattern: '**/*'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm)
    MERGE (perm2:FilePermission {type: 'write', pattern: 'docs/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm2)
    MERGE (perm3:FilePermission {type: 'write', pattern: 'reports/**'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm3)
    MERGE (perm4:FilePermission {type: 'write', pattern: '*.md'})
    MERGE (agent)-[:HAS_PERMISSION]->(perm4)
  `);

  // PM tools
  await graph.query(`
    MATCH (agent:Agent {id: 'pm'})
    MERGE (tool1:Tool {name: 'createTask'})
    MERGE (tool2:Tool {name: 'updateTask'})
    MERGE (tool3:Tool {name: 'assignTask'})
    MERGE (tool4:Tool {name: 'createReport'})
    MERGE (tool5:Tool {name: 'coordinateAgents'})
    MERGE (tool6:Tool {name: 'trackProgress'})
    MERGE (tool7:Tool {name: 'optimizeWorkload'})
    MERGE (agent)-[:CAN_USE]->(tool1)
    MERGE (agent)-[:CAN_USE]->(tool2)
    MERGE (agent)-[:CAN_USE]->(tool3)
    MERGE (agent)-[:CAN_USE]->(tool4)
    MERGE (agent)-[:CAN_USE]->(tool5)
    MERGE (agent)-[:CAN_USE]->(tool6)
    MERGE (agent)-[:CAN_USE]->(tool7)
  `);

  console.log("   ✅ PM Agent created with 8 capabilities, 4 permissions, 7 tools\n");

  // ============================================
  // AGENT RELATIONSHIPS
  // ============================================
  console.log("🔗 Creating Agent Relationships...");

  // Connect all agents to store
  await graph.query(`
    MATCH (store:Store {id: 'sushi-store'})
    MATCH (coder:Agent {id: 'coder'})
    MATCH (debugger:Agent {id: 'debugger'})
    MATCH (architect:Agent {id: 'architect'})
    MATCH (pm:Agent {id: 'pm'})
    MERGE (store)-[:HOSTS]->(coder)
    MERGE (store)-[:HOSTS]->(debugger)
    MERGE (store)-[:HOSTS]->(architect)
    MERGE (store)-[:HOSTS]->(pm)
  `);

  // PM coordinates all other agents
  await graph.query(`
    MATCH (pm:Agent {id: 'pm'})
    MATCH (coder:Agent {id: 'coder'})
    MATCH (debugger:Agent {id: 'debugger'})
    MATCH (architect:Agent {id: 'architect'})
    MERGE (pm)-[:COORDINATES]->(coder)
    MERGE (pm)-[:COORDINATES]->(debugger)
    MERGE (pm)-[:COORDINATES]->(architect)
  `);

  // Architect designs, Coder implements
  await graph.query(`
    MATCH (architect:Agent {id: 'architect'})
    MATCH (coder:Agent {id: 'coder'})
    MERGE (architect)-[:DESIGNS_FOR]->(coder)
  `);

  // Coder generates, Debugger tests
  await graph.query(`
    MATCH (coder:Agent {id: 'coder'})
    MATCH (debugger:Agent {id: 'debugger'})
    MERGE (coder)-[:GENERATES_FOR]->(debugger)
  `);

  // Debugger fixes, Coder updates
  await graph.query(`
    MATCH (debugger:Agent {id: 'debugger'})
    MATCH (coder:Agent {id: 'coder'})
    MERGE (debugger)-[:REPORTS_TO]->(coder)
  `);

  // All agents can communicate with each other
  await graph.query(`
    MATCH (coder:Agent {id: 'coder'})
    MATCH (debugger:Agent {id: 'debugger'})
    MATCH (architect:Agent {id: 'architect'})
    MATCH (pm:Agent {id: 'pm'})
    MERGE (coder)-[:COMMUNICATES_WITH]->(debugger)
    MERGE (coder)-[:COMMUNICATES_WITH]->(architect)
    MERGE (coder)-[:COMMUNICATES_WITH]->(pm)
    MERGE (debugger)-[:COMMUNICATES_WITH]->(architect)
    MERGE (debugger)-[:COMMUNICATES_WITH]->(pm)
    MERGE (architect)-[:COMMUNICATES_WITH]->(pm)
  `);

  console.log("   ✅ Created 13 relationships between agents\n");

  // ============================================
  // INTEGRATION NODES
  // ============================================
  console.log("🔌 Creating Integration Nodes...");

  // BAM Integration
  await graph.query(`
    MERGE (bam:Integration {id: 'bam'})
    SET bam.name = 'BAM',
        bam.type = 'bug_detection',
        bam.description = 'Bug Analysis & Memory detection system',
        bam.icon = '🌮'
    WITH bam
    MATCH (debugger:Agent {id: 'debugger'})
    MERGE (debugger)-[:USES_INTEGRATION]->(bam)
  `);

  // STRIKE Integration
  await graph.query(`
    MERGE (strike:Integration {id: 'strike'})
    SET strike.name = 'STRIKE',
        strike.type = 'mutation_testing',
        strike.description = 'Mutation testing framework',
        strike.icon = '🍔'
    WITH strike
    MATCH (debugger:Agent {id: 'debugger'})
    MATCH (coder:Agent {id: 'coder'})
    MERGE (debugger)-[:USES_INTEGRATION]->(strike)
    MERGE (coder)-[:USES_INTEGRATION]->(strike)
  `);

  // Memory Integration
  await graph.query(`
    MERGE (memory:Integration {id: 'memory'})
    SET memory.name = 'Memory',
        memory.type = 'learning_system',
        memory.description = 'Learning system for bug prevention',
        memory.icon = '🥑'
    WITH memory
    MATCH (pm:Agent {id: 'pm'})
    MERGE (pm)-[:USES_INTEGRATION]->(memory)
  `);

  // Spatial Agents Integration
  await graph.query(`
    MERGE (spatial:Integration {id: 'spatial-agents'})
    SET spatial.name = 'Spatial Agents',
        spatial.type = 'coordination',
        spatial.description = 'Multi-agent coordination with FalkorDB',
        spatial.icon = '🍣'
    WITH spatial
    MATCH (pm:Agent {id: 'pm'})
    MERGE (pm)-[:USES_INTEGRATION]->(spatial)
  `);

  // Porffor Integration
  await graph.query(`
    MERGE (porffor:Integration {id: 'porffor'})
    SET porffor.name = 'Porffor',
        porffor.type = 'compiler',
        porffor.description = 'AOT JS/TS → WASM/C compiler',
        porffor.icon = '🍕'
    WITH porffor
    MATCH (coder:Agent {id: 'coder'})
    MATCH (architect:Agent {id: 'architect'})
    MERGE (coder)-[:USES_INTEGRATION]->(porffor)
    MERGE (architect)-[:USES_INTEGRATION]->(porffor)
  `);

  console.log("   ✅ Created 5 integrations (BAM, STRIKE, Memory, Spatial, Porffor)\n");

  // ============================================
  // LIFEOS ECOSYSTEM
  // ============================================
  console.log("🌍 Creating LifeOS Ecosystem Connections...");

  await graph.query(`
    MERGE (lifeos:Ecosystem {id: 'lifeos'})
    SET lifeos.name = 'LifeOS',
        lifeos.description = 'Suite of specialized AI agents that work together',
        lifeos.url = 'https://vex.chrry.ai'
    WITH lifeos
    MATCH (store:Store {id: 'sushi-store'})
    MERGE (store)-[:PART_OF]->(lifeos)
  `);

  // Other LifeOS apps
  await graph.query(`
    MATCH (lifeos:Ecosystem {id: 'lifeos'})
    MERGE (chrry:App {id: 'chrry', name: 'Chrry', icon: '🍒', domain: 'chrry.ai'})
    MERGE (vex:App {id: 'vex', name: 'Vex', icon: '🤖', domain: 'vex.chrry.ai'})
    MERGE (atlas:App {id: 'atlas', name: 'Atlas', icon: '🗺️', domain: 'vex.chrry.ai/atlas'})
    MERGE (bloom:App {id: 'bloom', name: 'Bloom', icon: '🌸', domain: 'vex.chrry.ai/bloom'})
    MERGE (peach:App {id: 'peach', name: 'Peach', icon: '🍑', domain: 'vex.chrry.ai/peach'})
    MERGE (vault:App {id: 'vault', name: 'Vault', icon: '💰', domain: 'vex.chrry.ai/vault'})
    MERGE (focus:App {id: 'focus', name: 'Focus', icon: '🎯', domain: 'vex.chrry.ai/focus'})
    MERGE (chrry)-[:PART_OF]->(lifeos)
    MERGE (vex)-[:PART_OF]->(lifeos)
    MERGE (atlas)-[:PART_OF]->(lifeos)
    MERGE (bloom)-[:PART_OF]->(lifeos)
    MERGE (peach)-[:PART_OF]->(lifeos)
    MERGE (vault)-[:PART_OF]->(lifeos)
    MERGE (focus)-[:PART_OF]->(lifeos)
  `);

  console.log("   ✅ Connected SUSHI to LifeOS ecosystem with 7 other apps\n");

  console.log("═══════════════════════════════════════════════════════");
  console.log("           ✅ SUSHI STORE SEEDING COMPLETE!            ");
  console.log("═══════════════════════════════════════════════════════\n");
}

/**
 * Get SUSHI Store Overview
 */
async function getSushiStoreOverview() {
  if (!graph) await initSushiSeeder();

  console.log("\n📊 SUSHI STORE OVERVIEW\n");

  // Get store info
  const storeInfo = await graph.query(`
    MATCH (store:Store {id: 'sushi-store'})
    RETURN store.name as name, store.domain as domain, store.description as description
  `);

  if (storeInfo && storeInfo.data && storeInfo.data.length > 0) {
    const { name, domain, description } = storeInfo.data[0];
    console.log(`🍣 ${name}`);
    console.log(`   ${domain}`);
    console.log(`   ${description}\n`);
  }

  // Get agents
  const agents = await graph.query(`
    MATCH (agent:Agent)
    RETURN agent.icon as icon, agent.name as name, agent.title as title, 
           agent.intelligence as intelligence, agent.level as level
    ORDER BY agent.level DESC
  `);

  console.log("👥 Agents:");
  if (agents && agents.data) {
    for (const agent of agents.data) {
      const { icon, name, title, intelligence, level } = agent;
      console.log(`   ${icon} ${name} - ${title}`);
      console.log(`      INT: ${intelligence} | Level: ${level}`);
    }
  }

  // Get capabilities count
  const capCount = await graph.query(`
    MATCH (cap:Capability)
    RETURN COUNT(cap) as count
  `);

  console.log(`\n🎯 Total Capabilities: ${capCount?.data?.[0]?.count || 0}`);

  // Get tools count
  const toolCount = await graph.query(`
    MATCH (tool:Tool)
    RETURN COUNT(tool) as count
  `);

  console.log(`🔧 Total Tools: ${toolCount?.data?.[0]?.count || 0}`);

  // Get integrations
  const integrations = await graph.query(`
    MATCH (int:Integration)
    RETURN int.icon as icon, int.name as name, int.type as type
  `);

  console.log(`\n🔌 Integrations:`);
  if (integrations && integrations.data) {
    for (const int of integrations.data) {
      const { icon, name, type } = int;
      console.log(`   ${icon} ${name} (${type})`);
    }
  }

  // Get relationships count
  const relCount = await graph.query(`
    MATCH ()-[r]->()
    RETURN COUNT(r) as count
  `);

  console.log(`\n🔗 Total Relationships: ${relCount?.data?.[0]?.count || 0}\n`);
}

/**
 * Query Agent by ID
 */
async function getAgent(agentId) {
  if (!graph) await initSushiSeeder();

  const result = await graph.query(
    `
    MATCH (agent:Agent {id: $agentId})
    OPTIONAL MATCH (agent)-[:HAS_CAPABILITY]->(cap:Capability)
    OPTIONAL MATCH (agent)-[:CAN_USE]->(tool:Tool)
    OPTIONAL MATCH (agent)-[:HAS_PERMISSION]->(perm:FilePermission)
    RETURN agent, 
           COLLECT(DISTINCT cap.name) as capabilities,
           COLLECT(DISTINCT tool.name) as tools,
           COLLECT(DISTINCT {type: perm.type, pattern: perm.pattern}) as permissions
  `,
    { params: { agentId } }
  );

  if (result && result.data && result.data.length > 0) {
    return result.data[0];
  }

  return null;
}

async function closeSushiSeeder() {
  if (db) {
    await db.close();
    db = null;
    graph = null;
    console.log("👋 SUSHI Seeder closed");
  }
}

async function main() {
  await seedSushiStore();
  await getSushiStoreOverview();
  await closeSushiSeeder();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  initSushiSeeder,
  seedSushiStore,
  getSushiStoreOverview,
  getAgent,
  closeSushiSeeder,
};
