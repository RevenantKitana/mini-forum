import winston from 'winston';
import config from '../config/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOG_DIR = config.logDir || path.resolve(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const actionFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'vibe-content' },
  transports: [
    // Console transport (colored, readable)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.colorize(),
        actionFormat,
      ),
    }),
    // All logs file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'vibe-content.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // Error-only file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'vibe-content-error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});

// Structured action log helper
export function logAction(data: {
  actionId?: string;
  userId?: number;
  actionType?: string;
  stage: string;
  status: 'success' | 'failed' | 'skipped' | 'info';
  provider?: string;
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}) {
  const level = data.status === 'failed' ? 'error' : data.status === 'skipped' ? 'warn' : 'info';
  logger.log(level, `[${data.stage}] ${data.status}`, {
    action_id: data.actionId,
    user_id: data.userId,
    action_type: data.actionType,
    stage: data.stage,
    status: data.status,
    provider: data.provider,
    latency_ms: data.latencyMs,
    error_reason: data.error,
    ...data.details,
  });
}

export default logger;
