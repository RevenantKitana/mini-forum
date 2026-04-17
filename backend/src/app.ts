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
import { snakeToCamelObject } from './utils/snakeToCamel.js';
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js';
import { httpLoggerMiddleware } from './middlewares/httpLoggerMiddleware.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
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

// Global response transform middleware
// Converts all snake_case keys in JSON responses to camelCase
// This ensures frontend always receives camelCase field names
app.use((_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    return originalJson(snakeToCamelObject(body));
  } as any;
  next();
});

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






