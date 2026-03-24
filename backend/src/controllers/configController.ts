import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { sendSuccess } from '../utils/response.js';
import prisma from '../config/database.js';

/**
 * GET /api/v1/config/comment
 * Get comment configuration (public endpoint)
 * Allows frontend to fetch dynamic config values
 */
export async function getCommentConfig(req: Request, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, {
      editTimeLimit: config.comment.editTimeLimit,
    }, 'Comment config retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/config/db-ping
 * Lightweight database ping to prevent free tier database from sleeping
 * Executes a simple SELECT 1 query
 * @access Public (no auth required)
 */
export async function pingDatabase(req: Request, res: Response, next: NextFunction) {
  try {
    const startTime = Date.now();
    
    // Execute lightweight query to keep DB connection alive
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;

    return sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
    }, 'Database ping successful');
  } catch (error) {
    next(error);
  }
}
