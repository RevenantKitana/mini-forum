import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentService, { Comment, CreateCommentData, UpdateCommentData, CommentsQueryParams, PaginatedCommentsResponse } from '@/api/services/commentService';
import { postKeys } from './usePosts';

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  byPost: (postId: number | string) => [...commentKeys.all, 'post', postId] as const,
  byPostWithParams: (postId: number | string, params: CommentsQueryParams) => [...commentKeys.byPost(postId), params] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...commentKeys.details(), id] as const,
  replies: (commentId: number | string) => [...commentKeys.all, 'replies', commentId] as const,
};

/**
 * Hook to fetch comments for a post
 */
export function useComments(postId: number | string, params: CommentsQueryParams = {}) {
  return useQuery({
    queryKey: commentKeys.byPostWithParams(postId, params),
    queryFn: () => commentService.getByPostId(postId, params),
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a comment by ID
 */
export function useComment(id: number | string) {
  return useQuery({
    queryKey: commentKeys.detail(id),
    queryFn: () => commentService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch replies to a comment
 */
export function useCommentReplies(commentId: number | string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...commentKeys.replies(commentId), page, limit],
    queryFn: () => commentService.getReplies(commentId, page, limit),
    enabled: !!commentId,
  });
}

/**
 * Hook to create a comment
 */
export function useCreateComment(postId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => commentService.create(postId, data),
    onSuccess: () => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // Update post comment count
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

/**
 * Hook to update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateCommentData }) =>
      commentService.update(id, data),
    onSuccess: (updatedComment: Comment) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(updatedComment.post_id) });
      queryClient.setQueryData(commentKeys.detail(updatedComment.id), updatedComment);
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, postId }: { id: number | string; postId: number | string }) =>
      commentService.delete(id),
    onSuccess: (_, { postId }) => {
      // Invalidate comments for the post
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
      // Update post comment count
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

/**
 * Hook to toggle hide status for a comment
 */
export function useToggleCommentHide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => commentService.toggleHide(id),
    onSuccess: (updatedComment: Comment) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(updatedComment.post_id) });
    },
  });
}

export type { Comment, CreateCommentData, UpdateCommentData, CommentsQueryParams, PaginatedCommentsResponse };
