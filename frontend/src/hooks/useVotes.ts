import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as voteService from '@/api/services/voteService';

/**
 * Hook to get user's vote on a post
 */
export function usePostVote(postId: number, enabled = true) {
  return useQuery({
    queryKey: ['postVote', postId],
    queryFn: () => voteService.getPostVote(postId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to vote on a post
 */
export function useVotePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, voteType }: { postId: number; voteType: 'up' | 'down' }) =>
      voteService.votePost(postId, voteType),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['postVote', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

/**
 * Hook to remove vote from a post
 */
export function useRemovePostVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => voteService.removePostVote(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postVote', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

/**
 * Hook to get user's vote on a comment
 */
export function useCommentVote(commentId: number, enabled = true) {
  return useQuery({
    queryKey: ['commentVote', commentId],
    queryFn: () => voteService.getCommentVote(commentId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to vote on a comment
 */
export function useVoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, voteType }: { commentId: number; voteType: 'up' | 'down' }) =>
      voteService.voteComment(commentId, voteType),
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['commentVote', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/**
 * Hook to remove vote from a comment
 */
export function useRemoveCommentVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => voteService.removeCommentVote(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['commentVote', commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/**
 * Hook to get current user's vote history (private)
 */
export function useMyVoteHistory(options: {
  page?: number;
  limit?: number;
  targetType?: 'POST' | 'COMMENT';
  voteType?: 'up' | 'down';
  enabled?: boolean;
} = {}) {
  const { enabled = true, ...queryOptions } = options;
  
  return useQuery({
    queryKey: ['myVoteHistory', queryOptions],
    queryFn: () => voteService.getMyVoteHistory(queryOptions),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
