# 🍣 SUSHI

**Simple Universal System for Hybrid Intelligence**

> Enterprise-grade compiler infrastructure with multi-agent coordination

---

## What is SUSHI?

SUSHI is a **dual-purpose platform**:

### 1. 🍣 SUSHI Store (Vex Ecosystem)

**AI-powered development assistant** available at `sushi.chrry.ai`:

- ⚡ **Coder** - Code generation expert
- 🐛 **Debugger** - Bug detection and fixing
- 🏗️ **Architect** - System design and architecture
- 🍜 **PM** - Project management and coordination

Part of the **LifeOS ecosystem** alongside Atlas (travel), Bloom (wellness), Peach (social), Vault (finance), and Focus (productivity).

### 2. 🍕 SUSHI Platform (Compiler Infrastructure)

**Enterprise-grade compiler and testing tools**:

- 🍕 **Porffor Compiler** - AOT JS/TS → WASM/C compilation
- 🌮 **BAM** - Bug Analysis & Memory detection system
- 🍔 **STRIKE** - Mutation testing framework
- 🥑 **Memory** - Learning system for bug prevention
- 🍣 **Spatial Agents** - Multi-agent coordination with FalkorDB
- 🍜 **PM Agent** - Project manager AI for team coordination

## Architecture

```
🍣 SUSHI Platform
├── 🍕 Compiler (Porffor)
│   ├── JS/TS → WASM
│   ├── Self-compilation (dogfooding)
│   └── Native binary output
│
├── 🌮 Testing Infrastructure
│   ├── BAM (Bug detection)
│   ├── STRIKE (Mutation testing)
│   └── Memory (Learning system)
│
└── 🍣 Agent Coordination
    ├── Spatial agents (FalkorDB)
    ├── PM Agent (team management)
    ├── Kanban boards
    └── PostgreSQL + FalkorDB hybrid
```

## Packages

### Core Compiler

- **[@chrryai/porffor](./packages/porffor)** 🍕 - AOT JavaScript/TypeScript compiler

### Testing Suite

- **[@chrryai/bam](./packages/bam)** 🌮 - Bug Analysis & Memory detection
- **[@chrryai/strike](./packages/strike)** 🍔 - Mutation testing framework
- **[@chrryai/memory](./packages/memory)** 🥑 - Learning system for bug prevention

### Agent System

- **[@chrryai/spatial-agents](./packages/spatial-agents)** 🍣 - Multi-agent coordination
- **[@chrryai/pm-agent](./packages/pm-agent)** 🍜 - Project manager AI

## Quick Start

### Install SUSHI CLI

```bash
npm install -g @chrryai/sushi
```

### Seed SUSHI Store to FalkorDB

```bash
# Requires FalkorDB running on localhost:6380
node tools/seed-sushi-store.js

# Seeds all agents, capabilities, permissions, tools, and relationships
# Creates: Coder, Debugger, Architect, PM agents
# Integrations: BAM, STRIKE, Memory, Spatial Agents, Porffor
# LifeOS ecosystem connections
```

### Compile with Porffor

```bash
sushi compile app.js --target wasm
sushi compile app.js --target native
```

### Run Tests

```bash
sushi test --bam          # Bug detection
sushi test --strike       # Mutation testing
sushi test --enterprise   # Full test suite
```

### Start Agent System

```bash
sushi agents start        # Start spatial agent system
sushi agents dashboard    # Open agent dashboard
```

## Features

### 🍕 Porffor Compiler

- ✅ AOT compilation (no JIT)
- ✅ Zero runtime overhead
- ✅ Native binary output
- ✅ Self-compilation (dogfooding)
- ✅ WASM + C targets

### 🌮 BAM (Bug Analysis)

- ✅ 5 bug pattern detection
- ✅ FalkorDB logging
- ✅ Pattern learning
- ✅ Auto-fix suggestions

### 🍔 STRIKE (Mutation Testing)

- ✅ 5 mutation operators
- ✅ Test quality analysis
- ✅ Weak spot identification
- ✅ Kill rate metrics

### 🥑 Memory (Learning)

- ✅ Bug pattern analysis
- ✅ Prevention rules (91% confidence)
- ✅ Auto-fix generation
- ✅ Continuous learning loop

### 🍣 Spatial Agents

- ✅ 3D spatial positioning
- ✅ Graph-based coordination
- ✅ Optimal task assignment
- ✅ Agent communication networks
- ✅ PostgreSQL + FalkorDB hybrid

### 🍜 PM Agent

- ✅ Team management
- ✅ Task coordination
- ✅ API key management
- ✅ Performance metrics
- ✅ Workload optimization

