import apiClient, { setTokens, clearTokens } from '../axios';
import { API_ENDPOINTS } from '../endpoints';

// Types
export interface AuthUser {
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

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthUser> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    {
      email: data.email,
      username: data.username,
      password: data.password,
      display_name: data.displayName,
    }
  );
  
  const { user, tokens } = response.data.data;
  setTokens(tokens.accessToken, tokens.refreshToken);
  
  return user;
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  
  const { user, tokens } = response.data.data;
  setTokens(tokens.accessToken, tokens.refreshToken);
  
  return user;
}

/**
 * Logout user
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
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>(API_ENDPOINTS.AUTH.ME);
  return response.data.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    API_ENDPOINTS.AUTH.REFRESH,
    { refreshToken }
  );
  return response.data.data;
}
