FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libc6-dev \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install pnpm and vite-plus
RUN npm install -g pnpm@9.15.0 vite-plus@0.1.14 --ignore-scripts --force

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/agent/package.json apps/agent/
COPY apps/api/package.json apps/api/
COPY apps/bridge/package.json apps/bridge/
COPY apps/desktop/package.json apps/desktop/
COPY apps/extension/package.json apps/extension/
COPY apps/chrry/package.json apps/chrry/
COPY apps/mobile/package.json apps/mobile/
COPY packages/calendar/package.json packages/calendar/
COPY packages/vault/package.json packages/vault/
COPY packages/focus/package.json packages/focus/
COPY packages/pepper/package.json packages/pepper/
COPY packages/shared/package.json packages/shared/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/donut/package.json packages/donut/
COPY packages/waffles/package.json packages/waffles/
COPY infra/malwareScanner/package.json malwareScanner/

# Install ALL dependencies (including devDependencies needed for build)
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

# Build the source code
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    libc6-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install pnpm and vite-plus
RUN npm install -g pnpm@9.15.0 vite-plus@0.1.14 --ignore-scripts --force

# Fix: vite-plus requires esbuild globally in Docker
RUN npm install -g esbuild@0.27.4

# Copy everything from deps stage (package.json files and node_modules)
COPY --from=deps /app ./

# Copy source code
COPY . .

# Build the Vite application
ENV NODE_OPTIONS='--max-old-space-size=8192'
ENV VITE_NODE_ENV=production
RUN vp run build --filter flash

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install wget for healthcheck (as root)
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs viteuser

# Install pnpm and vite-plus
RUN npm install -g pnpm@9.15.0 vite-plus@0.1.14 --ignore-scripts --force

# Fix: ensure esbuild is available for production builds
RUN npm install -g esbuild@0.27.4

# Copy package files
COPY --chown=viteuser:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=viteuser:nodejs apps/agent/package.json apps/agent/
COPY --chown=viteuser:nodejs apps/api/package.json apps/api/
COPY --chown=viteuser:nodejs apps/bridge/package.json apps/bridge/
COPY --chown=viteuser:nodejs apps/desktop/package.json apps/desktop/
COPY --chown=viteuser:nodejs apps/extension/package.json apps/extension/
COPY --chown=viteuser:nodejs apps/chrry/package.json apps/chrry/
COPY --chown=viteuser:nodejs apps/mobile/package.json apps/mobile/
COPY --chown=viteuser:nodejs packages/calendar/package.json packages/calendar/
COPY --chown=viteuser:nodejs packages/vault/package.json packages/vault/
COPY --chown=viteuser:nodejs packages/focus/package.json packages/focus/
COPY --chown=viteuser:nodejs packages/pepper/package.json packages/pepper/
COPY --chown=viteuser:nodejs packages/shared/package.json packages/shared/
COPY --chown=viteuser:nodejs packages/typescript-config/package.json packages/typescript-config/
COPY --chown=viteuser:nodejs packages/donut/package.json packages/donut/
COPY --chown=viteuser:nodejs packages/waffles/package.json packages/waffles/
COPY --chown=viteuser:nodejs infra/malwareScanner/package.json malwareScanner/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --chown=viteuser:nodejs --from=builder /app/apps/chrry/dist ./apps/chrry/dist
COPY --chown=viteuser:nodejs --from=builder /app/apps/chrry/server.js ./apps/chrry/
COPY --chown=viteuser:nodejs --from=builder /app/apps/chrry/public ./apps/chrry/public
COPY --chown=viteuser:nodejs --from=builder /app/apps/chrry/index.html ./apps/chrry/
COPY --chown=viteuser:nodejs --from=builder /app/apps/chrry/content ./apps/chrry/content

# Copy workspace packages
COPY --chown=viteuser:nodejs --from=builder /app/packages ./packages

# Switch to non-root user
USER viteuser

EXPOSE 5173

ENV PORT=5173
ENV HOST="0.0.0.0"

WORKDIR /app/apps/chrry

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

CMD ["node", "server.js"]