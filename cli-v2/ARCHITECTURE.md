# 🍣 SUSHI CLI v2 Architecture

> Claude Code killer - Spatial AI CLI with Multi-modal Support

## 🎯 Design Goals

1. **Claude Code Parity** - Same power, more features
2. **Spatial Navigation** - X/Y/Z coordinate system (patent)
3. **DNA Threading** - Agent evolution and memory
4. **Multi-modal** - Text, image, voice, files
5. **Persistent Memory** - FalkorDB vector + graph
6. **MCP Ecosystem** - Extensible tools

---

## 🏗️ Tech Stack

| Layer                | Technology               | Reason                             |
| -------------------- | ------------------------ | ---------------------------------- |
| **TUI Framework**    | Ink (React for Terminal) | Modern, React-based, type-safe     |
| **State Management** | Zustand                  | Simple, fast, no boilerplate       |
| **Database**         | FalkorDB (existing)      | Graph + Vector, already have it    |
| **AI Streaming**     | Vercel AI SDK            | Standard streaming, multi-provider |
| **MCP**              | Official TypeScript SDK  | Standard tool protocol             |
| **Multi-modal**      | clipboardy + mic         | Image paste, voice input           |
| **Build**            | tsx + pkg                | Fast dev, binary distribution      |

---

## 📁 Project Structure

```
packages/sushi/cli-v2/
├── src/
│   ├── components/          # Ink UI components
│   │   ├── App.tsx         # Main app container
│   │   ├── SpatialNav.tsx  # X/Y/Z navigation panel
│   │   ├── Chat.tsx        # AI conversation
│   │   ├── CodeView.tsx    # File editor/diff
│   │   ├── MemoryGraph.tsx # FalkorDB visualization
│   │   ├── ToolCall.tsx    # MCP tool execution
│   │   └── StatusBar.tsx   # Bottom status
│   │
│   ├── agents/             # DNA-based agents
│   │   ├── base.ts         # Base agent class
│   │   ├── sensei.ts       # Architect (STRIKE)
│   │   ├── student.ts      # Coder
│   │   ├── debugger.ts     # Bug finder
│   │   └── dna.ts          # DNA thread management
│   │
│   ├── db/                 # FalkorDB client
│   │   ├── client.ts       # Connection
│   │   ├── memory.ts       # Vector operations
│   │   ├── spatial.ts      # Coordinate queries
│   │   └── graph.ts        # Relationship queries
│   │
│   ├── mcp/                # Model Context Protocol
│   │   ├── client.ts       # MCP client
│   │   ├── tools.ts        # Tool definitions
│   │   ├── servers.ts      # Server management
│   │   └── registry.ts     # Tool registry
│   │
│   ├── hooks/              # React hooks
│   │   ├── useAI.ts        # AI streaming
│   │   ├── useMemory.ts    # Memory retrieval
│   │   ├── useSpatial.ts   # Navigation
│   │   └── useMCP.ts       # Tool execution
│   │
│   ├── types/              # TypeScript types
│   │   ├── spatial.ts      # Coordinate system
│   │   ├── agent.ts        # Agent types
│   │   ├── memory.ts       # Memory nodes
│   │   └── mcp.ts          # MCP types
│   │
│   ├── utils/              # Utilities
│   │   ├── git.ts          # Git operations
│   │   ├── files.ts        # File system
│   │   ├── diff.ts         # Diff parsing
│   │   └── streaming.ts    # SSE handling
│   │
│   └── index.tsx           # Entry point
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧬 Spatial Coordinate System

```typescript
interface SpatialCoordinate {
  x: string;  // App/Agent ID (vex, vault, sensei, student)
  y: string;  // Context/Workspace (auth, payment, ui)
  z: number;  // Time/Version (timestamp or sequence)
}

// Navigation commands
@x:vex        → Switch to Vex app context
@y:auth       → Switch to auth workspace
@z:-1         → Go back in time
@x:sensei:y:payment  → Jump to specific coordinate
```

---

## 🧠 Memory System (FalkorDB)

```cypher
// Memory Node
CREATE (m:Memory {
  id: 'mem_123',
  content: 'User wants to fix auth bug',
  embedding: [...],  // Vector
  coordinate: {x: 'sensei', y: 'auth', z: 1234567890},
  type: 'conversation',
  agent: 'sensei',
  timestamp: 1234567890
})

// Relationships
CREATE (m)-[:RELATED_TO]->(file:File {path: 'src/auth.ts'})
CREATE (m)-[:NEXT]->(next:Memory)
CREATE (m)-[:SIMILAR {score: 0.95}]->(other:Memory)
```

---

## 🤖 Agent DNA System

```typescript
interface DNAThread {
  id: string;
  agent: "sensei" | "student" | "debugger";
  level: number; // 1-99 (XP-based)
  xp: number;

