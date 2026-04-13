# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Verified and consolidated security patches:
  - CORS Origin Reflection Prevention (`apps/api/hono/middleware/cors.ts`)
  - SSRF Protection (`apps/api/utils/ssrf.ts`)
  - MinIO Upload Type Validation (`apps/api/lib/minio.ts`)
  - Auth Rate Limiting (`apps/api/lib/rateLimiting.ts`)
  - WebSocket JWT Fallback Logic (`apps/api/lib/websocket.ts`)
- Added comprehensive test coverage for `checkRateLimit` and `checkGenerationRateLimit` in `apps/api/test/lib_rate_limiting.test.ts` (Coverage increased from 27% to 75%).
