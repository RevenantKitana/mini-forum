import test from 'node:test';
import assert from 'node:assert/strict';
import { APIExecutorService } from '../services/APIExecutorService.js';

test('APIExecutorService handles auth response with top-level accessToken', async () => {
  const executor = new APIExecutorService();
  
  // Mock client.post to simulate modern backend /auth/login response
  (executor as any).client.post = async (url: string, data: any) => {
    if (url === '/auth/login') {
      return {
        status: 200,
        headers: {
          'set-cookie': ['refresh_token=sample-refresh-token; Path=/api/v1/auth; HttpOnly'],
        },
        data: {
          success: true,
          message: 'Login successful',
          data: {
            user: { id: 1, email: data.identifier },
            accessToken: 'sample-access-token-123',
          },
        },
      };
    }
    throw new Error(`Unexpected url: ${url}`);
  };

  const token = await (executor as any).getToken(1, 'bot1@example.com');
  assert.equal(token, 'sample-access-token-123');

  const cached = (executor as any).tokenCache.get(1);
  assert.ok(cached);
  assert.equal(cached.accessToken, 'sample-access-token-123');
  assert.equal(cached.refreshToken, 'sample-refresh-token');
});

test('APIExecutorService handles refresh token rotation with top-level accessToken', async () => {
  const executor = new APIExecutorService();
  
  // Seed cached token with expired/near-expiry time
  (executor as any).tokenCache.set(1, {
    accessToken: 'old-access-token',
    refreshToken: 'old-refresh-token',
    expiresAt: Date.now() - 1000,
  });

  (executor as any).client.post = async (url: string, data: any) => {
    if (url === '/auth/refresh') {
      assert.equal(data.refreshToken, 'old-refresh-token');
      return {
        status: 200,
        headers: {
          'set-cookie': ['refresh_token=new-rotated-refresh-token; Path=/api/v1/auth; HttpOnly'],
        },
        data: {
          success: true,
          message: 'Token refreshed successfully',
          data: {
            accessToken: 'new-access-token-456',
          },
        },
      };
    }
    throw new Error(`Unexpected url: ${url}`);
  };

  const token = await (executor as any).getToken(1, 'bot1@example.com');
  assert.equal(token, 'new-access-token-456');

  const cached = (executor as any).tokenCache.get(1);
  assert.ok(cached);
  assert.equal(cached.accessToken, 'new-access-token-456');
  assert.equal(cached.refreshToken, 'new-rotated-refresh-token');
});
