import { describe, it, expect } from 'vitest';
import {
  getAvatarUrl,
  getPostMediaUrl,
  buildImageSrcSet,
  type AvatarUser,
  type PostMedia,
} from '../utils/imageHelpers';

// ---------------------------------------------------------------------------
describe('getAvatarUrl', () => {
  describe('returns null for missing/empty user', () => {
    it('returns null when user is null', () => {
      expect(getAvatarUrl(null)).toBeNull();
    });

    it('returns null when user is undefined', () => {
      expect(getAvatarUrl(undefined)).toBeNull();
    });
  });

  describe('preview size (default)', () => {
    it('returns avatar_preview_url when present', () => {
      const user: AvatarUser = {
        avatar_preview_url: 'https://ik.imagekit.io/x/avatars/a.jpg?tr=w-300',
        avatar_standard_url: 'https://ik.imagekit.io/x/avatars/a.jpg?tr=w-1200',
      };
      expect(getAvatarUrl(user, 'preview')).toBe(user.avatar_preview_url);
    });

    it('returns null when only avatar_standard_url is set (no preview fallback)', () => {
      const user: AvatarUser = {
        avatar_preview_url: null,
        avatar_standard_url: 'https://ik.imagekit.io/x/avatars/a.jpg?tr=w-1200',
      };
      expect(getAvatarUrl(user, 'preview')).toBeNull();
    });

    it('returns null when both fields are null', () => {
      const user: AvatarUser = { avatar_preview_url: null, avatar_standard_url: null };
      expect(getAvatarUrl(user, 'preview')).toBeNull();
    });

    it('defaults to preview size when no size argument given', () => {
      const user: AvatarUser = {
        avatar_preview_url: 'https://ik.imagekit.io/x/preview.jpg',
        avatar_standard_url: 'https://ik.imagekit.io/x/standard.jpg',
      };
      expect(getAvatarUrl(user)).toBe('https://ik.imagekit.io/x/preview.jpg');
    });
  });

  describe('standard size', () => {
    it('returns avatar_standard_url when present', () => {
      const user: AvatarUser = {
        avatar_preview_url: 'https://ik.imagekit.io/x/preview.jpg',
        avatar_standard_url: 'https://ik.imagekit.io/x/standard.jpg',
      };
      expect(getAvatarUrl(user, 'standard')).toBe('https://ik.imagekit.io/x/standard.jpg');
    });

    it('returns null when only avatar_preview_url is set (no standard fallback)', () => {
      const user: AvatarUser = {
        avatar_preview_url: 'https://ik.imagekit.io/x/preview.jpg',
        avatar_standard_url: null,
      };
      expect(getAvatarUrl(user, 'standard')).toBeNull();
    });
  });

  describe('partial user objects', () => {
    it('works when fields are undefined (not just null)', () => {
      const user: AvatarUser = {};
      expect(getAvatarUrl(user, 'preview')).toBeNull();
      expect(getAvatarUrl(user, 'standard')).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
describe('getPostMediaUrl', () => {
  const media: PostMedia = {
    id: 1,
    preview_url: 'https://ik.imagekit.io/x/posts/img.jpg?tr=w-300',
    standard_url: 'https://ik.imagekit.io/x/posts/img.jpg?tr=w-1200',
    sort_order: 0,
  };

  it('returns null for null media', () => {
    expect(getPostMediaUrl(null)).toBeNull();
  });

  it('returns null for undefined media', () => {
    expect(getPostMediaUrl(undefined)).toBeNull();
  });

  it('returns standard_url by default', () => {
    expect(getPostMediaUrl(media)).toBe(media.standard_url);
  });

  it('returns preview_url when size is preview', () => {
    expect(getPostMediaUrl(media, 'preview')).toBe(media.preview_url);
  });

  it('returns standard_url when size is standard', () => {
    expect(getPostMediaUrl(media, 'standard')).toBe(media.standard_url);
  });
});

// ---------------------------------------------------------------------------
describe('buildImageSrcSet', () => {
  it('returns empty string for null url', () => {
    expect(buildImageSrcSet(null)).toBe('');
  });

  it('returns empty string for undefined url', () => {
    expect(buildImageSrcSet(undefined)).toBe('');
  });

  it('builds srcSet with default widths [300, 600, 900]', () => {
    const url = 'https://ik.imagekit.io/x/img.jpg';
    const result = buildImageSrcSet(url);
    expect(result).toBe(
      'https://ik.imagekit.io/x/img.jpg?tr=w-300 300w, ' +
      'https://ik.imagekit.io/x/img.jpg?tr=w-600 600w, ' +
      'https://ik.imagekit.io/x/img.jpg?tr=w-900 900w',
    );
  });

  it('uses & separator when URL already has query params', () => {
    const url = 'https://ik.imagekit.io/x/img.jpg?f=webp';
    const result = buildImageSrcSet(url, [400, 800]);
    expect(result).toBe(
      'https://ik.imagekit.io/x/img.jpg?f=webp&tr=w-400 400w, ' +
      'https://ik.imagekit.io/x/img.jpg?f=webp&tr=w-800 800w',
    );
  });

  it('uses custom widths array', () => {
    const url = 'https://ik.imagekit.io/x/img.jpg';
    const result = buildImageSrcSet(url, [200, 400]);
    expect(result).toBe(
      'https://ik.imagekit.io/x/img.jpg?tr=w-200 200w, ' +
      'https://ik.imagekit.io/x/img.jpg?tr=w-400 400w',
    );
  });

  it('returns empty string for empty string url', () => {
    expect(buildImageSrcSet('')).toBe('');
  });
});
