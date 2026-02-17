# 🍣 SUSHI Seed Configuration

## Overview

SUSHI agents can be seeded with API keys and file system access to work autonomously on your codebase.

## Agent Configuration

### ⚡ Coder (Code Generation Expert)

```typescript
{
  slug: "coder",
  name: "Coder",
  capabilities: [
    "code_generation",
    "file_write",
    "git_commit",
    "test_generation",
    "documentation"
  ],
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fileSystemAccess: {
    read: ["**/*.{js,ts,jsx,tsx,py,go,rs}"],
    write: ["src/**", "packages/**", "tests/**"],
    exclude: ["node_modules/**", ".git/**", "dist/**"]
  },
  tools: [
    "createFile",
    "editFile",
    "deleteFile",
    "runCommand",
    "gitCommit"
  ]
}
```

**Use Cases:**

- Generate new features from specifications
- Implement API endpoints
- Create test suites
- Write documentation
- Refactor code

### 🐛 Debugger (Bug Detection & Fixing)

```typescript
{
  slug: "debugger",
  name: "Debugger",
  capabilities: [
    "bug_detection",
    "stack_trace_analysis",
    "file_read",
    "log_analysis",
    "fix_generation"
  ],
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fileSystemAccess: {
    read: ["**/*.{js,ts,jsx,tsx,py,go,rs}", "logs/**", "*.log"],
    write: ["src/**", "packages/**"],
    exclude: ["node_modules/**", ".git/**"]
  },
  tools: [
    "readFile",
    "editFile",
    "runTests",
    "analyzeLogs",
    "createBugReport"
  ]
}
```

**Use Cases:**

- Analyze error logs
- Fix runtime bugs
- Detect memory leaks
- Optimize performance
- Generate bug reports

### 🏗️ Architect (System Design)

```typescript
{
  slug: "architect",
  name: "Architect",
  capabilities: [
    "system_design",
    "architecture_review",
    "file_read",
    "diagram_generation",
    "documentation"
  ],
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fileSystemAccess: {
    read: ["**/*"],
    write: ["docs/**", "architecture/**", "*.md"],
    exclude: ["node_modules/**", ".git/**", "dist/**"]
  },
  tools: [
    "readFile",
    "listDirectory",
    "createDiagram",
    "writeDocumentation",
    "analyzeArchitecture"
  ]
}
```

**Use Cases:**

- Review system architecture
- Design new features
- Create technical documentation
- Generate architecture diagrams
- Identify architectural issues

### 🍜 PM (Project Manager)

```typescript
{
  slug: "pm",
  name: "PM",
  capabilities: [
    "task_coordination",
    "kanban_management",
    "agent_orchestration",
    "progress_tracking",
    "reporting"
  ],
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  fileSystemAccess: {
    read: ["**/*"],
    write: ["docs/**", "reports/**", "*.md"],
    exclude: ["node_modules/**", ".git/**"]
  },
  tools: [
    "createTask",
    "updateTask",
    "assignTask",
    "createReport",
    "coordinateAgents"
  ],
  integrations: {
    falkordb: process.env.FALKORDB_URL,
    postgres: process.env.DATABASE_URL
  }
}
```

**Use Cases:**

- Coordinate multiple agents
- Track project progress
- Manage Kanban boards
- Generate status reports
- Optimize team workload

## Environment Variables

Create a `.env` file in your project root:

```bash
# AI API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database Connections
FALKORDB_URL=redis://localhost:6380
DATABASE_URL=postgresql://user:pass@localhost:5432/sushi

# Agent Configuration
SUSHI_WORKSPACE=/path/to/your/project
SUSHI_AUTO_COMMIT=true
SUSHI_AUTO_TEST=true
```

## Usage Examples

### 1. Generate a New Feature

```bash
# Coder generates feature implementation
sushi coder "Create a REST API endpoint for user authentication with JWT"

# Output:
# ✅ Created src/api/auth.ts
# ✅ Created tests/api/auth.test.ts
# ✅ Updated src/api/routes.ts
# ✅ Generated documentation
# 🎯 Ready for review!
```

### 2. Debug an Error

