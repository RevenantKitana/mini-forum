import apiClient from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { User, PaginatedResponse } from '@/types';

// Extended User type with additional fields
export interface UserProfile extends User {
  postCount: number;
  commentCount: number;
  isBlockedByMe?: boolean;
  lastActiveAt?: string | null;
}

export interface UserPost {
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
  upvoteCount: number;
  downvoteCount: number;
  status: string;
  createdAt: string;
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
 * Update avatar
 */
export async function updateAvatar(userId: number, avatarUrl: string): Promise<UserProfile> {
  const response = await apiClient.patch<ApiResponse<UserProfile>>(
    `${API_ENDPOINTS.USERS.BY_ID(userId)}/avatar`,
    { avatar_url: avatarUrl }
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
