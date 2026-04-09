import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types for Post
export interface PostAuthor {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  reputation: number;
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  viewPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  postPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  commentPermission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
}

export interface PostTag {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  authorId: number;
  categoryId: number;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  isPinned: boolean;
  pinType?: 'GLOBAL' | 'CATEGORY' | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  category: PostCategory;
  tags: PostTag[];
}

export interface CreatePostData {
  title: string;
  content: string;
  categoryId: number;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  categoryId?: number;
  tags?: string[];
}

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  tags?: string; // Multiple tags comma-separated
  author?: string;
  sort?: 'latest' | 'popular' | 'trending' | 'oldest' | 'oldest_first' | 'unpopular' | 'least_trending';
  status?: string;
  search?: string;
  dateFrom?: string; // ISO date string for filtering posts from this date
  dateTo?: string; // ISO date string for filtering posts until this date
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Post API Service
 */
export const postService = {
  /**
   * Get posts with pagination and filters
   */
  getAll: async (params?: PostsQueryParams): Promise<PaginatedResponse<Post>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category) queryParams.set('category', params.category);
    if (params?.tag) queryParams.set('tag', params.tag);
    if (params?.tags) queryParams.set('tags', params.tags);
    if (params?.author) queryParams.set('author', params.author);
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.set('dateTo', params.dateTo);

    const response = await apiClient.get<ApiResponse<Post[]>>(
      `${API_ENDPOINTS.POSTS.BASE}?${queryParams.toString()}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Get featured posts
   */
  getFeatured: async (limit = 5): Promise<Post[]> => {
    const response = await apiClient.get<ApiResponse<Post[]>>(
      `${API_ENDPOINTS.POSTS.BASE}/featured?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Get latest posts
   */
  getLatest: async (limit = 10): Promise<Post[]> => {
    const response = await apiClient.get<ApiResponse<Post[]>>(
      `${API_ENDPOINTS.POSTS.BASE}/latest?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Get post by ID
   */
  getById: async (id: number | string): Promise<Post> => {
    const response = await apiClient.get<ApiResponse<Post>>(
      API_ENDPOINTS.POSTS.BY_ID(id)
    );
    return response.data.data;
  },

  /**
   * Get post by slug
   */
  getBySlug: async (slug: string): Promise<Post> => {
    const response = await apiClient.get<ApiResponse<Post>>(
      `${API_ENDPOINTS.POSTS.BASE}/slug/${slug}`
    );
    return response.data.data;
  },

  /**
   * Create new post
   */
  create: async (data: CreatePostData): Promise<Post> => {
    const response = await apiClient.post<ApiResponse<Post>>(
      API_ENDPOINTS.POSTS.BASE,
      {
        title: data.title,
        content: data.content,
        category_id: data.categoryId,
        tags: data.tags,
        status: data.status,
      }
    );
    return response.data.data;
  },

  /**
   * Update post
   */
  update: async (id: number | string, data: UpdatePostData): Promise<Post> => {
    const transformedData: Record<string, any> = {};
    if (data.title !== undefined) transformedData.title = data.title;
    if (data.content !== undefined) transformedData.content = data.content;
    if (data.categoryId !== undefined) transformedData.category_id = data.categoryId;
    if (data.tags !== undefined) transformedData.tags = data.tags;

    const response = await apiClient.put<ApiResponse<Post>>(
      API_ENDPOINTS.POSTS.BY_ID(id),
      transformedData
    );
    return response.data.data;
  },

  /**
   * Delete post
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POSTS.BY_ID(id));
  },

  /**
   * Update post status
   */
  updateStatus: async (id: number | string, status: string): Promise<Post> => {
    const response = await apiClient.patch<ApiResponse<Post>>(
      `${API_ENDPOINTS.POSTS.BY_ID(id)}/status`,
      { status }
    );
    return response.data.data;
  },

  /**
   * Toggle post pin (Mod/Admin only)
   */
  togglePin: async (id: number | string): Promise<Post> => {
    const response = await apiClient.patch<ApiResponse<Post>>(
      `${API_ENDPOINTS.POSTS.BY_ID(id)}/pin`
    );
    return response.data.data;
  },

  /**
   * Toggle post lock (Mod/Admin only)
   */
  toggleLock: async (id: number | string): Promise<Post> => {
    const response = await apiClient.patch<ApiResponse<Post>>(
      `${API_ENDPOINTS.POSTS.BY_ID(id)}/lock`
    );
    return response.data.data;
  },

  /**
   * Get related posts for a given post
   */
  getRelated: async (postId: number, limit = 8): Promise<Post[]> => {
    const response = await apiClient.get<ApiResponse<Post[]>>(
      `${API_ENDPOINTS.POSTS.RELATED(postId)}?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Get posts by author
   */
  getByAuthor: async (username: string, page = 1, limit = 10): Promise<PaginatedResponse<Post>> => {
    const response = await apiClient.get<ApiResponse<Post[]>>(
      `/users/${username}/posts?page=${page}&limit=${limit}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },
};

export default postService;
