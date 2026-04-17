import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/api/axios';
import { toast } from 'sonner';

const SSE_RECONNECT_DELAY = 5000;
const SSE_MAX_RETRIES = 10;

export function useRealtimeNotifications() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!isAuthenticated || !token) return;

    const apiUrl = import.meta.env.VITE_API_URL || '';
    const url = `${apiUrl}/notifications/stream`;

    // Use EventSource with auth via query param (SSE doesn't support custom headers)
    // We'll use a polyfill approach with fetch-based SSE
    const eventSource = new EventSource(`${url}?token=${encodeURIComponent(token)}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      retriesRef.current = 0;
    };

    eventSource.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        // Invalidate notification queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notificationCount'] });

        // Show toast notification
        toast.info(notification.title || 'Thông báo mới', {
          description: notification.content,
          duration: 5000,
        });
      } catch {
        // Ignore parse errors
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      // Keep-alive, no action needed
    });

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;

      if (retriesRef.current < SSE_MAX_RETRIES) {
        retriesRef.current++;
        reconnectTimerRef.current = setTimeout(connect, SSE_RECONNECT_DELAY);
      }
    };
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);
}
