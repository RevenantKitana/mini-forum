import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware that attaches a unique requestId/correlationId to every request.
 * Reads X-Request-Id / X-Correlation-Id from incoming headers (for propagation
 * across services), or generates a new UUID v4 when absent.
 *
 * The id is:
 *  - stored on `req.requestId`
 *  - echoed back in the response header `X-Request-Id`
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming =
    (req.headers['x-request-id'] as string | undefined) ||
    (req.headers['x-correlation-id'] as string | undefined);

  req.requestId = incoming || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
