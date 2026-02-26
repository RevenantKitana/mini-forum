import apiClient from '../axios';
import { Post, PaginatedResponse } from '@/types';

// Types
export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  status: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
    reputation: number;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    color: string | null;
  };
  tags: {
    id: number;
    name: string;
    slug: string;
  }[];
}

export interface SearchUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  reputation: number;
  createdAt: string;
}

export interface SearchSuggestions {
  posts: {
    id: number;
    title: string;
    slug: string;
  }[];
  tags: {
    id: number;
    name: string;
    slug: string;
    usageCount: number;
  }[];
}

export interface SearchParams {
  q: string;
  category?: string;
  tag?: string;
  author?: string;
  page?: number;
  limit?: number;
  sort?: 'latest' | 'popular' | 'trending' | 'oldest' | 'relevance';
}

interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Search posts
 */
export async function searchPosts(params: SearchParams): Promise<PaginatedResponse<SearchResult>> {
  const response = await apiClient.get<PaginatedApiResponse<SearchResult>>('/search', { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Search users
 */
export async function searchUsers(
  q: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<SearchUser>> {
  const response = await apiClient.get<PaginatedApiResponse<SearchUser>>('/search/users', {
    params: { q, page, limit },
  });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(q: string, limit = 5): Promise<SearchSuggestions> {
  const response = await apiClient.get<ApiResponse<SearchSuggestions>>('/search/suggestions', {
    params: { q, limit },
  });
  return response.data.data;
}
