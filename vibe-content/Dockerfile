# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client before TypeScript compilation
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy generated Prisma client from builder (after npm ci to prevent overwrite)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy prompts into dist folder (required at runtime by PromptBuilderService)
COPY prompts ./dist/prompts

# Copy prisma schema (for reference and potential migrations)
COPY prisma ./prisma

# Copy and configure entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Create logs directory and give nodejs user ownership of all app files
RUN mkdir -p dist/logs && chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly, passing them through entrypoint
ENTRYPOINT ["dumb-init", "--", "/app/docker-entrypoint.sh"]

# Start application
CMD ["node", "dist/src/index.js"]
