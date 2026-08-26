import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env từ service root, fallback sang backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../../backend/.env') });
}

// Validate required environment variables at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'FORUM_API_URL',
  'BOT_PASSWORD',
  'GEMINI_API_KEY',
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('   Copy vibe-content/.env.example to vibe-content/.env and fill in the values.');
  process.exit(1);
}

// Parse CORS allowed origins and IPs from environment
const getCorsOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS || '';
  if (envOrigins.trim()) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  // Default fallback
  return process.env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
    : ['https://k.mio.io.vn'];
};

const getCorsIps = () => {
  const envIps = process.env.CORS_IPS || '';
  if (envIps.trim()) {
    return envIps.split(',').map(ip => ip.trim());
  }
  return [];
};

// CORS origin callback - supports both domain and IP-based whitelisting
const createCorsOriginCallback = () => {
  const allowedOrigins = getCorsOrigins();
  const allowedIps = getCorsIps();

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check domain-based origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check IP-based access (from Origin header)
    if (allowedIps.length > 0) {
      try {
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;
        if (allowedIps.includes(hostname)) {
          return callback(null, true);
        }
      } catch {
        // Invalid URL, continue to rejection
      }
    }

    callback(new Error('CORS not allowed'));
  };
};

// Middleware to check client IP for CORS - must be placed BEFORE cors middleware
export const createIpBasedCorsMiddleware = () => {
  const allowedIps = getCorsIps();
  
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (allowedIps.length === 0) {
      return next();
    }

    // Get client IP from various sources (proxy chains, direct connection)
    const clientIp = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '';

    // Also check if origin header contains an allowed IP
    const origin = req.headers.origin as string;
    const originHasAllowedIp = origin && allowedIps.some(ip => origin.includes(ip));

    if (allowedIps.includes(clientIp) || originHasAllowedIp) {
      return next();
    }

    // Log IP check failure for debugging
    logger.warn(`CORS IP check failed - Client IP: ${clientIp}, Origin: ${origin}, Allowed IPs: ${allowedIps.join(', ')}`);
    
    // Don't block - let the cors middleware handle it
    next();
  };
};

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '',
  forumApiUrl: process.env.FORUM_API_URL || 'http://localhost:5000/api/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  cors: {
    origin: createCorsOriginCallback(),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '*/30 * * * *',
    batchSize: parseInt(process.env.BATCH_SIZE || '1', 10),
  },
  limits: {
    maxPostsPerUserDay: parseInt(process.env.MAX_POSTS_PER_USER_DAY || '3', 10),
    maxCommentsPerUserDay: parseInt(process.env.MAX_COMMENTS_PER_USER_DAY || '6', 10),
    maxVotesPerUserDay: parseInt(process.env.MAX_VOTES_PER_USER_DAY || '15', 10),
  },
  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    providerTimeoutMs: parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000', 10),
  },
  botPassword: process.env.BOT_PASSWORD || '',
};

export default config;
