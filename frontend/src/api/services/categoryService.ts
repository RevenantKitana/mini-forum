import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Permission levels
export type PermissionLevel = 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';

// Types for Category
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon?: string | null;
  sortOrder: number;
  postCount: number;
  viewCount?: number;
  commentCount?: number;
  isActive: boolean;
  viewPermission?: PermissionLevel;
  postPermission?: PermissionLevel;
  commentPermission?: PermissionLevel;
  createdAt: string;
  updatedAt: string;
  popularTags?: PopularTag[];
}

export interface PopularTag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Category API Service
 */
export const categoryService = {
  /**
   * Get all categories
   */
  getAll: async (includeInactive = false): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      `${API_ENDPOINTS.CATEGORIES.BASE}?includeInactive=${includeInactive}`
    );
    return response.data.data;
  },

  /**
   * Get all categories with popular tags
   */
  getAllWithTags: async (includeInactive = false, tagLimit = 5): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>(
      `${API_ENDPOINTS.CATEGORIES.BASE}?includeInactive=${includeInactive}&includeTags=true&tagLimit=${tagLimit}`
    );
    return response.data.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id)
    );
    return response.data.data;
  },

  /**
   * Get category by slug
   */
  getBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(
      API_ENDPOINTS.CATEGORIES.BY_SLUG(slug)
    );
    return response.data.data;
  },

  /**
   * Create new category (Admin only)
   */
  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>(
      API_ENDPOINTS.CATEGORIES.BASE,
      data
    );
    return response.data.data;
  },

  /**
   * Update category (Admin only)
   */
  update: async (id: number, data: UpdateCategoryData): Promise<Category> => {
    const response = await apiClient.put<ApiResponse<Category>>(
      API_ENDPOINTS.CATEGORIES.BY_ID(id),
      data
    );
    return response.data.data;
  },

  /**
   * Delete category (Admin only)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  },
};

export default categoryService;