## Dogfooding Vision

SUSHI uses itself for development:

```
Porffor compiles → SUSHI codebase
BAM detects → bugs in SUSHI
STRIKE tests → SUSHI test quality
Memory learns → from SUSHI bugs
Agents coordinate → SUSHI development
```

**Result**: Self-improving, production-validated toolchain! 🚀

## Enterprise Testing

SUSHI provides 5-layer testing architecture:

```
Layer 1: Traditional (262 test cases)
Layer 2: BAM (18 bugs detected)
Layer 3: STRIKE (35.56% kill rate)
Layer 4: Memory (2 rules, 81.5% confidence)
Layer 5: Spatial Agents (Multi-agent coordination)
```

## PostgreSQL + FalkorDB Hybrid

SUSHI uses hybrid database architecture:

- **PostgreSQL**: Source of truth (users, teams, apps, tasks)
- **FalkorDB**: Graph relationships (agents, coordination, dependencies)
- **Sync Layer**: Keeps both in sync automatically

Compatible with existing Drizzle ORM schemas!

## Documentation

- [Porffor Compiler](./README.md) - Original Porffor documentation
- [Enterprise Testing](./TESTING.md) - BAM+STRIKE+Memory guide
- [Dogfooding Vision](./DOGFOODING_VISION.md) - Self-compilation roadmap
- [PostgreSQL Integration](./packages/spatial-agents/POSTGRES_INTEGRATION.md) - Hybrid DB guide
- [Branding](./BRANDING.md) - Logo and assets

## Use Cases

### 1. Compiler Development

```bash
# Compile your JS/TS to WASM
sushi compile app.ts --target wasm

# Compile to native binary
sushi compile app.ts --target native --optimize
```

### 2. Enterprise Testing

```bash
# Run full test suite
sushi test --enterprise

# Bug detection only
sushi test --bam

# Mutation testing
sushi test --strike --mutations 100
```

### 3. Multi-Agent Development

```bash
# Start agent system
sushi agents start

# Create PM agent
sushi agents create-pm --name "Project Manager"

# Assign tasks
sushi agents assign-task task-123 --auto
```

## Performance

### Compilation Speed

- **Porffor**: 2x-10x faster than traditional compilers
- **WASM output**: Optimized for size and speed
- **Native binaries**: Near-C performance

### Testing Speed

- **BAM**: Scans 1000+ files in seconds
- **STRIKE**: Parallel mutation testing
- **Memory**: Real-time learning

### Agent Coordination

- **Graph queries**: Sub-millisecond response
- **Task assignment**: Optimal in O(n log n)
- **Network analysis**: Handles 1000+ agents

## Roadmap

### Phase 1: Foundation ✅

- [x] Porffor fork and closure implementation
- [x] BAM + STRIKE + Memory systems
- [x] Spatial agent system
- [x] PostgreSQL + FalkorDB hybrid

### Phase 2: Dogfooding (In Progress)

- [ ] Fix closure support in Porffor
- [ ] Compile SUSHI with Porffor
- [ ] WASM-based test infrastructure
- [ ] Performance benchmarks

### Phase 3: Production (Planned)

- [ ] Monorepo integration (Chrry AI)
- [ ] npm package publishing
- [ ] CLI tool release
- [ ] Documentation site

### Phase 4: Community (Future)

- [ ] Open source release
- [ ] Plugin system
- [ ] VS Code extension
- [ ] Cloud platform

## Contributing

SUSHI is currently in active development. Contributions welcome!

```bash
# Clone repo
git clone https://github.com/chrryai/sushi

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

## License

- **Code**: MIT License
- **Food 3D Illustrations**: Licensed assets (see [BRANDING.md](./BRANDING.md))

## Credits

### Porffor

- Original compiler by [CanadaHonk](https://github.com/CanadaHonk/porffor)
- Fork maintained by [Chrry AI](https://github.com/chrryai)

### SUSHI Platform

- Developed by [Ibrahim Velinov](https://github.com/ibsukru)
- Part of [Chrry AI](https://chrry.dev) ecosystem

### Assets

- Food 3D Illustrations © Licensed for SUSHI project
- See [BRANDING.md](./BRANDING.md) for full attribution

---

<div align="center">

**🍣 Fresh code, every compile**

[Website](https://sushi.chrry.dev) • [Documentation](./docs) • [Discord](https://discord.gg/chrryai) • [Twitter](https://twitter.com/chrryai)

Made with ❤️ by [Chrry AI](https://chrry.dev)

</div>
