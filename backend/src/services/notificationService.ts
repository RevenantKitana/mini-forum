import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { CreateNotificationInput, NotificationQuery } from '../validations/notificationValidation.js';
import { sendToUser } from './sseService.js';

type NotificationType = 'COMMENT' | 'REPLY' | 'MENTION' | 'UPVOTE' | 'SYSTEM';

interface EnrichedNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  deleted_at: Date | null;
  created_at: Date;
  // Additional navigation info
  postId?: number | null;
  commentId?: number | null;
}

/**
 * Enrich notifications with navigation info (postId, postSlug for comments)
 */
async function enrichNotificationsWithNavInfo(notifications: any[]): Promise<EnrichedNotification[]> {
  // Collect comment IDs that need post info
  const commentIds = notifications
    .filter(n => n.relatedType === 'COMMENT' && n.relatedId)
    .map(n => n.relatedId);

  // Collect post IDs
  const post_ids = notifications
    .filter(n => n.relatedType === 'POST' && n.relatedId)
    .map(n => n.relatedId);

  // Fetch comment -> post mappings
  const comments = commentIds.length > 0 
    ? await prisma.comments.findMany({
        where: { id: { in: commentIds } },
        select: { id: true, post_id: true, posts: { select: { id: true } } },
      })
    : [];

  // Fetch post ids
  const posts = post_ids.length > 0
    ? await prisma.posts.findMany({
        where: { id: { in: post_ids } },
        select: { id: true },
      })
    : [];

  const commentMap = new Map(comments.map(c => [c.id, c]));
  const postMap = new Map(posts.map(p => [p.id, p]));

  return notifications.map(n => {
    const enriched: EnrichedNotification = { ...n };
    
    if (n.relatedType === 'COMMENT' && n.relatedId) {
      const comment = commentMap.get(n.relatedId);
      if (comment) {
        enriched.postId = comment.posts.id;
        enriched.commentId = comment.id;
      }
    } else if (n.relatedType === 'POST' && n.relatedId) {
      const post = postMap.get(n.relatedId);
      if (post) {
        enriched.postId = post.id;
      }
    }
    
    return enriched;
  });
}

/**
 * Get user's notifications
 */
export async function getNotifications(userId: number, query: NotificationQuery) {
  const { page, limit, unreadOnly, includeDeleted } = query;
  const skip = (page - 1) * limit;

  const where: {
    userId: number;
    isRead?: boolean;
    deleted_at?: null | { not: null };
  } = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
    // By default, exclude soft-deleted notifications
    ...(includeDeleted ? {} : { deleted_at: null }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notifications.count({ where }),
  ]);

  // Enrich notifications with navigation info
  const enrichedNotifications = await enrichNotificationsWithNavInfo(notifications);

  return {
    data: enrichedNotifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get unread notification count (excluding soft-deleted)
 */
export async function getUnreadCount(userId: number): Promise<number> {
  return prisma.notifications.count({
    where: {
      userId,
      isRead: false,
      deleted_at: null,
    },
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number, userId: number) {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return prisma.notifications.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: number) {
  const result = await prisma.notifications.updateMany({
    where: {
      userId,
      isRead: false,
      deleted_at: null,
    },
    data: { isRead: true },
  });

  return { count: result.count };
}

/**
 * Soft delete a notification (sets deleted_at timestamp)
 */
export async function deleteNotification(notificationId: number, userId: number) {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: notificationId,
      userId,
      deleted_at: null,
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return prisma.notifications.update({
    where: { id: notificationId },
    data: { deleted_at: new Date() },
  });
}

/**
 * Soft delete all notifications for a user
 */
export async function deleteAllNotifications(userId: number) {
  const result = await prisma.notifications.updateMany({
    where: { 
      userId,
      deleted_at: null,
    },
    data: { deleted_at: new Date() },
  });

  return { count: result.count };
}

/**
 * Permanently delete a notification (hard delete)
 */
export async function permanentlyDeleteNotification(notificationId: number, userId: number) {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return prisma.notifications.delete({
    where: { id: notificationId },
  });
}

/**
 * Restore a soft-deleted notification
 */
export async function restoreNotification(notificationId: number, userId: number) {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: notificationId,
      userId,
      deleted_at: { not: null },
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found or not deleted');
  }

  return prisma.notifications.update({
    where: { id: notificationId },
    data: { deleted_at: null },
  });
}

/**
 * Create a notification
 */
export async function createNotification(data: CreateNotificationInput & { title?: string }) {
  const notification = await prisma.notifications.create({
    data: {
      userId: data.userId,
      type: data.type as NotificationType,
      title: data.title || 'Thông báo',
      content: data.content,
      relatedType: data.referenceType,
      relatedId: data.referenceId,
    },
  });

  // Push realtime notification via SSE
  sendToUser(data.userId, 'notification', notification);

  return notification;
}

/**
 * Create notification for new comment on user's post
 */
export async function notifyPostAuthor(
  postauthor_id: number,
  commenterName: string,
  postTitle: string,
  postId: number,
  commentId: number
) {
  return createNotification({
    userId: postauthor_id,
    type: 'COMMENT',
    title: 'Bình luận mới',
    content: `${commenterName} đã bình luận về bài viết "${postTitle.substring(0, 50)}"`,
    referenceType: 'POST',
    referenceId: postId,
  });
}

/**
 * Create notification for reply to user's comment
 */
export async function notifyCommentAuthor(
  commentauthor_id: number,
  replierName: string,
  postTitle: string,
  postId: number,
  replyId: number
) {
  return createNotification({
    userId: commentauthor_id,
    type: 'REPLY',
    title: 'Trả lời bình luận',
    content: `${replierName} đã trả lời bình luận của bạn trong "${postTitle.substring(0, 50)}"`,
    referenceType: 'COMMENT',
    referenceId: replyId,
  });
}

/**
 * Create notification for vote on user's content
 */
export async function notifyVote(
  contentauthor_id: number,
  voterName: string,
  targetType: 'POST' | 'COMMENT',
  voteType: 'up' | 'down',
  targetId: number
) {
  const action = voteType === 'up' ? 'thích' : 'không thích';
  const contentType = targetType === 'POST' ? 'bài viết' : 'bình luận';
  
  return createNotification({
    userId: contentauthor_id,
    type: 'UPVOTE',
    title: 'Lượt vote mới',
    content: `${voterName} đã ${action} ${contentType} của bạn`,
    referenceType: targetType,
    referenceId: targetId,
  });
}

/**
 * Create system notification
 */
export async function createSystemNotification(userId: number, content: string, title = 'Thông báo hệ thống') {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    content,
  });
}









