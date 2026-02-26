import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Notification, PaginatedResponse } from '@/types';

// Extended Notification type
export interface NotificationItem {
  id: number;
  userId: number;
  type: 'COMMENT' | 'REPLY' | 'UPVOTE' | 'MENTION' | 'SYSTEM';
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
  // Navigation info (enriched by backend)
  postId?: number | null;
  postSlug?: string | null;
  commentId?: number | null;
}

export interface UnreadCount {
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get notifications
 */
export async function getNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<PaginatedResponse<NotificationItem>> {
  // Only send unreadOnly param when true to avoid z.coerce.boolean() issues
  const params: Record<string, any> = { page, limit };
  if (unreadOnly) params.unreadOnly = 'true';
  
  const response = await apiClient.get<PaginatedApiResponse<NotificationItem>>(
    API_ENDPOINTS.NOTIFICATIONS.BASE,
    { params }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<UnreadCount>>(
    `${API_ENDPOINTS.NOTIFICATIONS.BASE}/unread-count`
  );
  return response.data.data.count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: number): Promise<NotificationItem> {
  const response = await apiClient.patch<ApiResponse<NotificationItem>>(
    `${API_ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}/read`
  );
  return response.data.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await apiClient.patch<ApiResponse<{ count: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ
  );
  return response.data.data;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${notificationId}`);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<{ count: number }> {
  const response = await apiClient.delete<ApiResponse<{ count: number }>>(
    API_ENDPOINTS.NOTIFICATIONS.BASE
  );
  return response.data.data;
}
