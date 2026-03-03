import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, OtpError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Only log unexpected errors (non-operational) to avoid noise in test output
  // Operational errors (4xx) are expected and don't need logging
  const isOperational = err instanceof AppError && err.isOperational;
  if (!isOperational && process.env.NODE_ENV !== 'test') {
    console.error('Unexpected Error:', err);
  } else if (!isOperational) {
    // In test environment, still log truly unexpected errors (non-AppError)
    console.error('Unexpected Error:', err.message);
  }

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      sendError(res, err.message, err.statusCode, err.errors);
      return;
    }
    if (err instanceof OtpError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        error: err.code,
        attemptsRemaining: err.attemptsRemaining,
      });
      return;
    }
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.join(', ') || 'field';
      sendError(res, `A record with this ${target} already exists`, 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Handle validation errors from Zod
  if (err.name === 'ZodError') {
    sendError(res, 'Validation error', 422);
    return;
  }

  // Default error
  const message = config.nodeEnv === 'production' ? 'Internal server error' : err.message;
  sendError(res, message, 500);
}

/**
 * 404 Not Found handler
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}






