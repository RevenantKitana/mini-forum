# syntax=docker/dockerfile:1

# ─── Stage 1: Production deps (native compilation here only) ─────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++ openssl openssl-dev

WORKDIR /app

COPY package.json package-lock.json ./

# BuildKit cache mount: reuses ~/.npm across rebuilds → much faster
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# ─── Stage 2: TypeScript compiler ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./

# --ignore-scripts: skip bcrypt native build — only types needed for tsc
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

# Overlay generated Prisma types so tsc has correct types
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY src ./src
COPY prisma ./prisma
RUN npm run build

# ─── Stage 3: Production runtime (no build tools at all) ─────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies
RUN apk add --no-cache \
    libssl3 \
    openssl \
    su-exec \
    tini

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy pre-built prod node_modules (bcrypt native binary + Prisma client included)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled JS output
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (needed for migrations/introspection)
COPY prisma ./prisma

# Copy .env.example as template (actual .env should be provided at runtime)
COPY .env.example ./

# Create logs directory for winston
RUN mkdir -p logs && \
    chown -R nodejs:nodejs /app

# Use non-root user
USER nodejs

# Docker health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode);})"

# Use tini as init process for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the app
CMD ["node", "dist/src/index.js"]

# Docker labels
LABEL maintainer="Mini Forum Team"
LABEL description="Vibe Content Generation Service - Production"
LABEL version="1.0.0"
