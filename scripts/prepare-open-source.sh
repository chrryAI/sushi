#!/bin/bash

# Vex - Prepare for Open Source
# Creates all necessary documentation and example files

set -e

echo "📦 Vex - Preparing for Open Source"
echo "=================================================="
echo ""

# Create .env.example files for each app/package
echo "1️⃣  Creating .env.example files..."

# apps/api
cat > apps/api/.env.example << 'EOF'
# Database
DB_URL=postgresql://user:password@localhost:5432/chrry

# NextAuth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:5173

# AI Provider Keys (Get from respective providers)
CHATGPT_API_KEY=sk-your-openai-key-here
CLAUDE_API_KEY=sk-ant-your-anthropic-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here
GEMINI_API_KEY=your-google-ai-key-here
PERPLEXITY_API_KEY=your-perplexity-key-here

# Replicate (for image generation)
REPLICATE_API_KEY=your-replicate-key-here

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key

# UploadThing (optional, for file uploads)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Sentry (optional, for error tracking)
SENTRY_DSN=your-sentry-dsn

# Development
NODE_ENV=development
VITE_TESTING_ENV=development
EOF

# apps/web
cat > apps/web/.env.example << 'EOF'
# Database
DB_URL=postgresql://user:password@localhost:5432/chrry

# NextAuth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3001

# AI Provider Keys
CHATGPT_API_KEY=sk-your-openai-key-here
CLAUDE_API_KEY=sk-ant-your-anthropic-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here
GEMINI_API_KEY=your-google-ai-key-here

# Development
NODE_ENV=development
EOF

# apps/ws
cat > apps/ws/.env.example << 'EOF'
# Database
DB_URL=postgresql://user:password@localhost:5432/chrry

# WebSocket
WS_PORT=8080

# Development
NODE_ENV=development
EOF

# packages/db
cat > packages/db/.env.example << 'EOF'
# Database
DB_URL=postgresql://user:password@localhost:5432/chrry
EOF

echo "✅ Created .env.example files"
echo ""

# Create SECURITY.md
echo "2️⃣  Creating SECURITY.md..."
cat > SECURITY.md << 'EOF'
# Security Policy

## Reporting a Vulnerability

We take the security of Vex seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Email**: security@chrry.ai

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

We'll respond within 48 hours and work with you to address the issue.

## Security Best Practices

### Environment Variables

**Never commit sensitive data!**

- All `.env` files are gitignored
- Use `.env.example` as a template
- Keep your API keys and secrets in `.env.local`
- Rotate keys if accidentally exposed

### API Keys

When using Vex:
- Use your own API keys for AI providers
- Custom models: Encrypt sensitive data at rest
- Enable rate limiting in production
- Monitor API usage regularly

### Database

- Use strong passwords
- Enable SSL/TLS for connections
- Regularly backup your data
- Restrict database access by IP

### Production Deployment

- Set `NODE_ENV=production`
- Enable CORS restrictions
- Use HTTPS only
- Set up proper authentication
- Enable security headers
- Rate limit API endpoints

## Known Security Considerations

### AI Model Integration

- User-provided API keys are stored encrypted
- Custom model URLs are validated
- Rate limiting prevents abuse
- Audit logs track usage

### Data Privacy

- Users control their data
- Incognito mode available
- Memory extraction can be disabled
- GDPR compliant data deletion

## Updates

Check the [changelog](CHANGELOG.md) for security-related updates.
EOF

echo "✅ Created SECURITY.md"
echo ""

# Create CONTRIBUTING.md
echo "3️⃣  Creating CONTRIBUTING.md..."
cat > CONTRIBUTING.md << 'EOF'
# Contributing to Vex

