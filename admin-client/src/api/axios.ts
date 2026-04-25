import axios from 'axios';

// Validate API URL - required for production, optional for dev
const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  
  if (!url && import.meta.env.MODE === 'production') {
    throw new Error('❌ VITE_API_URL environment variable must be set for production builds. Check .env.example for setup.');
  }
  
  return url || 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors, rate limiting and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 (Too Many Requests) - retry after delay
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return apiClient(originalRequest);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('admin_access_token', accessToken);
          localStorage.setItem('admin_refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token management
export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('admin_access_token', accessToken);
  localStorage.setItem('admin_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
}

export function getAccessToken() {
  return localStorage.getItem('admin_access_token');
}

export default apiClient;
