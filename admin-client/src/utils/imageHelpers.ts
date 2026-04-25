/**
 * Centralized image URL helpers for admin-client.
 */

export interface AvatarUser {
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
}

/**
 * Resolve the best available avatar URL for a user.
 */
export function getAvatarUrl(
  user: AvatarUser | null | undefined,
  size: 'preview' | 'standard' = 'preview',
): string | null {
  if (!user) return null;
  if (size === 'preview' && user.avatar_preview_url) return user.avatar_preview_url;
  if (size === 'standard' && user.avatar_standard_url) return user.avatar_standard_url;
  return null;
}
