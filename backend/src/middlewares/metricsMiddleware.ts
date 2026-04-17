import { Request, Response, NextFunction } from 'express';
import { recordRequest } from '../services/metricsService.js';

/**
 * Middleware that records per-request metrics (latency, error flag).
 * Must be mounted AFTER requestIdMiddleware.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;
    const isError = res.statusCode >= 500;
    recordRequest(Math.round(durationMs), isError);
  });

  next();
}
