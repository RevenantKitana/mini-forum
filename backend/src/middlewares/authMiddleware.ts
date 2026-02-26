import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Export AuthRequest type for controllers
export interface AuthRequest extends Request {
  user: TokenPayload;
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - attaches user if token exists, but doesn't require it
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
}

// Export aliases for more descriptive naming
export const authMiddleware = authenticate;
export const optionalAuthMiddleware = optionalAuth;






