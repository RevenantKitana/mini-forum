import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

export interface CommentConfig {
  editTimeLimit: number;
}

/**
 * Fetch comment configuration from backend
 * Allows getting dynamic values instead of hardcoding them
 */
export function useCommentConfig() {
  return useQuery({
    queryKey: ['config', 'comment'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: CommentConfig }>('/config/comment');
      return data.data;
    },
    // Cache for 24 hours since config rarely changes
    staleTime: 24 * 60 * 60 * 1000,
    // Retry once if fails
    retry: 1,
  });
}
