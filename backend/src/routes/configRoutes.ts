import { Router } from 'express';
import * as configController from '../controllers/configController.js';

const router = Router();

/**
 * @route   GET /api/v1/config/comment
 * @desc    Get comment configuration (edit time limit, etc.)
 * @access  Public
 * @return  { editTimeLimit: number }
 */
router.get('/comment', configController.getCommentConfig);

/**
 * @route   GET /api/v1/config/db-ping
 * @desc    Lightweight database ping to keep free tier DB alive
 * @access  Public (no authentication required)
 * @return  { status: 'ok', timestamp: string, responseTime: string }
 */
router.get('/db-ping', configController.pingDatabase as any);

export default router;