Thank you for considering contributing to Vex! 🎉

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL 14+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chrryai/vex.git
   cd vex
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example files
   cp apps/api/.env.example apps/api/.env
   cp packages/db/.env.example packages/db/.env

   # Edit .env files with your credentials
   ```

4. **Set up database**
   ```bash
   # Run migrations
   pnpm run migrate

   # Optional: seed with example data
   pnpm run seed
   ```

5. **Start development**
   ```bash
   # Start all services
   pnpm run dev

   # Or start specific apps
   pnpm run dev --filter=api
   ```

## Project Structure

```
vex/
├── apps/
│   ├── api/    # Main web application
│   ├── web/              # Alternative frontend
│   ├── ws/               # WebSocket server
│   ├── extension/        # Browser extension
│   └── native/           # React Native app
├── packages/
│   ├── ui/               # Shared UI components (@chrryai/donut)
│   ├── pepper/           # Universal router (@chrryai/pepper)
│   ├── waffles/          # Testing utilities (@chrryai/waffles)
│   └── db/               # Database layer (@repo/db)
└── scripts/              # Build and utility scripts
```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

3. **Test your changes**
   ```bash
   # Run linters
   pnpm run lint

   # Run type checks
   pnpm run check-types

   # Run tests
   pnpm run test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (run `pnpm format`)
- **Linting**: ESLint (run `pnpm lint`)
- **Components**: Functional components with hooks

## Testing

- **Unit tests**: Write tests for utilities and functions
- **Integration tests**: Test API endpoints
- **E2E tests**: Use Playwright for critical flows

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Adding New AI Providers

To add support for a new AI provider:

1. Update `lib/getModelProvider.ts` with new provider
2. Add provider configuration to agent schema
3. Update UI to support new provider
4. Add example .env variables
5. Update documentation

## Security

- Never commit sensitive data
- Use environment variables for secrets
- Follow security best practices (see SECURITY.md)
- Report vulnerabilities responsibly

## Questions?

- **Email**: iliyan@chrry.ai
- **Issues**: [GitHub Issues](https://github.com/chrryai/vex/issues)

Thank you for contributing! 🚀
EOF

echo "✅ Created CONTRIBUTING.md"
echo ""

# Update README with setup instructions
echo "4️⃣  Checking README.md..."
if [[ -f README.md ]]; then
    echo "ℹ️  README.md exists - please review and update with:"
    echo "   - Setup instructions"
    echo "   - Environment variables"
    echo "   - Architecture overview"
    echo "   - Link to CONTRIBUTING.md"
else
    echo "⚠️  README.md not found - creating basic template..."
    cat > README.md << 'EOF'
# Vex

> A self-sustaining AI platform powered by user-provided models

## Features

- 🤖 Multi-model AI support (ChatGPT, Claude, DeepSeek, Gemini, and custom models)
- 🔌 OpenAI-compatible custom model integration
- 💾 Smart memory and context management
- 🎨 Cross-platform UI (Web, Extension, Native)
- 🔒 User-controlled API keys and data
- 📱 Real-time collaboration
- 🌍 Multi-language support

## Quick Start

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions.

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env

# Start development
pnpm run dev
```

## Architecture

Vex is a monorepo built with:

- **Frontend**: Next.js, React 19
- **Backend**: Next.js API routes, WebSocket server
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Multi-provider support with custom model integration
- **Packages**: Shared UI, routing, and testing utilities

## Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [API Documentation](docs/API.md)

## License

AGPL-3.0 - See [LICENSE](LICENSE)

## Support

- Discord: https://discord.gg/chrry
- Email: support@chrry.ai
- Issues: https://github.com/chrryai/vex/issues
EOF
fi

echo ""
echo "=================================================="
echo "✅ Preparation complete!"
echo ""
echo "Files created:"
echo "  - .env.example files in all apps/packages"
echo "  - SECURITY.md"
echo "  - CONTRIBUTING.md"
echo "  - README.md (if missing)"
echo ""
echo "Next steps:"
echo "1. Review and customize generated files"
echo "2. Run: chmod +x scripts/*.sh"
echo "3. Run: ./scripts/check-sensitive-data.sh"
echo "4. Commit and push to chrryai/vex"
echo ""
