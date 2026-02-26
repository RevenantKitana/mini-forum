import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import categoryService, { Category, CreateCategoryData, UpdateCategoryData, PopularTag } from '@/api/services/categoryService';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...categoryKeys.lists(), { includeInactive }] as const,
  listWithTags: (includeInactive: boolean, tagLimit: number) => [...categoryKeys.lists(), { includeInactive, withTags: true, tagLimit }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  slug: (slug: string) => [...categoryKeys.all, 'slug', slug] as const,
};

/**
 * Hook to fetch all categories
 */
export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: categoryKeys.list(includeInactive),
    queryFn: () => categoryService.getAll(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all categories with popular tags
 */
export function useCategoriesWithTags(includeInactive = false, tagLimit = 5) {
  return useQuery({
    queryKey: categoryKeys.listWithTags(includeInactive, tagLimit),
    queryFn: () => categoryService.getAllWithTags(includeInactive, tagLimit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a category by ID
 */
export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch a category by slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: categoryKeys.slug(slug),
    queryFn: () => categoryService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to create a category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) =>
      categoryService.update(id, data),
    onSuccess: (updatedCategory: Category) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.setQueryData(categoryKeys.detail(updatedCategory.id), updatedCategory);
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export type { Category, CreateCategoryData, UpdateCategoryData, PopularTag };
