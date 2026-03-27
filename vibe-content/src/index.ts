import express from 'express';
import config from './config/index.js';
import { ContentGeneratorService } from './services/ContentGeneratorService.js';
import { startCronScheduler } from './scheduler/cronScheduler.js';
import { ActionResult } from './types/index.js';
import logger from './utils/logger.js';

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

// Enhanced status endpoint (Phase 4.3)
app.get('/status', (_req, res) => {
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);

  const rateLimiterStats = generator.getRateLimiterStats();
  const retryQueueStats = generator.getRetryQueueStats();

  res.json({
    status: 'ok',
    uptime: `${hours}h ${minutes}m`,
    startedAt: stats.startedAt.toISOString(),
    env: config.nodeEnv,
    forumApi: config.forumApiUrl,
    cronSchedule: config.cron.schedule,
    providers: generator.getLLMProviders(),
    todayStats: {
      totalActions: stats.totalActions,
      successCount: stats.successCount,
      failedCount: stats.failedCount,
      successRate: stats.totalActions > 0
        ? `${Math.round((stats.successCount / stats.totalActions) * 100)}%`
        : 'N/A',
    },
    todayActions: rateLimiterStats,
    queue: retryQueueStats,
    lastAction: stats.lastResult
      ? {
          type: stats.lastResult.actionType,
          userId: stats.lastResult.userId,
          provider: stats.lastResult.provider,
          success: stats.lastResult.success,
          latencyMs: stats.lastResult.latencyMs,
          at: new Date().toISOString(),
          error: stats.lastResult.error,
        }
      : null,
  });
});

// Manual trigger — supports both GET (browser) and POST
async function handleTrigger(_req: express.Request, res: express.Response) {
  logger.info('Manual trigger received');
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
    logger.error(`Trigger error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function handleTriggerAction(actionType: 'post' | 'comment' | 'vote', _req: express.Request, res: express.Response) {
  logger.info(`Manual trigger received for action: ${actionType}`);
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
    logger.error(`Trigger error (${actionType}): ${error.message}`);
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
const server = app.listen(config.port, () => {
  logger.info(`Vibe Content Service started on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Forum API: ${config.forumApiUrl}/v1`);
  logger.info(`Endpoints: /health, /status, /trigger, /trigger/{post,comment,vote}`);

  // Start cron scheduler
  startCronScheduler(generator);
});

// Phase 4.4: Enhanced graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Give in-flight actions time to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Disconnect services
  try {
    await generator.disconnect();
    logger.info('All services disconnected');
  } catch (err: any) {
    logger.error(`Error during shutdown: ${err.message}`);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Phase 4.4: Global error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  // Give logger time to flush, then exit (PM2 will restart)
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', { error: reason?.message || String(reason) });
});
