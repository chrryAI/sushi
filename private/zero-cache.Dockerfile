FROM node:20-slim

WORKDIR /app

# Copy jules package manifest and install deps
COPY packages/jules/package.json ./
RUN npm install

# Copy jules source (schema, generated types, permissions)
COPY packages/jules/src ./src

ENV ZERO_UPSTREAM_DB=postgres://vex:vex_local_dev@postgres:5432/vex
ENV ZERO_CVR_DB=postgres://vex:vex_local_dev@postgres:5432/vex
ENV ZERO_CHANGE_DB=postgres://vex:vex_local_dev@postgres:5432/vex
ENV ZERO_REPLICA_FILE=/data/zero.db
ENV ZERO_SCHEMA_PATH=./src/schema.ts
ENV NODE_ENV=development

EXPOSE 4848

CMD ["npx", "zero-cache-dev"]