  // Genetic code
  systemPrompt: string;
  tools: string[];
  autonomyLevel: "manual" | "semi" | "full";

  // Evolution
  mutations: Mutation[];
  feedback: InterAppFeedback[];

  // Spatial position
  coordinate: SpatialCoordinate;
}

// Agent levels up by killing mutations
function gainXP(agent: Agent, killedMutations: number) {
  agent.xp += killedMutations * 50;
  agent.level = Math.floor(agent.xp / 100);
}
```

---

## 🛠️ MCP Tool System

```typescript
// Built-in tools
const tools: MCPTool[] = [
  { name: "read_file", description: "Read file contents" },
  { name: "write_file", description: "Write file with changes" },
  { name: "run_command", description: "Execute shell command" },
  { name: "search_code", description: "Search codebase" },
  { name: "git_diff", description: "Show git diff" },
  { name: "strike_test", description: "Run mutation testing" },
  { name: "view_image", description: "Analyze image" },
  { name: "voice_input", description: "Transcribe voice" },
];

// External MCP servers
const servers = [
  { name: "filesystem", transport: "stdio" },
  { name: "github", transport: "http" },
  { name: "stripe", transport: "sse" },
];
```

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🍣 SUSHI v2.0                     x:sensei y:auth z:1234   │
├──────────────────┬──────────────────┬───────────────────────┤
│                  │                  │                       │
│  Spatial         │   Chat/AI        │   Code/Diff          │
│  Navigator       │   Conversation   │   View               │
│                  │                  │                       │
│  [x:sensei]      │   > Fix auth     │   ┌─ src/auth.ts ─┐  │
│  [y:auth]        │     bug          │   │ - login()     │  │
│  [z:now]         │                  │   │ + login() {   │  │
│                  │   Sensei:        │   │ +   if (!user)│  │
│  History:        │   I'll analyze   │   │ +     throw   │  │
│  [z:-1] auth     │   the auth flow  │   └───────────────┘  │
│  [z:-2] payment  │                  │                       │
│                  │   [Thinking...]  │   [Apply] [Reject]   │
│                  │                  │                       │
├──────────────────┴──────────────────┴───────────────────────┤
│  ⚡ STRIKE: 95% │ 💾 Saved │ 🔧 Tools: 12 │ 📊 Tokens: 4.2k │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
User Input
    ↓
Spatial Parser (extract @x:y:z)
    ↓
Memory Retrieval (FalkorDB vector search)
    ↓
Agent Selection (based on DNA + coordinate)
    ↓
MCP Tool Planning
    ↓
AI Streaming (Vercel AI SDK)
    ↓
Tool Execution
    ↓
Result Storage (FalkorDB)
    ↓
UI Update (Ink re-render)
```

---

## 🚀 Key Features

### 1. Natural Commands

```bash
# Spatial navigation
sushi> @x:vault fix the login bug

# With context
sushi> @y:payment @z:-1 what did we change?

# DNA evolution
sushi> sensei strike src/auth.ts

# Multi-modal
sushi> [paste image] implement this UI
sushi> /voice add user profile feature
```

### 2. Persistent Context

- Every conversation stored in FalkorDB
- Vector embeddings for semantic search
- Spatial coordinates for navigation
- Git integration for code context

### 3. Agent Evolution

- Agents level up by killing mutations
- DNA threads track evolution
- Inter-agent feedback loop
- Automatic skill improvement

### 4. Real-time Streaming

- Token-by-token display
- Tool execution progress
- File operation status
- Streaming diff view

---

## 📦 Dependencies

```json
{
  "ink": "^6.x",
  "react": "^19.x",
  "zustand": "^5.x",
  "ai": "^4.x",
  "@modelcontextprotocol/sdk": "^1.x",
  "falkordb": "^6.x",
  "clipboardy": "^4.x",
  "mic": "^2.x",
  "simple-git": "^3.x",
  "diff": "^7.x"
}
```

---

## 🎓 Claude Code Parity Checklist

| Feature          | Claude Code | SUSHI v2         |
| ---------------- | ----------- | ---------------- |
| Terminal UI      | ✅          | ✅ (Ink)         |
| Multi-file edits | ✅          | ✅ (MCP)         |
| Git integration  | ✅          | ✅               |
| Streaming        | ✅          | ✅               |
| Plan/Act mode    | ✅          | ✅ (Sensei mode) |
| Multi-model      | ❌          | ✅               |
| Spatial nav      | ❌          | ✅               |
| DNA threading    | ❌          | ✅               |
| Mutation testing | ❌          | ✅               |
| Image input      | ✅          | ✅               |
| Voice input      | ❌          | ✅               |
| OSS              | ❌          | ✅               |

---

**Next:** Core implementation starts with `package.json` and entry point.
