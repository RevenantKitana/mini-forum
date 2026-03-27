import cron from 'node-cron';
import config from '../config/index.js';
import { ContentGeneratorService } from '../services/ContentGeneratorService.js';

let isRunning = false;

export function startCronScheduler(generator: ContentGeneratorService): cron.ScheduledTask {
  console.log(`⏰ Cron scheduler started: "${config.cron.schedule}"`);

  const task = cron.schedule(config.cron.schedule, async () => {
    if (isRunning) {
      console.log('⏳ Previous cron job still running, skipping...');
      return;
    }

    isRunning = true;
    console.log(`\n🔄 Cron triggered at ${new Date().toISOString()}`);

    try {
      for (let i = 0; i < config.cron.batchSize; i++) {
        const result = await generator.runOnce();
        console.log(
          `   Result: ${result.success ? '✅' : '❌'} ${result.actionType} ` +
          `by user ${result.userId} via ${result.provider} (${result.latencyMs}ms)` +
          (result.error ? ` — ${result.error}` : ''),
        );
      }
    } catch (error: any) {
      console.error(`❌ Cron error: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });

  return task;
}
