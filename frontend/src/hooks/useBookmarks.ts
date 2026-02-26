import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bookmarkService from '@/api/services/bookmarkService';

/**
 * Hook to get user's bookmarks
 */
export function useBookmarks(userId: number, page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['bookmarks', userId, page, limit],
    queryFn: () => bookmarkService.getUserBookmarks(userId, page, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check if a post is bookmarked
 */
export function useBookmarkStatus(postId: number, enabled = true) {
  return useQuery({
    queryKey: ['bookmarkStatus', postId],
    queryFn: () => bookmarkService.checkBookmark(postId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to add bookmark
 */
export function useAddBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => bookmarkService.addBookmark(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkStatus', postId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

/**
 * Hook to remove bookmark
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => bookmarkService.removeBookmark(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkStatus', postId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

/**
 * Hook to toggle bookmark
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => bookmarkService.toggleBookmark(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarkStatus', postId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
