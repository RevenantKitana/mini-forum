import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function RealtimeNotificationsProvider({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return <>{children}</>;
}
