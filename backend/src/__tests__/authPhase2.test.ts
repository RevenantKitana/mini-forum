import { describe, it, expect, vi } from 'vitest';
import * as authService from '../services/authService.js';
import prisma from '../config/database.js';

describe('Phase 2 Auth Security: Dọn dẹp PII & AuthUserDTO Standardization', () => {
  it('should return AuthUserDTO with only non-PII fields from getCurrentUser', async () => {
    const mockDbUser = {
      id: 42,
      username: 'johndoe',
      display_name: 'John Doe',
      avatar_preview_url: 'https://ik.imagekit.io/preview.jpg',
      avatar_standard_url: 'https://ik.imagekit.io/standard.jpg',
      role: 'MEMBER',
    };

    vi.spyOn(prisma.users, 'findUnique').mockResolvedValueOnce(mockDbUser as any);

    const user = await authService.getCurrentUser(42);

    // Verify allowed fields exist
    expect(user).toEqual({
      id: 42,
      username: 'johndoe',
      display_name: 'John Doe',
      avatar_preview_url: 'https://ik.imagekit.io/preview.jpg',
      avatar_standard_url: 'https://ik.imagekit.io/standard.jpg',
      role: 'MEMBER',
    });

    // Verify PII fields are strictly undefined
    expect((user as any).email).toBeUndefined();
    expect((user as any).date_of_birth).toBeUndefined();
    expect((user as any).gender).toBeUndefined();
    expect((user as any).bio).toBeUndefined();
    expect((user as any).password_hash).toBeUndefined();
  });
});
