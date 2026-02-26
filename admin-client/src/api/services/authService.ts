import apiClient, { setTokens, clearTokens } from '../axios';
import { API_ENDPOINTS } from '../endpoints';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  reputation: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

interface MeResponse {
  success: boolean;
  message: string;
  data: AdminUser;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AdminUser> {
  const response = await apiClient.post<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );

  const { user, tokens } = response.data.data;
  const { accessToken, refreshToken } = tokens;

  // Check if user is admin or moderator
  const role = user.role.toLowerCase();
  if (role !== 'admin' && role !== 'moderator') {
    throw new Error('Access denied. Admin or Moderator role required.');
  }

  // Store tokens
  setTokens(accessToken, refreshToken);
  localStorage.setItem('admin_user', JSON.stringify(user));

  return user;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AdminUser> {
  const response = await apiClient.get<MeResponse>(API_ENDPOINTS.AUTH.ME);
  return response.data.data;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    // Ignore errors on logout
  } finally {
    clearTokens();
  }
}

/**
 * Check if stored user is admin/moderator
 */
export function getStoredUser(): AdminUser | null {
  const stored = localStorage.getItem('admin_user');
  if (!stored) return null;

  try {
    const user = JSON.parse(stored) as AdminUser;
    const role = user.role.toLowerCase();
    if (role !== 'admin' && role !== 'moderator') {
      clearTokens();
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
