import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types for Tag
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  usageCount: number;
  usePermission: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagData {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateTagData {
  name?: string;
  description?: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Tag API Service
 */
export const tagService = {
  /**
   * Get all tags
   */
  getAll: async (limit?: number): Promise<Tag[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<ApiResponse<Tag[]>>(
      `${API_ENDPOINTS.TAGS.BASE}${params}`
    );
    return response.data.data;
  },

  /**
   * Get popular tags
   */
  getPopular: async (limit = 10): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>(
      `${API_ENDPOINTS.TAGS.BASE}/popular?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Get popular tags for a specific category
   */
  getPopularForCategory: async (categoryId: number, limit = 5): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>(
      `${API_ENDPOINTS.CATEGORIES.BY_ID(categoryId)}/tags?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Search tags
   */
  search: async (query: string, limit = 10): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>(
      `${API_ENDPOINTS.TAGS.BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Get tag by ID
   */
  getById: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<ApiResponse<Tag>>(
      API_ENDPOINTS.TAGS.BY_ID(id)
    );
    return response.data.data;
  },

  /**
   * Get tag by slug
   */
  getBySlug: async (slug: string): Promise<Tag> => {
    const response = await apiClient.get<ApiResponse<Tag>>(
      API_ENDPOINTS.TAGS.BY_SLUG(slug)
    );
    return response.data.data;
  },

  /**
   * Create new tag (Mod/Admin only)
   */
  create: async (data: CreateTagData): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>(
      API_ENDPOINTS.TAGS.BASE,
      data
    );
    return response.data.data;
  },

  /**
   * Update tag (Admin only)
   */
  update: async (id: number, data: UpdateTagData): Promise<Tag> => {
    const response = await apiClient.put<ApiResponse<Tag>>(
      API_ENDPOINTS.TAGS.BY_ID(id),
      data
    );
    return response.data.data;
  },

  /**
   * Delete tag (Admin only)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TAGS.BY_ID(id));
  },
};

export default tagService;
