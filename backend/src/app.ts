import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/errorMiddleware.js';
import {
  apiLimiter,
  authLimiter,
  additionalSecurityHeaders,
} from './middlewares/securityMiddleware.js';
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js';
import { httpLoggerMiddleware } from './middlewares/httpLoggerMiddleware.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
const connectOrigins = Array.isArray(config.cors.origin)
  ? config.cors.origin
  : [config.cors.origin];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Không dùng 'unsafe-inline' cho script
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind/CSS in JS có thể cần inline style
      imgSrc: ["'self'", 'data:', 'https://ik.imagekit.io', 'https:'],
      connectSrc: ["'self'", ...connectOrigins],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(additionalSecurityHeaders);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware - MUST be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (for HttpOnly refresh token cookie support)
app.use(cookieParser());

// Request ID (must be first so all subsequent middleware / logs have access to requestId)
app.use(requestIdMiddleware);

// Metrics collection
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/v1', apiLimiter);

// Stricter rate limiting for auth routes
app.use('/api/v1/auth', authLimiter);

// HTTP request logging (structured, includes requestId)
app.use(httpLoggerMiddleware);

// API routes
app.use('/api/v1', routes);

// Root route
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Mini Forum API v1',
    docs: '/api/v1/health',
  });
});

// Health check for Render deployment
app.get('/ping', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'pong',
  });
});

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;






