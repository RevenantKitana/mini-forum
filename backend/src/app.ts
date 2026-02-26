import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/errorMiddleware.js';
import {
  apiLimiter,
  authLimiter,
  additionalSecurityHeaders,
} from './middlewares/securityMiddleware.js';
import { snakeToCamelObject } from './utils/snakeToCamel.js';

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

// Note: sanitizeInput removed (P0-3) — XSS prevention belongs at render layer (frontend MarkdownRenderer)
// Note: preventNoSQLInjection removed (P1-5) — Prisma ORM parameterizes all queries, NoSQL operators irrelevant

// Rate limiting
app.use('/api/v1', apiLimiter);

// Stricter rate limiting for auth routes
app.use('/api/v1/auth', authLimiter);

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

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

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;






