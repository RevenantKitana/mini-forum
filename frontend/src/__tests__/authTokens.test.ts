import { describe, it, expect, beforeEach } from 'vitest';
import apiClient, {
  setAccessToken,
  getAccessToken,
  clearTokens,
  setTokens,
} from '../api/axios';

describe('Phase 1 Auth Security: In-Memory Token & Cookie Configuration', () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
  });

  it('should store and retrieve access token strictly in memory (RAM), not in localStorage', () => {
    setAccessToken('test-access-token-123');

    // In-memory getter should return the token
    expect(getAccessToken()).toBe('test-access-token-123');

    // LocalStorage should NOT have any access token or refresh token
    expect(localStorage.getItem('forum_access_token')).toBeNull();
    expect(localStorage.getItem('forum_refresh_token')).toBeNull();
  });

  it('should clear in-memory token and remove any residual localStorage items on clearTokens', () => {
    setAccessToken('test-access-token-456');
    localStorage.setItem('forum_access_token', 'legacy-access');
    localStorage.setItem('forum_refresh_token', 'legacy-refresh');

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('forum_access_token')).toBeNull();
    expect(localStorage.getItem('forum_refresh_token')).toBeNull();
  });

  it('should support backward-compatible setTokens by saving to RAM and purging localStorage', () => {
    localStorage.setItem('forum_access_token', 'old');
    localStorage.setItem('forum_refresh_token', 'old');

    setTokens('new-ram-access-token', 'ignored-refresh-token');

    expect(getAccessToken()).toBe('new-ram-access-token');
    expect(localStorage.getItem('forum_access_token')).toBeNull();
    expect(localStorage.getItem('forum_refresh_token')).toBeNull();
  });

  it('should have withCredentials enabled on apiClient instance for HttpOnly cookie exchange', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
