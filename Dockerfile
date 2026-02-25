# =============================================================================
# Multi-stage Dockerfile for Language Challenger
# =============================================================================
# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @language-challenger/shared...

# Copy shared source and build
COPY packages/shared/src ./packages/shared/src
RUN pnpm --filter @language-challenger/shared build

# =============================================================================
# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @language-challenger/server...

# Copy shared build from previous stage
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/src ./packages/shared/src
COPY --from=shared-builder /app/packages/shared/tsconfig.json ./packages/shared/tsconfig.json

# Copy server source (we'll use tsx to run TypeScript directly)
COPY server ./server

# =============================================================================
# Stage 3: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY client/package.json ./client/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @language-challenger/client...

# Copy shared source (used for types)
COPY --from=shared-builder /app/packages/shared/src ./packages/shared/src
COPY --from=shared-builder /app/packages/shared/tsconfig.json ./packages/shared/tsconfig.json

# Copy client source and build
COPY client ./client

# Build for production (skip type checking to speed up build)
ENV VITE_API_URL=/api
RUN pnpm --filter @language-challenger/client exec vite build

# =============================================================================
# Stage 4: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/

# Install production dependencies only (tsx is now in dependencies)
RUN pnpm install --frozen-lockfile --prod --filter @language-challenger/server...

# Copy shared source  
COPY --from=shared-builder /app/packages/shared/src ./packages/shared/src
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=shared-builder /app/packages/shared/tsconfig.json ./packages/shared/tsconfig.json

# Copy server source (using tsx to run TypeScript directly)
COPY --from=server-builder /app/server/src ./server/src
COPY --from=server-builder /app/server/drizzle ./server/drizzle
COPY --from=server-builder /app/server/drizzle.config.ts ./server/
COPY --from=server-builder /app/server/tsconfig.json ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/database.sqlite
ENV CLIENT_DIST_PATH=/app/client/dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (using tsx binary to run TypeScript)
ENTRYPOINT ["dumb-init", "--"]
CMD ["server/node_modules/.bin/tsx", "server/src/index.ts"]
