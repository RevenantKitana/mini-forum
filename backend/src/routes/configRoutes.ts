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

export default router;
