import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/services/authService';
import * as userService from '@/api/services/userService';
import { getAccessToken, clearTokens } from '@/api/axios';

// Use mock data for development when backend is not available
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// User type compatible with both mock and real API
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl?: string | null;
  avatar?: string; // For backward compatibility with mock
  role: string;
  bio?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  reputation: number;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for development
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@forum.com',
    username: 'admin',
    displayName: 'Administrator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    role: 'ADMIN',
    reputation: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'mod@forum.com',
    username: 'moderator',
    displayName: 'Moderator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mod',
    role: 'MODERATOR',
    reputation: 500,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    email: 'john@example.com',
    username: 'johndoe',
    displayName: 'John Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    role: 'MEMBER',
    reputation: 100,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'forum_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Transform API user to local user format
  const transformUser = (apiUser: authApi.AuthUser): User => ({
    id: apiUser.id,
    username: apiUser.username,
    displayName: apiUser.displayName,
    email: apiUser.email,
    avatarUrl: apiUser.avatarUrl,
    avatar: apiUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser.username}`,
    role: apiUser.role,
    reputation: apiUser.reputation,
    isVerified: apiUser.isVerified,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
  });

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (USE_MOCK_API) {
          // Mock: load from localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const userData = JSON.parse(stored);
            setUser(userData);
          }
        } else {
          // Real API: check token and get user
          const token = getAccessToken();
          if (token) {
            try {
              const apiUser = await authApi.getCurrentUser();
              const userData = transformUser(apiUser);
              setUser(userData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            } catch (apiError: any) {
              // If 401 (Unauthorized), silently clear tokens - this is expected for expired/invalid tokens
              if (apiError?.response?.status === 401) {
                clearTokens();
                localStorage.removeItem(STORAGE_KEY);
                // Don't log error - this is expected behavior
              } else if (apiError?.response?.status === 429) {
                // If 429 (rate limited), try to recover from localStorage
                console.warn('Rate limited during auth init, using cached user data');
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                  setUser(JSON.parse(cached));
                } else {
                  clearTokens();
                }
              } else {
                // Other errors - clear auth and log
                throw apiError;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearTokens();
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (identifier: string, password: string) => {
    if (USE_MOCK_API) {
      // Mock login - supports email or username
      await new Promise((resolve) => setTimeout(resolve, 500));
      const foundUser = mockUsers.find((u) => u.email === identifier || u.username === identifier);
      if (!foundUser) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
      setUser(foundUser);
    } else {
      // Real API login - supports email or username
      const apiUser = await authApi.login({ identifier, password });
      const userData = transformUser(apiUser);
      setUser(userData);
    }
  };

  const register = async (username: string, email: string, password: string, displayName?: string, registrationToken?: string) => {
    if (USE_MOCK_API) {
      // Mock register
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existingUser = mockUsers.find((u) => u.email === email || u.username === username);
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      const newUser: User = {
        id: Date.now(),
        username,
        email,
        displayName: displayName || username,
        role: 'member',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        reputation: 0,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      setUser(newUser);
    } else {
      // Real API register - include displayName
      const apiUser = await authApi.register({ email, username, password, displayName, registrationToken });
      const userData = transformUser(apiUser);
      setUser(userData);
    }
  };

  const logout = useCallback(async () => {
    if (!USE_MOCK_API) {
      await authApi.logout();
    }
    clearTokens();
    setUser(null);
  }, []);

  const updateProfile = async (data: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    if (USE_MOCK_API) {
      // Mock mode: just update local state
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    } else {
      // Real API call
      const updateData: userService.UpdateProfileData = {
        displayName: data.displayName ?? undefined,
        bio: data.bio ?? undefined,
        dateOfBirth: data.dateOfBirth ?? undefined,
        gender: data.gender ?? undefined,
      };
      await userService.updateProfile(user.id as number, updateData);
      // Refresh user data from server
      await refreshUser();
    }
  };

  const refreshUser = useCallback(async () => {
    if (USE_MOCK_API) return;
    
    try {
      const apiUser = await authApi.getCurrentUser();
      const userData = transformUser(apiUser);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      <InvalidationHandler user={user} />
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Internal component to handle React Query invalidation when auth state changes
 * This ensures users don't see cached data from previous user sessions
 * Fixes permission/cache issue where guest users could see admin-cached posts
 */
function InvalidationHandler({ user }: { user: User | null }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // When user login/logout status or role changes, invalidate all posts-related queries
    // This prevents showing cached data from another user's session
    // Especially important for permission-based content (viewPermission filters)
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['search'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [user?.id, user?.role, queryClient]);

  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
