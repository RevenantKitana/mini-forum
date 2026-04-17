import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const SLOW_QUERY_THRESHOLD_MS = 500;

// PrismaClient singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

  // Slow query detection
  (client as any).$on('query', (e: { query: string; duration: number; params?: string }) => {
    if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
      logger.slowQuery(e.query, e.duration, { params: e.params });
    }
  });

  (client as any).$on('error', (e: { message: string; target: string }) => {
    logger.error('Prisma error', { message: e.message, target: e.target });
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;







