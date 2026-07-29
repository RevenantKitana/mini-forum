import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPostsCount, mockPostsFindMany } = vi.hoisted(() => ({
  mockPostsCount: vi.fn(),
  mockPostsFindMany: vi.fn(),
}));

vi.mock('../config/database.js', () => ({
  default: {
    posts: {
      count: mockPostsCount,
      findMany: mockPostsFindMany,
    },
  },
}));

vi.mock('../services/blockService.js', () => ({
  getBlockedUserIds: vi.fn(),
}));

vi.mock('../services/postMediaService.js', () => ({
  deleteAllPostMedia: vi.fn(),
}));

vi.mock('../services/blockValidationService.js', () => ({
  validateBlocks: vi.fn(),
}));

import { getRandomPublicPost } from '../services/postService.js';

describe('getRandomPublicPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('returns one public post for guests with a random offset', async () => {
    mockPostsCount.mockResolvedValueOnce(10);
    mockPostsFindMany.mockResolvedValueOnce([
      {
        id: 42,
        title: 'Random home box post',
        excerpt: 'Preview text',
        author_id: 1,
        category_id: 1,
        view_count: 5,
        upvote_count: 3,
        downvote_count: 0,
        comment_count: 1,
        status: 'PUBLISHED',
        is_pinned: false,
        pin_type: null,
        is_locked: false,
        use_block_layout: true,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
        users: {
          id: 1,
          username: 'alice',
          display_name: 'Alice',
          avatar_preview_url: null,
          avatar_standard_url: null,
          role: 'MEMBER',
          reputation: 10,
        },
        categories: {
          id: 1,
          name: 'General',
          slug: 'general',
          color: '#111111',
          view_permission: 'ALL',
          post_permission: 'ALL',
          comment_permission: 'ALL',
        },
        post_tags: [],
        post_media: [],
        post_blocks: [],
        _count: { post_media: 0 },
      },
    ]);

    const result = await getRandomPublicPost();

    expect(mockPostsCount).toHaveBeenCalledWith({
      where: {
        status: 'PUBLISHED',
        categories: { view_permission: 'ALL' },
      },
    });
    expect(mockPostsFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          categories: { view_permission: 'ALL' },
        },
        skip: 5,
        take: 1,
      })
    );
    expect(result).toMatchObject({
      title: 'Random home box post',
      category: 'General',
      tags: [],
      contentPreview: expect.any(String),
      link: expect.stringContaining('/posts/42'),
    });
  });
});
