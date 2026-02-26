import { useQuery } from '@tanstack/react-query';
import * as searchService from '@/api/services/searchService';
import { SearchParams } from '@/api/services/searchService';

/**
 * Hook to search posts
 */
export function useSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchService.searchPosts(params),
    enabled: enabled && !!params.q,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to search users
 */
export function useSearchUsers(q: string, page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['searchUsers', q, page, limit],
    queryFn: () => searchService.searchUsers(q, page, limit),
    enabled: enabled && !!q,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get search suggestions
 */
export function useSearchSuggestions(q: string, limit = 5, enabled = true) {
  return useQuery({
    queryKey: ['searchSuggestions', q, limit],
    queryFn: () => searchService.getSearchSuggestions(q, limit),
    enabled: enabled && q.length >= 2,
    staleTime: 30 * 1000,
  });
}
