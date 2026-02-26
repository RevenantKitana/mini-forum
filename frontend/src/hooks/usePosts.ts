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

export type { Post, CreatePostData, UpdatePostData, PostsQueryParams, PaginatedResponse };
