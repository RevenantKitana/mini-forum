import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import tagService, { Tag, CreateTagData, UpdateTagData } from '@/api/services/tagService';

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (limit?: number) => [...tagKeys.lists(), { limit }] as const,
  popular: (limit: number) => [...tagKeys.all, 'popular', limit] as const,
  popularForCategory: (categoryId: number, limit: number) => [...tagKeys.all, 'popularForCategory', categoryId, limit] as const,
  search: (query: string) => [...tagKeys.all, 'search', query] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: number) => [...tagKeys.details(), id] as const,
  slug: (slug: string) => [...tagKeys.all, 'slug', slug] as const,
};

/**
 * Hook to fetch all tags
 */
export function useTags(limit?: number) {
  return useQuery({
    queryKey: tagKeys.list(limit),
    queryFn: () => tagService.getAll(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch popular tags
 */
export function usePopularTags(limit = 10) {
  return useQuery({
    queryKey: tagKeys.popular(limit),
    queryFn: () => tagService.getPopular(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch popular tags for a specific category
 */
export function usePopularTagsForCategory(categoryId: number | undefined, limit = 5) {
  return useQuery({
    queryKey: tagKeys.popularForCategory(categoryId || 0, limit),
    queryFn: () => tagService.getPopularForCategory(categoryId!, limit),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search tags
 */
export function useSearchTags(query: string, limit = 10) {
  return useQuery({
    queryKey: tagKeys.search(query),
    queryFn: () => tagService.search(query, limit),
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a tag by ID
 */
export function useTag(id: number) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => tagService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch a tag by slug
 */
export function useTagBySlug(slug: string) {
  return useQuery({
    queryKey: tagKeys.slug(slug),
    queryFn: () => tagService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to create a tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagData) => tagService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

/**
 * Hook to update a tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTagData }) =>
      tagService.update(id, data),
    onSuccess: (updatedTag: Tag) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      queryClient.setQueryData(tagKeys.detail(updatedTag.id), updatedTag);
    },
  });
}

/**
 * Hook to delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

export type { Tag, CreateTagData, UpdateTagData };
