import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import postService, { Post, CreatePostData, UpdatePostData, PostsQueryParams, PaginatedResponse } from '@/api/services/postService';

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params: PostsQueryParams) => [...postKeys.lists(), params] as const,
  featured: (limit: number) => [...postKeys.all, 'featured', limit] as const,
  latest: (limit: number) => [...postKeys.all, 'latest', limit] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...postKeys.details(), id] as const,
  slug: (slug: string) => [...postKeys.all, 'slug', slug] as const,
  byAuthor: (username: string) => [...postKeys.all, 'author', username] as const,
  related: (id: number) => [...postKeys.all, 'related', id] as const,
};

/**
 * Hook to fetch posts with pagination and filters
 */
export function usePosts(params: PostsQueryParams = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postService.getAll(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for infinite scrolling posts
 */
export function useInfinitePosts(params: Omit<PostsQueryParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: postKeys.list({ ...params, infinite: true } as any),
    queryFn: ({ pageParam = 1 }) => postService.getAll({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch featured posts
 */
export function useFeaturedPosts(limit = 5) {
  return useQuery({
    queryKey: postKeys.featured(limit),
    queryFn: () => postService.getFeatured(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch latest posts
 */
export function useLatestPosts(limit = 10) {
  return useQuery({
    queryKey: postKeys.latest(limit),
    queryFn: () => postService.getLatest(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a post by ID
 */
export function usePost(id: number | string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch a post by slug
 */
export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: postKeys.slug(slug),
    queryFn: () => postService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch posts by author
 */
export function usePostsByAuthor(username: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...postKeys.byAuthor(username), page, limit],
    queryFn: () => postService.getByAuthor(username, page, limit),
    enabled: !!username,
  });
}

/**
 * Hook to fetch related posts for a given post
 */
export function useRelatedPosts(postId: number | string, limit = 8) {
  return useQuery({
    queryKey: postKeys.related(Number(postId)),
    queryFn: () => postService.getRelated(Number(postId), limit),
    enabled: !!postId && Number(postId) > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostData) => postService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to update a post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdatePostData }) =>
      postService.update(id, data),
    onSuccess: (updatedPost: Post) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);
      queryClient.setQueryData(postKeys.slug(updatedPost.slug), updatedPost);
    },
  });
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => postService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to update post status
 */
export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      postService.updateStatus(id, status),
    onSuccess: (updatedPost: Post) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);
    },
  });
}

/**
 * Hook to toggle post pin
 */
export function useTogglePostPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => postService.togglePin(id),
    onSuccess: (updatedPost: Post) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);
    },
  });
}

/**
 * Hook to toggle post lock
 */
export function useTogglePostLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => postService.toggleLock(id),
    onSuccess: (updatedPost: Post) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);
    },
  });
}

/**
 * Hook to upload media files to a post (UC-02, UC-03)
 */
export function useUploadPostMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, files, blockId }: { postId: number | string; files: File[]; blockId?: number }) =>
      postService.uploadMedia(postId, files, blockId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to delete a single post media item (UC-03)
 */
export function useDeletePostMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, mediaId }: { postId: number | string; mediaId: number }) =>
      postService.deleteMedia(postId, mediaId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

/**
 * Hook to reorder post media items (UC-03)
 */
export function useReorderPostMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, orderedIds }: { postId: number | string; orderedIds: number[] }) =>
      postService.reorderMedia(postId, orderedIds),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

export type { Post, CreatePostData, UpdatePostData, PostsQueryParams, PaginatedResponse };
