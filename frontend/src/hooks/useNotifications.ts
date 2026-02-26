import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '@/api/services/notificationService';

/**
 * Hook to get notifications
 */
export function useNotifications(page = 1, limit = 20, unreadOnly = false, enabled = true) {
  return useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: () => notificationService.getNotifications(page, limit, unreadOnly),
    enabled,
    staleTime: 30 * 1000, // 30 seconds - notifications should update frequently
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: ['notificationCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Update cache immediately for better UX
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((notification: any) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
          };
        }
      );
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}

/**
 * Hook to delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });
}
