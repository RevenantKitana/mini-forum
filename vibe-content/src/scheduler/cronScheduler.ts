import cron from 'node-cron';
import config from '../config/index.js';
import { ContentGeneratorService } from '../services/ContentGeneratorService.js';
import { DistributedLock, LOCK_KEYS } from '../utils/distributedLock.js';
import logger from '../utils/logger.js';

// In-process guard prevents double-fire on the same instance
let isRunning = false;

// Shared lock instance reuses the same DB connection / session for the
// lifetime of the process so pg_advisory_unlock works on the same session.
let sharedLock: DistributedLock | null = null;

export function startCronScheduler(
  generator: ContentGeneratorService,
  lockOverride?: DistributedLock,
): cron.ScheduledTask {
  logger.info(`Cron scheduler started: "${config.cron.schedule}"`);

  sharedLock = lockOverride ?? new DistributedLock();

  const task = cron.schedule(config.cron.schedule, async () => {
    // 1. In-process check (fast path — same instance)
    if (isRunning) {
      logger.warn('[cron] Previous job still running on this instance, skipping...');
      return;
    }

    // 2. Distributed check — try to acquire Postgres advisory lock
    const lockKey = LOCK_KEYS.CRON_SCHEDULER;
    const acquired = await sharedLock!.tryAcquire(lockKey);
    if (!acquired) {
      logger.warn('[cron] Another instance is running the cron job, skipping...');
      return;
    }

    isRunning = true;
    logger.info(`[cron] Triggered at ${new Date().toISOString()}`);

    try {
      for (let i = 0; i < config.cron.batchSize; i++) {
        const result = await generator.runOnce('cron');
        logger.info(
          `[cron] result: ${result.success ? 'success' : 'failed'} ${result.actionType} ` +
          `by user ${result.userId} via ${result.provider} (${result.latencyMs}ms)` +
          (result.error ? ` — ${result.error}` : ''),
        );
      }
    } catch (error: any) {
      logger.error(`[cron] Error: ${error.message}`);
    } finally {
      isRunning = false;
      await sharedLock!.release(lockKey);
    }
  });

  return task;
}

export async function stopCronScheduler(): Promise<void> {
  if (sharedLock) {
    await sharedLock.disconnect();
    sharedLock = null;
  }
}
