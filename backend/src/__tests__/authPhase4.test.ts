import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import * as sanitizer from '../utils/sanitizer.js';
import * as postService from '../services/postService.js';
import * as commentService from '../services/commentService.js';
import * as userService from '../services/userService.js';
import prisma from '../config/database.js';

describe('Phase 4 Security: Gia cố CSP & Rà soát XSS Sanitization (Hardening)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('4.1 Content Security Policy (CSP) Headers', () => {
    it('should return strict CSP headers with no unsafe-inline in script-src and frame-ancestors none', async () => {
      const response = await request(app).get('/ping');

      expect(response.status).toBe(200);
      const csp = response.headers['content-security-policy'];
      expect(csp).toBeDefined();

      // Check default-src 'self'
      expect(csp).toContain("default-src 'self'");

      // Check script-src 'self' and ensure NO 'unsafe-inline' in script-src
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);

      // Check style-src allows unsafe-inline for CSS
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");

      // Check img-src includes self, data:, ik.imagekit.io, https:
      expect(csp).toContain("img-src 'self' data: https://ik.imagekit.io https:");

      // Check object-src 'none' and frame-ancestors 'none'
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should return X-Frame-Options and X-Content-Type-Options headers', async () => {
      const response = await request(app).get('/ping');

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('4.2 Input Sanitization & XSS Prevention (SEC-03)', () => {
    it('SEC-03: sanitizeHtml should strip <script>alert(1)</script> tags', () => {
      const dirty = 'Hello <script>alert(1)</script> World!';
      const clean = sanitizer.sanitizeHtml(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert(1)');
      expect(clean).toContain('Hello  World!');
    });

    it('sanitizeHtml should strip onerror and other inline event handlers', () => {
      const dirty = '<img src="invalid.jpg" onerror="alert(\'XSS\')" alt="Test" />';
      const clean = sanitizer.sanitizeHtml(dirty);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('src="invalid.jpg"');
      expect(clean).toContain('alt="Test"');
    });

    it('sanitizeHtml should strip javascript: pseudo-protocol in links', () => {
      const dirty = '<a href="javascript:alert(document.cookie)">Click Me</a>';
      const clean = sanitizer.sanitizeHtml(dirty);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Click Me');
    });

    it('sanitizeHtml should strip <iframe> and <object> tags', () => {
      const dirty = '<p>Normal text</p><iframe src="https://attacker.com/steal"></iframe>';
      const clean = sanitizer.sanitizeHtml(dirty);
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('attacker.com');
      expect(clean).toContain('<p>Normal text</p>');
    });

    it('sanitizeHtml should preserve safe rich text tags (bold, italic, code, list, links)', () => {
      const safe = '<p><strong>Bold</strong> and <em>Italic</em> with <code>code</code> and <a href="https://example.com">link</a></p>';
      const clean = sanitizer.sanitizeHtml(safe);
      expect(clean).toContain('<strong>Bold</strong>');
      expect(clean).toContain('<em>Italic</em>');
      expect(clean).toContain('<code>code</code>');
      expect(clean).toContain('<a href="https://example.com">link</a>');
    });

    it('sanitizeText should strip all HTML tags for plain text fields', () => {
      const dirtyTitle = '<h1>Title with <script>alert(1)</script> <b>formatting</b></h1>';
      const clean = sanitizer.sanitizeText(dirtyTitle);
      expect(clean).toBe('Title with  formatting');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).not.toContain('script');
    });

    it('sanitizeBlocks should sanitize content of TEXT blocks', () => {
      const blocks = [
        { type: 'TEXT', content: 'Safe text <script>evil()</script>', sort_order: 1 },
        { type: 'IMAGE', content: null, sort_order: 2 },
      ];
      const sanitized = sanitizer.sanitizeBlocks(blocks);
      expect(sanitized[0].content).not.toContain('<script>');
      expect(sanitized[0].content).not.toContain('evil()');
      expect(sanitized[0].content).toBe('Safe text ');
      expect(sanitized[1].content).toBeNull();
    });
  });

  describe('4.3 Service-level Data Sanitization before DB Persistence', () => {
    it('createComment should sanitize comment content before persisting to database', async () => {
      const postId = 10;
      const authorId = 1;

      vi.spyOn(prisma.posts, 'findUnique').mockResolvedValue({
        id: postId,
        title: 'Sample Post',
        author_id: 2,
        is_locked: false,
        status: 'PUBLISHED',
        categories: {
          id: 1,
          name: 'General',
          comment_permission: 'ALL',
        },
      } as any);

      vi.spyOn(prisma.users, 'findUnique').mockResolvedValue({
        id: authorId,
        display_name: 'Test Author',
        username: 'testauthor',
      } as any);

      let createdCommentData: any = null;
      vi.spyOn(prisma.comments, 'create').mockImplementation((args: any) => {
        createdCommentData = args.data;
        return Promise.resolve({
          id: 100,
          ...args.data,
          upvote_count: 0,
          downvote_count: 0,
          status: 'VISIBLE',
          is_edited: false,
          created_at: new Date(),
          updated_at: new Date(),
          users: {
            id: authorId,
            username: 'testauthor',
            display_name: 'Test Author',
            role: 'MEMBER',
          },
        }) as any;
      });

      vi.spyOn(prisma.posts, 'update').mockResolvedValue({} as any);

      const maliciousInput = {
        content: 'Nice comment! <script>alert("hacked")</script><img src="x" onerror="steal()"/>',
      };

      await commentService.createComment(postId, maliciousInput, authorId, 'MEMBER');

      expect(createdCommentData).toBeDefined();
      expect(createdCommentData.content).not.toContain('<script>');
      expect(createdCommentData.content).not.toContain('onerror');
      expect(createdCommentData.content).toContain('Nice comment!');
    });

    it('updateProfile should sanitize display_name and bio before DB update', async () => {
      const userId = 5;
      let updatedData: any = null;

      vi.spyOn(prisma.users, 'update').mockImplementation((args: any) => {
        updatedData = args.data;
        return Promise.resolve({
          id: userId,
          ...args.data,
        }) as any;
      });

      const maliciousProfile = {
        display_name: '<b>Hacker</b><script>alert(1)</script>',
        bio: 'My Bio <iframe src="http://evil.com"></iframe><script>bad()</script>',
      };

      await userService.updateProfile(userId, maliciousProfile);

      expect(updatedData).toBeDefined();
      expect(updatedData.display_name).toBe('Hacker');
      expect(updatedData.bio).not.toContain('<iframe');
      expect(updatedData.bio).not.toContain('<script>');
      expect(updatedData.bio).toContain('My Bio ');
    });

    it('createPost should sanitize title, content, and text blocks before DB insert', async () => {
      const authorId = 1;

      vi.spyOn(prisma.categories, 'findUnique').mockResolvedValue({
        id: 1,
        name: 'General',
        is_active: true,
        post_permission: 'ALL',
      } as any);

      vi.spyOn(prisma.posts, 'findUnique').mockResolvedValue(null); // Slug uniqueness check
      vi.spyOn(prisma.tags, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.tags, 'upsert').mockResolvedValue({ id: 1, name: 'tag1', slug: 'tag1', usage_count: 1 } as any);

      let createdPostData: any = null;
      vi.spyOn(prisma.posts, 'create').mockImplementation((args: any) => {
        createdPostData = args.data;
        return Promise.resolve({
          id: 50,
          ...args.data,
          author_id: authorId,
          created_at: new Date(),
          updated_at: new Date(),
          categories: { id: 1, name: 'General', slug: 'general', color: '#000', view_permission: 'ALL', post_permission: 'ALL', comment_permission: 'ALL' },
          users: { id: authorId, username: 'user1', display_name: 'User 1', role: 'MEMBER' },
          post_tags: [],
          post_blocks: [],
          post_media: [],
          _count: { comments: 0, votes: 0, bookmarks: 0 },
        }) as any;
      });

      vi.spyOn(prisma.categories, 'update').mockResolvedValue({} as any);

      const maliciousPost = {
        title: 'Title with <script>alert(1)</script> tags',
        content: 'Post body with <script>eval("evil")</script><a href="javascript:attack()">link</a>',
        category_id: 1,
        tags: ['tag1'],
        status: 'PUBLISHED' as const,
        use_block_layout: true,
        blocks: [
          { type: 'TEXT' as const, content: 'Block 1 <script>bad()</script>', sort_order: 1 },
        ],
      };

      await postService.createPost(maliciousPost, authorId, 'MEMBER');

      expect(createdPostData).toBeDefined();
      expect(createdPostData.title).toBe('Title with  tags');
      expect(createdPostData.content).not.toContain('<script>');
      expect(createdPostData.content).not.toContain('javascript:');
      expect(createdPostData.post_blocks.create[0].content).not.toContain('<script>');
      expect(createdPostData.post_blocks.create[0].content).toBe('Block 1 ');
    });
  });
});
