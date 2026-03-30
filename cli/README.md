# 🍣 SUSHI CLI

**Terminal AI Development Assistant with File System Access**

Lightweight, ahead-of-time AI built-in compiler that works directly from your terminal with full file system access.

## Features

- ⚡ **Coder** - Generate production-ready code
- 🐛 **Debugger** - Find and fix bugs instantly
- 🏗️ **Architect** - Design scalable systems
- 🍜 **PM** - Coordinate multi-agent workflows
- ⚡ **STRIKE** - Mutation testing for code quality
- 💳 **Guest Mode** - 100 free credits to start
- 🔑 **Unlimited Mode** - Add API key for unlimited usage
- 📁 **File System Access** - Read/write code directly
- 🚀 **AOT Compilation** - Ahead-of-time optimized

## Installation

### Global Install (Recommended)

```bash
npm install -g @chrryai/sushi-cli
```

### Local Install

```bash
cd cli
npm install
npm link
```

## Quick Start

### 1. Initialize SUSHI

```bash
sushi init
```

This creates `.sushi/config.json` in your project with agent permissions.

### 2. Check Status

```bash
sushi status
```

Shows available agents, credits, and integrations.

### 3. Configure API Key (Optional)

```bash
# Interactive setup
sushi config

# Direct setup - Anthropic (Claude)
sushi config --api-key sk-ant-...

# Direct setup - OpenAI (GPT)
sushi config --openai-key sk-...

# Direct setup - DeepSeek (R1/Chat)
sushi config --deepseek-key sk-...

# Show current config
sushi config --show
```

**Guest Mode (Default):**

- 100 free credits
- Coder: 10 credits per use
- Debugger: 8 credits per use
- Architect: 12 credits per use
- PM: 15 credits per use

**Unlimited Mode (API Key):**

- No credit limits
- Faster responses
- Priority support

## Usage

### ⚡ Coder - Generate Code

```bash
# Generate code
sushi coder "Create a REST API endpoint for user authentication"

# Save to file
sushi coder "Create a React component" --file src/Component.jsx

# Specify language
sushi coder "Sort algorithm" --language python
```

**Examples:**

```bash
sushi coder "Express.js middleware for JWT auth"
sushi coder "React hook for data fetching" -f src/hooks/useFetch.js
sushi coder "Python function to parse CSV" -l python
```

### 🐛 Debugger - Fix Bugs

```bash
# Debug error
sushi debugger "TypeError: Cannot read property 'id' of undefined"

# Debug specific file
sushi debugger "Memory leak in server.js" --file server.js
```

**Examples:**

```bash
sushi debugger "ReferenceError: x is not defined"
sushi debugger "Async function not awaiting properly" -f api/users.js
sushi debugger "Performance issue in database query"
```

### 🏗️ Architect - Design Systems

```bash
# Design architecture
sushi architect "Microservices architecture for e-commerce platform"

# Save documentation
sushi architect "Database schema for social network" --output docs/schema.md
```

**Examples:**

```bash
sushi architect "Scalable chat application with WebSockets"
sushi architect "Event-driven architecture for analytics" -o docs/architecture.md
sushi architect "API design for mobile app backend"
```

### 🍜 PM - Coordinate Tasks

```bash
# Create development plan
sushi pm "Implement user authentication feature"

# Multi-agent coordination
sushi pm "Build and deploy new API endpoint"
```

**Examples:**

```bash
sushi pm "Refactor authentication system"
sushi pm "Add real-time notifications feature"
sushi pm "Optimize database queries and add caching"
```

### ⚡ STRIKE - Mutation Testing

```bash
# Run mutation testing on a file
sushi strike src/utils.js

# Test multiple files
sushi strike src/utils.js src/api.js

# Specify test command
sushi strike src/math.js --test "npm test"

# Show weak spots (survived mutations)
sushi strike src/*.js --weak-spots

# Dry run - generate mutations without running tests
sushi strike src/utils.js --dry-run

# Filter mutation categories
sushi strike src/utils.js --category "arithmetic,comparison"
```

**What is Mutation Testing?**

STRIKE creates small changes (mutations) to your code and checks if your tests catch them. If a mutation survives (tests pass), your tests need improvement.

**Examples:**

```bash
# Basic mutation testing
sushi strike src/calculator.js

# Test with custom test command
sushi strike src/auth.js --test "jest auth.test.js"

# Find weak spots in your test coverage
sushi strike src/**/*.js --weak-spots

# Generate report
sushi strike src/math.js --output json > mutation-report.json
```

**Understanding Results:**

- **Killed** ✅ - Mutation was caught by tests (good!)
- **Survived** 💀 - Mutation passed tests (needs more tests)
- **Score** 📊 - Percentage of mutations killed (target: 80%+)

**Credit Cost:** 20 credits per use (Guest mode)

## Credit Management

### View Credits

```bash
# Show balance
sushi credits

# Show usage history
sushi credits --history
```

### How Credits Work

**Guest Mode (100 free credits):**

- Coder: 10 credits (10 uses)
- Debugger: 8 credits (12 uses)
- Architect: 12 credits (8 uses)
- PM: 15 credits (6 uses)
- STRIKE: 20 credits (5 uses)

**Unlimited Mode:**

- Add API key: `sushi config --api-key sk-ant-...`
- No credit limits
- All agents available unlimited

