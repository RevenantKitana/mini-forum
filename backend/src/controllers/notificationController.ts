import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService.js';
import { sendSuccess, sendNoContent, sendPaginated } from '../utils/response.js';
import { notificationQuerySchema } from '../validations/notificationValidation.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query = notificationQuerySchema.parse(req.query);
    const result = await notificationService.getNotifications(req.user!.userId, query);
    return sendPaginated(res, result.data, result.pagination, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    return sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const notification = await notificationService.markAsRead(id, req.user!.userId);
    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    return sendSuccess(res, result, `${result.count} notifications marked as read`);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    await notificationService.deleteNotification(id, req.user!.userId);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/notifications
 * Delete all notifications (soft delete)
 */
export async function deleteAllNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.deleteAllNotifications(req.user!.userId);
    return sendSuccess(res, result, `${result.count} notifications deleted`);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/notifications/:id/restore
 * Restore a soft-deleted notification
 */
export async function restoreNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string, 10);
    const notification = await notificationService.restoreNotification(id, req.user!.userId);
    return sendSuccess(res, notification, 'Notification restored');
  } catch (error) {
    next(error);
  }
}







