import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from '../services/authService.js';
import prisma from '../config/database.js';
import * as jwtUtils from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import crypto from 'node:crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('Phase 3 Auth Security: Refresh Token Rotation (RTR) & Reuse Detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully rotate refresh token and preserve family_id while marking old token as revoked', async () => {
    const userId = 101;
    const initialFamilyId = 'family-uuid-123';
    const oldRefreshToken = 'valid.jwt.refreshToken1';
    const oldTokenHash = hashToken(oldRefreshToken);

    const mockPayload: jwtUtils.TokenPayload = {
      userId,
      email: 'user@example.com',
      role: 'MEMBER',
    };

    // Mock JWT verification
    vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(mockPayload);

    // Mock stored active token
    const storedToken = {
      id: 1,
      token: oldTokenHash,
      user_id: userId,
      family_id: initialFamilyId,
      is_revoked: false,
      expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1 hour ahead
      created_at: new Date(),
    };
    vi.spyOn(prisma.refresh_tokens, 'findUnique').mockResolvedValue(storedToken as any);

    // Mock active user
    vi.spyOn(prisma.users, 'findUnique').mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      role: 'MEMBER',
      is_active: true,
    } as any);

    // Mock token pair generation
    const newTokens = {
      accessToken: 'new.jwt.accessToken',
      refreshToken: 'new.jwt.refreshToken2',
    };
    vi.spyOn(jwtUtils, 'generateTokenPair').mockReturnValue(newTokens);

    // Mock prisma.$transaction
    let updateData: any = null;
    let createData: any = null;
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callbacks: any) => {
      // Return mock result of transaction
      return callbacks;
    });

    const updateSpy = vi.spyOn(prisma.refresh_tokens, 'update').mockImplementation((args: any) => {
      updateData = args;
      return Promise.resolve(args) as any;
    });

    const createSpy = vi.spyOn(prisma.refresh_tokens, 'create').mockImplementation((args: any) => {
      createData = args;
      return Promise.resolve(args) as any;
    });

    const result = await authService.refreshAccessToken(oldRefreshToken);

    expect(result).toEqual(newTokens);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: storedToken.id },
      data: { is_revoked: true },
    });
    expect(createSpy).toHaveBeenCalledWith({
      data: {
        token: hashToken(newTokens.refreshToken),
        user_id: userId,
        family_id: initialFamilyId,
        is_revoked: false,
        expires_at: expect.any(Date),
      },
    });
  });

  it('SEC-04: should detect reuse of revoked token, wipe ALL tokens of the user, and throw 401 Unauthorized', async () => {
    const userId = 101;
    const stolenOldRefreshToken = 'stolen.jwt.revokedRefreshToken';
    const stolenTokenHash = hashToken(stolenOldRefreshToken);

    const mockPayload: jwtUtils.TokenPayload = {
      userId,
      email: 'user@example.com',
      role: 'MEMBER',
    };

    vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue(mockPayload);

    // Stored token is already revoked!
    const revokedToken = {
      id: 1,
      token: stolenTokenHash,
      user_id: userId,
      family_id: 'family-uuid-123',
      is_revoked: true, // ALREADY REVOKED!
      expires_at: new Date(Date.now() + 1000 * 60 * 60),
      created_at: new Date(),
    };
    vi.spyOn(prisma.refresh_tokens, 'findUnique').mockResolvedValue(revokedToken as any);

    const deleteManySpy = vi.spyOn(prisma.refresh_tokens, 'deleteMany').mockResolvedValue({ count: 5 } as any);

    await expect(authService.refreshAccessToken(stolenOldRefreshToken)).rejects.toThrow(UnauthorizedError);

    // Verify all tokens belonging to the user are wiped out immediately
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { user_id: userId },
    });
  });

  it('should reject refresh if token is not found in database', async () => {
    const fakeToken = 'nonexistent.jwt.token';
    vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue({
      userId: 101,
      email: 'user@example.com',
      role: 'MEMBER',
    });

    vi.spyOn(prisma.refresh_tokens, 'findUnique').mockResolvedValue(null);

    await expect(authService.refreshAccessToken(fakeToken)).rejects.toThrow(UnauthorizedError);
  });

  it('should reject refresh if token is expired', async () => {
    const expiredToken = 'expired.jwt.token';
    vi.spyOn(jwtUtils, 'verifyRefreshToken').mockReturnValue({
      userId: 101,
      email: 'user@example.com',
      role: 'MEMBER',
    });

    const storedExpiredToken = {
      id: 99,
      token: hashToken(expiredToken),
      user_id: 101,
      family_id: 'family-xyz',
      is_revoked: false,
      expires_at: new Date(Date.now() - 10000), // Expired in past
    };
    vi.spyOn(prisma.refresh_tokens, 'findUnique').mockResolvedValue(storedExpiredToken as any);
    const deleteSpy = vi.spyOn(prisma.refresh_tokens, 'delete').mockResolvedValue({} as any);

    await expect(authService.refreshAccessToken(expiredToken)).rejects.toThrow(UnauthorizedError);
    expect(deleteSpy).toHaveBeenCalledWith({
      where: { id: storedExpiredToken.id },
    });
  });

  it('logout should invalidate the entire token family session', async () => {
    const token = 'active.jwt.token';
    const hashed = hashToken(token);

    vi.spyOn(prisma.refresh_tokens, 'findUnique').mockResolvedValue({
      id: 5,
      token: hashed,
      user_id: 101,
      family_id: 'family-session-456',
      is_revoked: false,
    } as any);

    const deleteManySpy = vi.spyOn(prisma.refresh_tokens, 'deleteMany').mockResolvedValue({ count: 2 } as any);

    await authService.logout(token);

    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { family_id: 'family-session-456' },
    });
  });
});
