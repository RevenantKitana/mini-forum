import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as authService from '@/api/services/authService';
import { getAccessToken, clearTokens } from '@/api/axios';

export interface User {
  id: number;
  username: string;
  display_name: string | null;
  email: string;
  avatar_url?: string | null;
  role: string;
  reputation: number;
  is_verified?: boolean;
  is_active?: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          // Try to get stored user first
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
          
          // Verify with API
          try {
            const apiUser = await authService.getCurrentUser();
            const role = apiUser.role?.toUpperCase();
            if (role === 'ADMIN' || role === 'MODERATOR') {
              setUser(apiUser);
              localStorage.setItem('admin_user', JSON.stringify(apiUser));
            } else {
              clearTokens();
              setUser(null);
            }
          } catch {
            // If API fails but we have stored user, keep it
            if (!storedUser) {
              clearTokens();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
  };

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await authService.getCurrentUser();
      const role = apiUser.role?.toUpperCase();
      if (role === 'ADMIN' || role === 'MODERATOR') {
        setUser(apiUser);
        localStorage.setItem('admin_user', JSON.stringify(apiUser));
      } else {
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isModerator,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
