import { createRequire } from 'module';
import logger from './logger.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

/**
 * Postgres session-level advisory lock for distributed cron coordination.
 * Uses pg_try_advisory_lock(key) which is non-blocking and session-scoped.
 * The lock releases automatically when the DB connection closes, giving
 * an extra failsafe if the process crashes before explicit unlock.
 */

// Unique integer keys for each lock use-case (arbitrary but fixed)
export const LOCK_KEYS = {
  CRON_SCHEDULER: 420_690_001,
} as const;

export class DistributedLock {
  private prisma: any;
  private ownedLock: boolean = false;

  constructor(prismaInstance?: any) {
    this.prisma = prismaInstance ?? new PrismaClient();
  }

  /**
   * Try to acquire advisory lock. Returns true if acquired, false if already held.
   */
  async tryAcquire(lockKey: number): Promise<boolean> {
    try {
      // Uses integer (not bigint) two-param version for broader compatibility
      const hi = Math.trunc(lockKey / 65536);
      const lo = lockKey % 65536;
      const result = await this.prisma.$queryRaw`
        SELECT pg_try_advisory_lock(${hi}::int4, ${lo}::int4) AS acquired
      `;
      const acquired = result[0]?.acquired === true;
      if (acquired) {
        this.ownedLock = true;
        logger.debug(`[distributed_lock] Lock ${lockKey} acquired`);
      } else {
        logger.debug(`[distributed_lock] Lock ${lockKey} already held by another instance`);
      }
      return acquired;
    } catch (error: any) {
      logger.warn(`[distributed_lock] tryAcquire(${lockKey}) failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Release the advisory lock.  Must be called from the same session that acquired it.
   */
  async release(lockKey: number): Promise<void> {
    if (!this.ownedLock) return;
    try {
      const hi = Math.trunc(lockKey / 65536);
      const lo = lockKey % 65536;
      await this.prisma.$queryRaw`
        SELECT pg_advisory_unlock(${hi}::int4, ${lo}::int4)
      `;
      this.ownedLock = false;
      logger.debug(`[distributed_lock] Lock ${lockKey} released`);
    } catch (error: any) {
      logger.warn(`[distributed_lock] release(${lockKey}) failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
