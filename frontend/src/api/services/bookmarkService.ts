import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Post, PaginatedResponse } from '@/types';

// Types
export interface BookmarkStatus {
  bookmarked: boolean;
}

export interface BookmarkedPost extends Post {
  bookmarkedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

/**
 * Get user's bookmarks
 */
export async function getUserBookmarks(
  userId: number,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<BookmarkedPost>> {
  const response = await apiClient.get<PaginatedApiResponse<BookmarkedPost>>(
    `/users/${userId}/bookmarks`,
    { params: { page, limit } }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Check if a post is bookmarked
 */
export async function checkBookmark(postId: number): Promise<boolean> {
  const response = await apiClient.get<ApiResponse<BookmarkStatus>>(
    API_ENDPOINTS.BOOKMARKS.BY_POST(postId)
  );
  return response.data.data.bookmarked;
}

/**
 * Add bookmark to a post
 */
export async function addBookmark(postId: number): Promise<void> {
  await apiClient.post(API_ENDPOINTS.BOOKMARKS.BY_POST(postId));
}

/**
 * Remove bookmark from a post
 */
export async function removeBookmark(postId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.BOOKMARKS.BY_POST(postId));
}

/**
 * Toggle bookmark on a post
 */
export async function toggleBookmark(postId: number): Promise<BookmarkStatus> {
  const response = await apiClient.patch<ApiResponse<BookmarkStatus>>(
    API_ENDPOINTS.BOOKMARKS.BY_POST(postId)
  );
  return response.data.data;
}