```bash
# Debugger analyzes and fixes bug
sushi debugger "Fix TypeError: Cannot read property 'id' of undefined in user.service.ts"

# Output:
# 🔍 Analyzing stack trace...
# 🐛 Root cause: Missing null check on line 45
# ✅ Applied fix with optional chaining
# ✅ Added unit test for edge case
# 🎯 Bug fixed!
```

### 3. Review Architecture

```bash
# Architect reviews system design
sushi architect "Review the current microservices architecture and suggest improvements"

# Output:
# 📊 Generated architecture diagram
# 📝 Identified 3 potential bottlenecks
# 💡 Suggested improvements:
#    - Add API gateway for better routing
#    - Implement circuit breaker pattern
#    - Optimize database queries
# 🎯 Report saved to docs/architecture-review.md
```

### 4. Coordinate Development

```bash
# PM orchestrates multiple agents
sushi pm "Implement user profile feature: design, code, test, document"

# Output:
# 🏗️ Architect: Designed feature architecture
# ⚡ Coder: Generated implementation
# 🐛 Debugger: Ran tests and fixed issues
# 📝 Architect: Created documentation
# ✅ Feature complete!
# 🎯 Ready for deployment
```

## Multi-Agent Collaboration

SUSHI agents can work together on complex tasks:

```typescript
// Example: Full feature implementation pipeline
const pipeline = {
  1: {
    agent: "architect",
    task: "Design user profile feature architecture",
    output: "architecture/user-profile.md",
  },
  2: {
    agent: "coder",
    task: "Implement user profile based on architecture",
    input: "architecture/user-profile.md",
    output: "src/features/user-profile/**",
  },
  3: {
    agent: "debugger",
    task: "Test and fix any issues",
    input: "src/features/user-profile/**",
    output: "Fixed code + test results",
  },
  4: {
    agent: "architect",
    task: "Generate documentation",
    input: "src/features/user-profile/**",
    output: "docs/user-profile.md",
  },
  5: {
    agent: "pm",
    task: "Create deployment checklist",
    input: "All previous outputs",
    output: "deployment-checklist.md",
  },
}
```

## Security Best Practices

1. **API Key Management**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly
   - Use separate keys for dev/prod

2. **File System Access**
   - Limit write access to necessary directories
   - Exclude sensitive files (.env, credentials)
   - Use read-only mode when possible
   - Review all agent changes before committing

3. **Agent Permissions**
   - Grant minimum necessary permissions
   - Review agent actions in logs
   - Implement approval workflows for critical changes
   - Use sandboxed environments for testing

## Integration with SUSHI Platform

SUSHI agents use the platform infrastructure:

- **BAM** - Detects bugs before agents fix them
- **STRIKE** - Tests agent-generated code
- **Memory** - Learns from agent actions
- **Spatial Agents** - Coordinates multi-agent workflows
- **PM Agent** - Orchestrates complex tasks

## Getting Started

1. Install SUSHI CLI:

```bash
npm install -g @chrryai/sushi
```

2. Initialize workspace:

```bash
sushi init
# Creates .sushi/ directory with agent configs
```

3. Configure agents:

```bash
sushi config --agent coder --api-key $ANTHROPIC_API_KEY
sushi config --agent debugger --api-key $ANTHROPIC_API_KEY
sushi config --agent architect --api-key $ANTHROPIC_API_KEY
sushi config --agent pm --api-key $ANTHROPIC_API_KEY
```

4. Start working:

```bash
sushi coder "Your task here"
sushi debugger "Your bug here"
sushi architect "Your design question here"
sushi pm "Your project goal here"
```

## Monitoring & Logging

All agent actions are logged to FalkorDB:

```bash
# View agent activity
sushi logs --agent coder --last 10

# View agent performance
sushi stats --agent debugger

# View multi-agent workflows
sushi workflows --status active
```

## Future Enhancements

- [ ] Real-time collaboration between agents
- [ ] Voice commands for agent tasks
- [ ] Visual workflow builder
- [ ] Agent learning from user feedback
- [ ] Integration with GitHub Actions
- [ ] Slack/Discord notifications
- [ ] Custom agent training

---

**Made with ❤️ by the SUSHI team** 🍣
