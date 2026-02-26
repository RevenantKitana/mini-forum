/**
 * AuthContext Tests
 *
 * Tests the AuthContext state management by mocking the API service layer.
 * vi.mock() intercepts API calls so tests are fast, deterministic, and
 * independent of VITE_USE_MOCK_API or a running backend.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ─── Mock API modules (must run before importing AuthContext) ─────────────────
vi.mock('@/api/services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('@/api/axios', () => ({
  default: {},
  getAccessToken: vi.fn().mockReturnValue(null),
  clearTokens: vi.fn(),
  setTokens: vi.fn(),
}));

vi.mock('@/api/services/userService', () => ({
  updateProfile: vi.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as authApi from '@/api/services/authService';
import * as axiosMod from '@/api/axios';

// ─── Shared fixtures ──────────────────────────────────────────────────────────
const mockAdminUser = {
  id: 1,
  email: 'admin@forum.com',
  username: 'admin',
  displayName: 'Administrator',
  avatarUrl: null,
  role: 'admin',
  reputation: 1000,
  isVerified: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

/** Render the hook and wait for the initial async initAuth to complete */
async function setup() {
  const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
  // Wait for isLoading=false — handles both sync and async initAuth paths
  await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: no active token → unauthenticated start
    vi.mocked(axiosMod.getAccessToken).mockReturnValue(null);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  describe('Initial state', () => {
    it('should start unauthenticated when no token exists', async () => {
      const result = await setup();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should fetch and set user when a valid token exists on mount', async () => {
      vi.mocked(axiosMod.getAccessToken).mockReturnValue('valid-token');
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockAdminUser as any);

      const result = await setup();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('admin@forum.com');
    });

    it('should clear tokens and stay unauthenticated when API returns 401 on mount', async () => {
      vi.mocked(axiosMod.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(authApi.getCurrentUser).mockRejectedValue({
        response: { status: 401 },
      });

      const result = await setup();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(axiosMod.clearTokens).toHaveBeenCalled();
    });
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should set authenticated state after successful login', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAdminUser as any);
      const result = await setup();

      await act(async () => {
        await result.current.login('admin@forum.com', 'Admin@123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('admin@forum.com');
      expect(result.current.user?.username).toBe('admin');
    });

    it('should call authApi.login with identifier and password', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAdminUser as any);
      const result = await setup();

      await act(async () => {
        await result.current.login('admin@forum.com', 'Admin@123');
      });

      expect(authApi.login).toHaveBeenCalledWith({
        identifier: 'admin@forum.com',
        password: 'Admin@123',
      });
    });

    it('should remain unauthenticated and throw on failed login', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));
      const result = await setup();

      await expect(
        act(async () => {
          await result.current.login('wrong@email.com', 'wrongpass');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should persist user to localStorage after successful login', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockAdminUser as any);
      const result = await setup();

      await act(async () => {
        await result.current.login('admin@forum.com', 'Admin@123');
      });

      const stored = localStorage.getItem('forum_auth_user');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).email).toBe('admin@forum.com');
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    beforeEach(() => {
      vi.mocked(authApi.login).mockResolvedValue(mockAdminUser as any);
      vi.mocked(authApi.logout).mockResolvedValue(undefined as any);
    });

    it('should clear user and isAuthenticated after logout', async () => {
      const result = await setup();

      await act(async () => {
        await result.current.login('admin@forum.com', 'Admin@123');
      });
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should remove user from localStorage after logout', async () => {
      const result = await setup();

      await act(async () => { await result.current.login('admin@forum.com', 'Admin@123'); });
      await act(async () => { await result.current.logout(); });

      expect(localStorage.getItem('forum_auth_user')).toBeNull();
    });

    it('should call clearTokens on logout', async () => {
      const result = await setup();

      await act(async () => { await result.current.login('admin@forum.com', 'Admin@123'); });
      await act(async () => { await result.current.logout(); });

      expect(axiosMod.clearTokens).toHaveBeenCalled();
    });
  });

  // ─── register() ────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('should set authenticated state after successful registration', async () => {
      const newUser = { ...mockAdminUser, id: 99, username: 'newuser', email: 'new@example.com' };
      vi.mocked(authApi.register).mockResolvedValue(newUser as any);
      const result = await setup();

      await act(async () => {
        await result.current.register('newuser', 'new@example.com', 'Pass@123', 'New User');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.username).toBe('newuser');
    });

    it('should throw and remain unauthenticated when registration fails', async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error('Email already exists'));
      const result = await setup();

      await expect(
        act(async () => {
          await result.current.register('admin2', 'admin@forum.com', 'Pass@123');
        })
      ).rejects.toThrow('Email already exists');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ─── useAuth guard ─────────────────────────────────────────────────────────

  describe('useAuth() guard', () => {
    it('should throw a descriptive error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow(/useAuth must be used within an AuthProvider/);

      consoleSpy.mockRestore();
    });
  });
});
