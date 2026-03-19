# syntax=docker/dockerfile:1

# ─── Stage 1: Production deps (native compilation here only) ─────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
# BuildKit cache mount: reuses ~/.npm across rebuilds → much faster
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# Generate Prisma client into prod node_modules
COPY prisma ./prisma
RUN npx prisma generate

# ─── Stage 2: TypeScript compiler ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: skip bcrypt native build — only types needed for tsc
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --no-audit --no-fund

# Overlay generated Prisma types so tsc has correct types
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 3: Production runtime (no build tools at all) ─────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy pre-built prod node_modules (bcrypt native binary + Prisma client included)
COPY --from=deps /app/node_modules ./node_modules
# Copy compiled JS output
COPY --from=builder /app/dist ./dist
# prisma CLI is a devDep — copy binary so `migrate deploy` works at startup
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

COPY package.json ./
COPY prisma ./prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
