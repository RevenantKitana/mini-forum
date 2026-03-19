import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { sendSuccess } from '../utils/response.js';

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
