import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { User, PaginatedResponse } from '@/types';

// Extended User type with additional fields
export interface UserProfile extends User {
  post_count: number;
  comment_count: number;
  is_blocked_by_me?: boolean;
  last_active_at?: string | null;
}

export interface UserPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  status: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
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

export interface UserComment {
  id: number;
  content: string;
  upvote_count: number;
  downvote_count: number;
  status: string;
  created_at: string;
  post: {
    id: number;
    title: string;
    slug: string;
  };
}

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
 * Get user profile by ID
 */
export async function getUserById(id: number): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<UserProfile>>(
    API_ENDPOINTS.USERS.BY_ID(id)
  );
  return response.data.data;
}

/**
 * Get user profile by username
 */
export async function getUserByUsername(username: string): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<UserProfile>>(
    API_ENDPOINTS.USERS.BY_USERNAME(username)
  );
  return response.data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: number, data: UpdateProfileData): Promise<UserProfile> {
  const response = await apiClient.put<ApiResponse<UserProfile>>(
    API_ENDPOINTS.USERS.BY_ID(userId),
    {
      display_name: data.display_name,
      bio: data.bio,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
    }
  );
  return response.data.data;
}

/**
 * Change username
 */
export async function changeUsername(userId: number, username: string): Promise<UserProfile> {
  const response = await apiClient.patch<ApiResponse<UserProfile>>(
    `${API_ENDPOINTS.USERS.BY_ID(userId)}/username`,
    { username }
  );
  return response.data.data;
}

/**
 * Change password
 */
export async function changePassword(userId: number, data: ChangePasswordData): Promise<void> {
  await apiClient.patch(`${API_ENDPOINTS.USERS.BY_ID(userId)}/password`, data);
}

/**
 * Upload avatar via multipart/form-data (Phase 5)
 * @param formData must contain a 'file' field (max 5 MB, jpeg/png/webp)
 */
export async function uploadAvatar(userId: number, formData: FormData): Promise<UserProfile> {
  const response = await apiClient.post<ApiResponse<UserProfile>>(
    API_ENDPOINTS.USERS.AVATAR_UPLOAD(userId),
    formData,
  );
  return response.data.data;
}

/**
 * Get user's posts
 */
export async function getUserPosts(
  userId: number,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<UserPost>> {
  const response = await apiClient.get<PaginatedApiResponse<UserPost>>(
    `${API_ENDPOINTS.USERS.BY_ID(userId)}/posts`,
    { params: { page, limit } }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Get user's comments
 */
export async function getUserComments(
  userId: number,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<UserComment>> {
  const response = await apiClient.get<PaginatedApiResponse<UserComment>>(
    `${API_ENDPOINTS.USERS.BY_ID(userId)}/comments`,
    { params: { page, limit } }
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}
