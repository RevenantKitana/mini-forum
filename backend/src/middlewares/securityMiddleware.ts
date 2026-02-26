import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { BadRequestError } from '../utils/errors.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased from 100 to 300 requests per window (to avoid blocking parallel init requests)
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check and root endpoint
    return req.path === '/' || req.path === '/api/v1/health';
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Rate limiter for creating content (posts, comments)
export const createContentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 creations per minute
  message: {
    success: false,
    message: 'Too many creations, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for voting
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 votes per minute
  message: {
    success: false,
    message: 'Too many votes, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: 'Too many searches, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitizer middleware - basic XSS prevention
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as any;
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

function sanitizeString(str: string): string {
  // Basic XSS prevention - escape HTML special chars
  // Note: We don't escape forward slashes (/) because they're needed in URLs
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Content-Type validation middleware
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  // Only check POST, PUT, PATCH requests with body
  const methodsWithBody = ['POST', 'PUT', 'PATCH'];
  
  if (methodsWithBody.includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type must be application/json',
      });
    }
  }
  
  next();
}

// Request size limiter
export function limitRequestSize(maxSize: number = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
      });
    }
    
    next();
  };
}

// Prevent NoSQL injection (basic)
export function preventNoSQLInjection(req: Request, _res: Response, next: NextFunction) {
  const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin', '$or', '$and'];

  function checkObject(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return true;
      }
      if (typeof obj[key] === 'object' && checkObject(obj[key])) {
        return true;
      }
    }
    return false;
  }

  if (checkObject(req.body) || checkObject(req.query)) {
    throw new BadRequestError('Invalid request parameters');
  }

  next();
}

// Security headers middleware (additional to helmet)
export function additionalSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  next();
}






