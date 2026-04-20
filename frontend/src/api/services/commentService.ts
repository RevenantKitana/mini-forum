import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types for Comment
export interface CommentAuthor {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  reputation: number;
}

export interface QuotedComment {
  id: number;
  content: string;
  author: CommentAuthor;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  post_id: number;
  parent_id: number | null;
  quoted_comment_id: number | null;
  upvote_count: number;
  downvote_count: number;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  quotedComment?: QuotedComment | null;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentData {
  content: string;
  parent_id?: number;
  quoted_comment_id?: number;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentsQueryParams {
  page?: number;
  limit?: number;
  sort?: 'latest' | 'oldest' | 'popular';
}

export interface PaginatedCommentsResponse {
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  is_locked: boolean;
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
  isLocked?: boolean;
}

/**
 * Comment API Service
 */
export const commentService = {
  /**
   * Get comments for a post
   */
  getByPostId: async (postId: number | string, params?: CommentsQueryParams): Promise<PaginatedCommentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.sort) queryParams.set('sort', params.sort);

    const response = await apiClient.get<ApiResponse<Comment[]>>(
      `${API_ENDPOINTS.COMMENTS.BY_POST(postId)}?${queryParams.toString()}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
      is_locked: response.data.isLocked || false,
    };
  },

  /**
   * Get comment by ID
   */
  getById: async (id: number | string): Promise<Comment> => {
    const response = await apiClient.get<ApiResponse<Comment>>(
      API_ENDPOINTS.COMMENTS.BY_ID(id)
    );
    return response.data.data;
  },

  /**
   * Get replies to a comment
   */
  getReplies: async (commentId: number | string, page = 1, limit = 10): Promise<{ data: Comment[], pagination: any }> => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(
      `${API_ENDPOINTS.COMMENTS.BY_ID(commentId)}/replies?page=${page}&limit=${limit}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Create a new comment
   */
  create: async (postId: number | string, data: CreateCommentData): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<Comment>>(
      API_ENDPOINTS.COMMENTS.BY_POST(postId),
      {
        content: data.content,
        parent_id: data.parent_id,
        quoted_comment_id: data.quoted_comment_id,
      }
    );
    return response.data.data;
  },

  /**
   * Update a comment
   */
  update: async (id: number | string, data: UpdateCommentData): Promise<Comment> => {
    const response = await apiClient.put<ApiResponse<Comment>>(
      API_ENDPOINTS.COMMENTS.BY_ID(id),
      data
    );
    return response.data.data;
  },

  /**
   * Delete a comment
   */
  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.COMMENTS.BY_ID(id));
  },

  /**
   * Hide/unhide a comment (Mod/Admin only)
   */
  toggleHide: async (id: number | string): Promise<Comment> => {
    const response = await apiClient.patch<ApiResponse<Comment>>(
      `${API_ENDPOINTS.COMMENTS.BY_ID(id)}/hide`
    );
    return response.data.data;
  },
};

export default commentService;
