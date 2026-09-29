import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Validate API URL - required for production, optional for dev
const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  
  if (!url && import.meta.env.MODE === 'production') {
    throw new Error('❌ VITE_API_URL environment variable must be set for production builds. Check .env.example for setup.');
  }
  
  return url || 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiUrl();

// Legacy storage keys for cleanup
const LEGACY_ACCESS_TOKEN_KEY = 'forum_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'forum_refresh_token';
const LEGACY_USER_KEYS = ['forum_auth_user', 'forum_user', 'user'];

// In-memory token storage (RAM only, protected against XSS reading localStorage)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

// Backward-compatible helper that updates in-memory token and cleans legacy localStorage keys
export const setTokens = (accessToken: string, _refreshToken?: string): void => {
  setAccessToken(accessToken);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  LEGACY_USER_KEYS.forEach(key => localStorage.removeItem(key));
};

export const clearTokens = (): void => {
  inMemoryAccessToken = null;
  // Clean up any legacy tokens and cached user data left in localStorage
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  LEGACY_USER_KEYS.forEach(key => localStorage.removeItem(key));
};

// Create Axios instance with HttpOnly cookie support
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Crucial: enables automatic transmission of HttpOnly cookies
});

// Flag to prevent multiple concurrent refresh requests
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - attach access token from in-memory RAM
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh & rate limiting
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 429 (Too Many Requests) - implement exponential backoff
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Wait 2 seconds before retrying rate-limited requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return apiClient(originalRequest);
    }

    // Identify auth endpoints to avoid infinite refresh loops
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/send-otp') ||
      originalRequest.url?.includes('/auth/verify-otp') ||
      originalRequest.url?.includes('/auth/reset-password');

    // Check if error is 401 and request has not already been retried
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint - HttpOnly cookie is attached automatically via withCredentials
        const response = await axios.post<{ data: { accessToken: string } }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Refresh response did not contain access token');
        }

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
