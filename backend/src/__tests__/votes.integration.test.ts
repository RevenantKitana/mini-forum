import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Votes API', () => {
  let accessToken: string;
  let testUserId: number;
  let testPostId: number;
  let testCommentId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const testEmail = `tv${ts}@test.local`;
  const testUsername = `tv${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Test@12345',
        display_name: 'Test Votes User',
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
        data: { name: 'Test Category V', slug: `test-cat-v-${ts}` },
      });
      ownCategoryCreated = true;
    }
    categoryId = category.id;

    // Create a test post for voting
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Post For Vote Integration Tests',
        content: 'This post is created to test up/down voting endpoints.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;

    // Create a test comment for voting
    const commentRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Comment for vote test.' });
    expect(commentRes.status).toBe(201);
    testCommentId = commentRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    if (testUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { user_id: testUserId } });
      await prisma.votes.deleteMany({ where: { userId: testUserId } });
      await prisma.comments.deleteMany({ where: { author_id: testUserId } });
      await prisma.posts.deleteMany({ where: { author_id: testUserId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
    }
    if (ownCategoryCreated) {
      await prisma.categories.deleteMany({ where: { slug: `test-cat-v-${ts}` } });
    }
    await prisma.$disconnect();
  });

  // ─── Vote on Post ────────────────────────────────────────────────────────────

  describe('POST /api/v1/posts/:id/vote', () => {
    it('should upvote a post successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('action');
    });

    it('should change vote from up to down', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ voteType: 'down' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with invalid voteType', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ voteType: 'neutral' });

      expect(res.status).toBe(422);
    });
  });

  // ─── Remove Post Vote ────────────────────────────────────────────────────────

  describe('DELETE /api/v1/posts/:id/vote', () => {
    it('should remove a post vote successfully', async () => {
      // Ensure there is a vote to delete
      await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ voteType: 'up' });

      const res = await request(app)
        .delete(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ─── Vote on Comment ─────────────────────────────────────────────────────────

  describe('POST /api/v1/comments/:id/vote', () => {
    it('should upvote a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/vote`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(401);
    });
  });
});
