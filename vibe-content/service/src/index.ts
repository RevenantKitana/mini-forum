import express from 'express';
import config from './config/index.js';
import { ContentGeneratorService } from './services/ContentGeneratorService.js';
import { startCronScheduler } from './scheduler/cronScheduler.js';
import { ActionResult } from './types/index.js';

const app = express();
app.use(express.json());

const generator = new ContentGeneratorService();

// Stats tracking
const stats = {
  startedAt: new Date(),
  totalActions: 0,
  successCount: 0,
  failedCount: 0,
  lastResult: null as ActionResult | null,
};

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Status endpoint
app.get('/status', (_req, res) => {
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);

  res.json({
    status: 'ok',
    uptime: `${hours}h ${minutes}m`,
    env: config.nodeEnv,
    forumApi: config.forumApiUrl,
    cronSchedule: config.cron.schedule,
    stats: {
      totalActions: stats.totalActions,
      successCount: stats.successCount,
      failedCount: stats.failedCount,
      successRate: stats.totalActions > 0
        ? `${Math.round((stats.successCount / stats.totalActions) * 100)}%`
        : 'N/A',
    },
    lastAction: stats.lastResult
      ? {
          type: stats.lastResult.actionType,
          userId: stats.lastResult.userId,
          provider: stats.lastResult.provider,
          success: stats.lastResult.success,
          latencyMs: stats.lastResult.latencyMs,
          error: stats.lastResult.error,
        }
      : null,
  });
});

// Manual trigger
app.post('/trigger', async (_req, res) => {
  console.log('\n🔫 Manual trigger received');
  try {
    const result = await generator.runOnce();
    stats.totalActions++;
    if (result.success) stats.successCount++;
    else stats.failedCount++;
    stats.lastResult = result;

    res.json({ result });
  } catch (error: any) {
    stats.totalActions++;
    stats.failedCount++;
    res.status(500).json({ error: error.message });
  }
});

// Start server + cron
app.listen(config.port, () => {
  console.log(`🚀 Vibe Content Service started on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Forum API: ${config.forumApiUrl}/v1`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Status: http://localhost:${config.port}/status`);
  console.log(`   Trigger: POST http://localhost:${config.port}/trigger`);

  // Start cron scheduler
  const cronTask = startCronScheduler(generator);

  // Track cron results in stats
  const originalRunOnce = generator.runOnce.bind(generator);
  // Stats are already tracked in /trigger and cron logs to console
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await generator.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down...');
  await generator.disconnect();
  process.exit(0);
});
