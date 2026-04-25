/**
 * Centralized image URL helpers.
 *
 * Always use these helpers instead of accessing avatar URL fields directly.
 */

export interface AvatarUser {
  avatar_preview_url?: string | null;
  avatar_standard_url?: string | null;
}

export interface PostMedia {
  id: number;
  preview_url: string;
  standard_url: string;
  sort_order: number;
}

/**
 * Resolve the best available avatar URL for a user.
 *
 * @param user   Any object that may have avatar URL fields.
 * @param size   'preview'  → 300×300 webp (feeds, comments)
 *               'standard' → max-width 1200 webp (profile page)
 */
export function getAvatarUrl(
  user: AvatarUser | null | undefined,
  size: 'preview' | 'standard' = 'preview',
): string | null {
  if (!user) return null;

  if (size === 'preview' && user.avatar_preview_url) {
    return user.avatar_preview_url;
  }
  if (size === 'standard' && user.avatar_standard_url) {
    return user.avatar_standard_url;
  }

  return null;
}

/**
 * Resolve the best available URL for a post-media item.
 *
 * @param media  A single PostMedia record.
 * @param size   'preview'  → 300×300 webp thumbnail
 *               'standard' → full-size display image
 */
export function getPostMediaUrl(
  media: PostMedia | null | undefined,
  size: 'preview' | 'standard' = 'standard',
): string | null {
  if (!media) return null;
  return size === 'preview' ? media.preview_url : media.standard_url;
}

/**
 * Build a basic srcSet string for responsive images.
 * Assumes the URL is an ImageKit URL that supports `tr=` transformations.
 *
 * Example output:
 *   "https://ik.imagekit.io/x/img.jpg?tr=w-300 300w, https://ik.imagekit.io/x/img.jpg?tr=w-600 600w"
 */
export function buildImageSrcSet(url: string | null | undefined, widths = [300, 600, 900]): string {
  if (!url) return '';
  return widths
    .map((w) => {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}tr=w-${w} ${w}w`;
    })
    .join(', ');
}
