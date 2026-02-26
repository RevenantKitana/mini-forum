import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { postKeys } from './usePosts';
import { searchKeys } from './useSearch';

/**
 * Hook to invalidate relevant queries when authentication state changes
 * This ensures users don't see cached data from another user's session
 */
export function useAuthInvalidation() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // When auth state changes (login/logout), invalidate all posts-related queries
    // This prevents showing cached data from previous user's session
    queryClient.invalidateQueries({ queryKey: postKeys.all });
    
    // Also invalidate search queries
    if (searchKeys) {
      queryClient.invalidateQueries({ queryKey: ['search'] });
    }
  }, [isAuthenticated, user?.role, queryClient]);
}
