import express from 'express';
import config from './config/index.js';
import { ContentGeneratorService } from './services/ContentGeneratorService.js';
import { StatusService } from './services/StatusService.js';
import { startCronScheduler, stopCronScheduler } from './scheduler/cronScheduler.js';
import logger from './utils/logger.js';
import { getLLMMetricsSnapshot } from './services/llmMetrics.js';

const app = express();
app.use(express.json());

const generator = new ContentGeneratorService();
const startedAt = new Date();
const statusService = new StatusService(generator, startedAt);

// Health check — includes per-provider circuit breaker + availability details
app.get('/health', async (_req, res) => {
  try {
    const providerStatus = await generator.getProviderHealthDetails();
    const allHealthy = providerStatus.every((p) => p.circuitState === 'CLOSED');
    res.status(allHealthy ? 200 : 207).json({
      status: allHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      providers: providerStatus,
    });
  } catch (err: any) {
    res.status(503).json({ status: 'error', uptime: process.uptime(), error: err.message });
  }
});

// Enhanced status endpoint (Phase 4.3)
app.get('/status', async (_req, res) => {
  try {
    res.json(await statusService.getStatusPayload());
  } catch (error: any) {
    logger.error(`Status endpoint error: ${error.message}`);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Manual trigger — supports both GET (browser) and POST
async function handleTrigger(_req: express.Request, res: express.Response) {
  logger.info('Manual trigger received');
  try {
    const result = await generator.runOnce('manual');

    res.json({ result });
  } catch (error: any) {
    logger.error(`Trigger error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function handleTriggerAction(actionType: 'post' | 'comment' | 'vote', _req: express.Request, res: express.Response) {
  logger.info(`Manual trigger received for action: ${actionType}`);
  try {
    const result = await generator.runOnceForAction(actionType, 'manual');

    res.json({ result });
  } catch (error: any) {
    logger.error(`Trigger error (${actionType}): ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function handleTriggerActionByLabel(
  actionType: 'post' | 'comment' | 'vote',
  req: express.Request,
  res: express.Response,
) {
  const label = Number(req.params.label);
  if (!Number.isInteger(label)) {
    res.status(400).json({ error: 'label must be an integer (1-10)' });
    return;
  }

  const providerId = generator.getProviderIdByLabel(label);
  if (!providerId) {
    res.status(400).json({ error: `invalid label ${label}. supported: 1-10` });
    return;
  }

  logger.info(`Manual trigger received for action: ${actionType}, label: ${label}, provider: ${providerId}`);
  try {
    const result = await generator.runOnceForAction(actionType, 'manual', providerId);
    res.json({ label, providerId, result });
  } catch (error: any) {
    logger.error(`Trigger error (${actionType}/${label}): ${error.message}`);
    res.status(500).json({ error: error.message, label, providerId });
  }
}

app.get('/trigger', handleTrigger);
app.post('/trigger', handleTrigger);

// LLM metrics
app.get('/metrics', (_req, res) => {
  res.json(getLLMMetricsSnapshot());
});

// Specific action triggers (for testing)
app.get('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.post('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.get('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.post('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.get('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));
app.post('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));

// Model-label verification endpoints
app.get('/trigger/post/:label', (req, res) => handleTriggerActionByLabel('post', req, res));
app.post('/trigger/post/:label', (req, res) => handleTriggerActionByLabel('post', req, res));
app.get('/trigger/comment/:label', (req, res) => handleTriggerActionByLabel('comment', req, res));
app.post('/trigger/comment/:label', (req, res) => handleTriggerActionByLabel('comment', req, res));
app.get('/trigger/vote/:label', (req, res) => handleTriggerActionByLabel('vote', req, res));
app.post('/trigger/vote/:label', (req, res) => handleTriggerActionByLabel('vote', req, res));

// Start server + cron
const server = app.listen(config.port, () => {
  logger.info(`Vibe Content Service started on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Forum API: ${config.forumApiUrl}/v1`);
  logger.info(`Endpoints: /health, /status, /trigger, /trigger/{post,comment,vote}, /trigger/{post,comment,vote}/:label`);

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
    await stopCronScheduler();
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
