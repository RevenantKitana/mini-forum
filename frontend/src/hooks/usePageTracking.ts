import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, cleanupOldEvents, trackSessionStart } from '@/utils/analytics';

/**
 * Hook to automatically track page views on route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  // Track session start and cleanup old events once per session
  useEffect(() => {
    trackSessionStart();
    cleanupOldEvents();
  }, []);
}
