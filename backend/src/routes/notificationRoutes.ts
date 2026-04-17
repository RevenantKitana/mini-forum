import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// SSE stream - supports token via query param (EventSource can't set headers)
// Must be before the auth middleware applied to all routes
router.get('/stream', (req: Request, _res: Response, next: NextFunction) => {
  const token = req.query.token as string;
  if (token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
}, authMiddleware, notificationController.streamNotifications as RequestHandler);

// All other notification routes require authentication via header
router.use(authMiddleware);
router.get('/', notificationController.getNotifications as RequestHandler);
router.get('/unread-count', notificationController.getUnreadCount as RequestHandler);
router.patch('/read-all', notificationController.markAllAsRead as RequestHandler);
router.patch('/:id/read', notificationController.markAsRead as RequestHandler);
router.patch('/:id/restore', notificationController.restoreNotification as RequestHandler);
router.delete('/:id', notificationController.deleteNotification as RequestHandler);
router.delete('/', notificationController.deleteAllNotifications as RequestHandler);

export default router;