## Security

### API Key Encryption

All API keys are **encrypted** before being saved to disk:

- **AES-256-CBC encryption** with machine-specific key
- Encryption key derived from hostname + username
- Keys are never stored in plain text
- Automatic encryption/decryption on save/load

**Config file example:**

```json
{
  "apiKeys": {
    "anthropic": "a1b2c3d4:encrypted_data_here...",
    "openai": "e5f6g7h8:encrypted_data_here...",
    "deepseek": "i9j0k1l2:encrypted_data_here..."
  },
  "mode": "unlimited"
}
```

Your API keys are safe! 🔒

## Configuration

### Config File Location

```
~/.sushi/config.json (API keys encrypted)
~/.sushi/credits.json
```

### Project Config

```json
// .sushi/config.json
{
  "name": "my-project",
  "agents": {
    "coder": { "enabled": true },
    "debugger": { "enabled": true },
    "architect": { "enabled": true },
    "pm": { "enabled": true },
    "strike": { "enabled": true }
  },
  "fileAccess": {
    "read": ["**/*.{js,ts,jsx,tsx,py,go,rs}"],
    "write": ["src/**", "packages/**"],
    "exclude": ["node_modules/**", ".git/**"]
  }
}
```

### Reset Configuration

```bash
sushi config --reset
```

## File System Access

SUSHI agents have controlled file system access:

**Read Access:**

- All source code files (`.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.go`, `.rs`)
- Configuration files
- Documentation

**Write Access:**

- `src/**` - Source code
- `packages/**` - Package code
- `tests/**` - Test files
- `docs/**` - Documentation

**Excluded:**

- `node_modules/**`
- `.git/**`
- `.env` files
- Sensitive credentials

## Integration with SUSHI Platform

SUSHI CLI integrates with the full SUSHI platform:

- 🌮 **BAM** - Bug detection system
- 🍔 **STRIKE** - Mutation testing
- 🥑 **Memory** - Learning from past fixes
- 🍕 **Porffor** - AOT compilation
- 🍣 **Spatial Agents** - Multi-agent coordination

## Examples

### Full Workflow

```bash
# 1. Initialize project
sushi init

# 2. Design architecture
sushi architect "REST API with PostgreSQL" -o docs/architecture.md

# 3. Generate code
sushi coder "Implement user CRUD endpoints" -f src/api/users.js

# 4. Debug issues
sushi debugger "Fix validation errors in user creation"

# 5. Coordinate deployment
sushi pm "Deploy to production with zero downtime"
```

### Multi-Agent Pipeline

```bash
# PM coordinates all agents
sushi pm "Build user profile feature: design, code, test, document"

# Output:
# 1. 🏗️ Architect: Designed feature architecture
# 2. ⚡ Coder: Generated implementation
# 3. 🐛 Debugger: Ran tests and fixed issues
# 4. 📝 Architect: Created documentation
# ✅ Feature complete!
```

## Advanced Usage

### Custom Agent Configuration

Edit `.sushi/config.json`:

```json
{
  "agents": {
    "coder": {
      "enabled": true,
      "model": "claude",
      "temperature": 0.7
    },
    "debugger": {
      "enabled": true,
      "autoFix": true
    }
  }
}
```

### Environment Variables

```bash
export SUSHI_API_KEY=sk-ant-...
export SUSHI_MODE=unlimited
export SUSHI_FALKORDB_HOST=localhost
export SUSHI_FALKORDB_PORT=6380
```

## Troubleshooting

### "Insufficient credits"

```bash
# Option 1: Add API key for unlimited mode
sushi config --api-key sk-ant-...

# Option 2: Check remaining credits
sushi credits
```

### "FalkorDB connection failed"

```bash
# Check FalkorDB is running
lsof -i :6380

# Start FalkorDB (if using Docker)
docker run -p 6380:6379 falkordb/falkordb
```

### "Permission denied"

```bash
# Check file permissions in .sushi/config.json
# Ensure write access is granted for target directories
```

## Comparison with Web Version

| Feature            | CLI                   | Web (sushi.chrry.ai) |
| ------------------ | --------------------- | -------------------- |
| File System Access | ✅ Direct             | ❌ Upload only       |
| Speed              | ✅ Instant            | ⚠️ Network latency   |
| Offline Mode       | ✅ Yes (with API key) | ❌ No                |
| GUI                | ❌ Terminal only      | ✅ Full UI           |
| Collaboration      | ❌ Local only         | ✅ Real-time         |
| Credits            | ✅ 100 free           | ✅ 100 free          |

## Contributing

SUSHI CLI is part of the SUSHI platform:

```bash
git clone https://github.com/chrryAI/sushi.git
cd sushi/cli
npm install
npm link
```

## License

AGPL-3.0 - See [LICENSE](../LICENSE)

## Links

- 🌐 **Web App**: https://sushi.chrry.ai
- 📚 **Documentation**: https://github.com/chrryAI/sushi
- 🐛 **Issues**: https://github.com/chrryAI/sushi/issues
- 💬 **Discord**: https://discord.gg/chrryai

---

**Made with ❤️ by the SUSHI team** 🍣

**Part of the LifeOS ecosystem** - Atlas, Bloom, Peach, Vault, Focus, Sushi
