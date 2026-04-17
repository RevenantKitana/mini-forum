import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Structured HTTP access logger.
 * Replaces morgan – logs each request as a single JSON line (production)
 * or colored text (development), always including requestId.
 */
export function httpLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;
    logger.api(req.method, req.originalUrl, res.statusCode, Math.round(durationMs), {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
