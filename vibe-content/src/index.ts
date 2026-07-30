import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { ContentGeneratorService } from './services/ContentGeneratorService.js';
import { StatusService } from './services/StatusService.js';
import { LLMHealthCheckService } from './services/LLMHealthCheckService.js';
import { startCronScheduler, stopCronScheduler } from './scheduler/cronScheduler.js';
import logger from './utils/logger.js';
import { getLLMMetricsSnapshot } from './services/llmMetrics.js';
import { TriggerProgressStore } from './services/TriggerProgressStore.js';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const generator = new ContentGeneratorService();
const startedAt = new Date();
const statusService = new StatusService(generator, startedAt);
const llmHealthCheckService = new LLMHealthCheckService(generator.getLLMManager());
const triggerProgressStore = new TriggerProgressStore();

// Health check — simple check to verify server is running
app.get('/health', async (_req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      uptime: process.uptime(),
    });
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
    const jobId = triggerProgressStore.startJob(actionType);
    triggerProgressStore.updateStep(jobId, 'selecting');

    const connectivity = await generator.getApiExecutor().checkConnectivity();
    if (!connectivity.success) {
      triggerProgressStore.failJob(jobId, connectivity.error ?? 'Invalid forum API URL');
      res.status(502).json({
        accepted: false,
        jobId,
        actionType,
        status: 'failed',
        currentStep: 'selecting',
        error: connectivity.error ?? 'Invalid forum API URL',
        aiStepDescs: triggerProgressStore.getAiStepDescs(),
      });
      return;
    }

    res.status(202).json({
      accepted: true,
      jobId,
      actionType,
      status: 'queued',
      currentStep: 'selecting',
      aiStepDescs: triggerProgressStore.getAiStepDescs(),
    });

    void (async () => {
      try {
        const result = await generator.runOnceForAction(actionType, 'manual', undefined, (step) => {
          triggerProgressStore.updateStep(jobId, step);
        });

        if (result.success) {
          triggerProgressStore.completeJob(jobId, {
            success: result.success,
            postId: result.postId,
            provider: result.provider,
            latencyMs: result.latencyMs,
            preview: result.preview ?? null,
          });
        } else {
          triggerProgressStore.failJob(jobId, result.error ?? 'Action failed');
        }
      } catch (error: any) {
        logger.error(`Trigger progress error (${actionType}/${jobId}): ${error.message}`);
        triggerProgressStore.failJob(jobId, error.message);
      }
    })();
  } catch (error: any) {
    logger.error(`Trigger error (${actionType}): ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function handleTriggerStatus(req: express.Request, res: express.Response) {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const snapshot = triggerProgressStore.getJobSnapshot(jobId);
  if (!snapshot) {
    res.status(404).json({ error: 'job not found' });
    return;
  }

  res.json(snapshot);
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

// LLM Health Check — dedicated endpoint to check availability of all LLM providers
app.get('/llm-health', async (_req, res) => {
  try {
    const result = await llmHealthCheckService.checkAllProviders();
    const statusCode = result.summary.overall === 'healthy' ? 200 : result.summary.overall === 'degraded' ? 206 : 503;
    res.status(statusCode).json(result);
  } catch (error: any) {
    logger.error(`LLM health check endpoint error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check LLM provider health',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// LLM Health Quick Status — minimal endpoint for quick status check
app.get('/llm-health/quick', async (_req, res) => {
  try {
    const result = await llmHealthCheckService.getQuickStatus();
    const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 206 : 503;
    res.status(statusCode).json(result);
  } catch (error: any) {
    logger.error(`LLM health quick check endpoint error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check LLM provider health',
      message: error.message,
    });
  }
});

// LLM Health by Status — grouped providers by their status
app.get('/llm-health/by-status', async (_req, res) => {
  try {
    const result = await llmHealthCheckService.getProvidersByStatus();
    res.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    logger.error(`LLM health by-status endpoint error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check LLM provider health',
      message: error.message,
    });
  }
});

// LLM Provider Health Detail — check specific provider
app.get('/llm-health/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const result = await llmHealthCheckService.getProviderHealth(providerId);
    if (!result) {
      res.status(404).json({
        error: 'Provider not found',
        providerId,
      });
      return;
    }
    const statusCode = result.available ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error: any) {
    logger.error(`LLM health provider detail endpoint error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to check LLM provider health',
      message: error.message,
    });
  }
});

// Specific action triggers (for testing)
app.get('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.post('/trigger/post', (req, res) => handleTriggerAction('post', req, res));
app.get('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.post('/trigger/comment', (req, res) => handleTriggerAction('comment', req, res));
app.get('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));
app.post('/trigger/vote', (req, res) => handleTriggerAction('vote', req, res));
app.get('/trigger/status/:jobId', handleTriggerStatus);
app.post('/trigger/status/:jobId', handleTriggerStatus);

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
  logger.info(`Endpoints: /health, /status, /metrics, /llm-health, /llm-health/quick, /llm-health/by-status, /llm-health/:providerId, /trigger, /trigger/{post,comment,vote}, /trigger/{post,comment,vote}/:label`);

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
