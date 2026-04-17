import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Comments API', () => {
  let accessToken: string;
  let testUserId: number;
  let testPostId: number;
  let testCommentId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const testEmail = `tc${ts}@test.local`;
  const testUsername = `tc${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Test@12345',
        display_name: 'Test Comments User',
      });
    expect(registerRes.status).toBe(201);
    testUserId = registerRes.body.data.user.id;

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Test@12345' });
    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.data.tokens.accessToken;

    // Get or create a usable category
    let category = await prisma.categories.findFirst({
      where: { is_active: true, post_permission: 'MEMBER' },
    });
    if (!category) {
      category = await prisma.categories.create({
        data: { name: 'Test Category C', slug: `test-cat-c-${ts}` },
      });
      ownCategoryCreated = true;
    }
    categoryId = category.id;

    // Create a test post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Post For Comment Integration Tests',
        content: 'This post is created to test comment creation and retrieval.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;

    // Pre-create a comment for GET tests
    const commentRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Pre-created comment for GET tests' });
    expect(commentRes.status).toBe(201);
    testCommentId = commentRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    if (testUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { userId: testUserId } });
      await prisma.votes.deleteMany({ where: { userId: testUserId } });
      await prisma.comments.deleteMany({ where: { authorId: testUserId } });
      await prisma.posts.deleteMany({ where: { author_id: testUserId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
    }
    if (ownCategoryCreated) {
      await prisma.categories.deleteMany({ where: { slug: `test-cat-c-${ts}` } });
    }
    await prisma.$disconnect();
  });

  // ─── Create Comment ──────────────────────────────────────────────────────────

  describe('POST /api/v1/posts/:postId/comments', () => {
    it('should create a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'This is a valid test comment.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.content).toBe('This is a valid test comment.');
    });

    it('should return 422 when comment content is empty', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/comments`)
        .send({ content: 'Comment without auth.' });

      expect(res.status).toBe(401);
    });

    it('should return 404 when post does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/posts/999999999/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Comment on non-existent post.' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Get Comment ─────────────────────────────────────────────────────────────

  describe('GET /api/v1/comments/:id', () => {
    it('should get a comment by ID', async () => {
      const res = await request(app).get(`/api/v1/comments/${testCommentId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testCommentId);
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app).get('/api/v1/comments/999999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get Post Comments ────────────────────────────────────────────────────────

  describe('GET /api/v1/posts/:postId/comments', () => {
    it('should return comments for a post', async () => {
      const res = await request(app).get(
        `/api/v1/posts/${testPostId}/comments`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
