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

  const rateLimiterStats = generator.getRateLimiterStats();

  res.json({
    status: 'ok',
    uptime: `${hours}h ${minutes}m`,
    env: config.nodeEnv,
    forumApi: config.forumApiUrl,
    cronSchedule: config.cron.schedule,
    providers: generator.getLLMProviders(),
    stats: {
      totalActions: stats.totalActions,
      successCount: stats.successCount,
      failedCount: stats.failedCount,
      successRate: stats.totalActions > 0
        ? `${Math.round((stats.successCount / stats.totalActions) * 100)}%`
        : 'N/A',
    },
    todayActions: rateLimiterStats,
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

// Manual trigger — supports both GET (browser) and POST
async function handleTrigger(_req: express.Request, res: express.Response) {
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
}

async function handleTriggerAction(actionType: 'post' | 'comment' | 'vote', _req: express.Request, res: express.Response) {
  console.log(`\n🔫 Manual trigger received for specific action: ${actionType}`);
  try {
    const result = await generator.runOnceForAction(actionType);
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
}

app.get('/trigger', handleTrigger);
app.post('/trigger', handleTrigger);

// Specific action triggers (for testing)
app.get('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.post('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.get('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.post('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.get('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));
app.post('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));

// Start server + cron
app.listen(config.port, () => {
  console.log(`🚀 Vibe Content Service started on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Forum API: ${config.forumApiUrl}/v1`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   Status: http://localhost:${config.port}/status`);
  console.log(`   Random trigger: POST http://localhost:${config.port}/trigger`);
  console.log(`   Post only: POST http://localhost:${config.port}/trigger/post`);
  console.log(`   Comment only: POST http://localhost:${config.port}/trigger/comment`);
  console.log(`   Vote only: POST http://localhost:${config.port}/trigger/vote`);

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
