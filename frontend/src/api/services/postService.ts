import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types for Post
export interface PostAuthor {
  id: number;
  username: string;
  display_name: string | null;
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
  role: string;
  reputation: number;
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  view_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  post_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
  comment_permission?: 'ALL' | 'MEMBER' | 'MODERATOR' | 'ADMIN';
}

export interface PostTag {
  id: number;
  name: string;
  slug: string;
}

export interface PostMedia {
  id: number;
  preview_url: string;
  standard_url: string;
  sort_order: number;
  block_id?: number | null;
}

export interface PostBlock {
  id: number;
  type: 'TEXT' | 'IMAGE';
  content: string | null;
  sort_order: number;
  media: PostMedia[];
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  author_id: number;
  category_id: number;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  is_pinned: boolean;
  pin_type?: 'GLOBAL' | 'CATEGORY' | null;
  is_locked: boolean;
  use_block_layout: boolean;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  category: PostCategory;
  tags: PostTag[];
  media: PostMedia[];
  blocks: PostBlock[]; // Phase 3: block layout
  mediaCount?: number; // Phase 1 UC-01: Total count of media items in post
}

export interface PostBlockInput {
  type: 'TEXT' | 'IMAGE';
  content?: string;
  sort_order: number;
  /** For IMAGE blocks in update: existing media IDs to re-associate with this block */
  mediaIds?: number[];
}

export interface CreatePostData {
  title: string;
  content?: string;
  category_id: number;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED';
  blocks?: PostBlockInput[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  category_id?: number;
  tags?: string[];
  use_block_layout?: boolean;
  blocks?: PostBlockInput[];
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
        category_id: data.category_id,
        tags: data.tags,
        status: data.status,
        use_block_layout: data.use_block_layout,
        blocks: data.blocks,
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
    if (data.category_id !== undefined) transformedData.category_id = data.category_id;
    if (data.tags !== undefined) transformedData.tags = data.tags;
    if (data.use_block_layout !== undefined) transformedData.use_block_layout = data.use_block_layout;
    if (data.blocks !== undefined) transformedData.blocks = data.blocks;

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
   * Upload media files to a post (UC-02, UC-03)
   * @param files Array of image files (max 10 MB each, up to 10 total)
   * @param blockId Optional block ID to associate media with a specific block
   */
  uploadMedia: async (postId: number | string, files: File[], blockId?: number): Promise<PostMedia[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (blockId !== undefined) formData.append('block_id', String(blockId));
    const response = await apiClient.post<ApiResponse<PostMedia[]>>(
      API_ENDPOINTS.POSTS.MEDIA(postId),
      formData,
    );
    return response.data.data;
  },

  /**
   * Delete a single post media item (UC-03)
   */
  deleteMedia: async (postId: number | string, mediaId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.POSTS.MEDIA_BY_ID(postId, mediaId));
  },

  /**
   * Reorder post media items (UC-03)
   * @param orderedIds All existing media IDs in the desired order
   */
  reorderMedia: async (postId: number | string, orderedIds: number[]): Promise<PostMedia[]> => {
    const response = await apiClient.patch<ApiResponse<PostMedia[]>>(
      API_ENDPOINTS.POSTS.MEDIA_REORDER(postId),
      { orderedIds },
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
