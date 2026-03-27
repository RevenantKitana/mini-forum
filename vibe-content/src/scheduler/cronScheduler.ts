import cron from 'node-cron';
import config from '../config/index.js';
import { ContentGeneratorService } from '../services/ContentGeneratorService.js';
import logger from '../utils/logger.js';

let isRunning = false;

export function startCronScheduler(generator: ContentGeneratorService): cron.ScheduledTask {
  logger.info(`Cron scheduler started: "${config.cron.schedule}"`);

  const task = cron.schedule(config.cron.schedule, async () => {
    if (isRunning) {
      logger.warn('Previous cron job still running, skipping...');
      return;
    }

    isRunning = true;
    logger.info(`Cron triggered at ${new Date().toISOString()}`);

    try {
      for (let i = 0; i < config.cron.batchSize; i++) {
        const result = await generator.runOnce();
        logger.info(
          `Cron result: ${result.success ? 'success' : 'failed'} ${result.actionType} ` +
          `by user ${result.userId} via ${result.provider} (${result.latencyMs}ms)` +
          (result.error ? ` — ${result.error}` : ''),
        );
      }
    } catch (error: any) {
      logger.error(`Cron error: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });

  return task;
}
