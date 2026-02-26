import { Router, RequestHandler } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', notificationController.getNotifications as RequestHandler);
router.get('/unread-count', notificationController.getUnreadCount as RequestHandler);
router.patch('/read-all', notificationController.markAllAsRead as RequestHandler);
router.patch('/:id/read', notificationController.markAsRead as RequestHandler);
router.patch('/:id/restore', notificationController.restoreNotification as RequestHandler);
router.delete('/:id', notificationController.deleteNotification as RequestHandler);
router.delete('/', notificationController.deleteAllNotifications as RequestHandler);

export default router;






