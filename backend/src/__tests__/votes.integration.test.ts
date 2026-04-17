import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Votes API', () => {
  // Author user creates content; voter user casts votes (prevents self-vote 400)
  let authorToken: string;
  let authorUserId: number;
  let voterToken: string;
  let voterUserId: number;
  let testPostId: number;
  let testCommentId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const authorEmail = `tva${ts}@test.local`;
  const authorUsername = `tva${ts}`.slice(0, 20);
  const voterEmail = `tvb${ts}@test.local`;
  const voterUsername = `tvb${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register author user
    const authorRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: authorEmail,
        username: authorUsername,
        password: 'Test@12345',
        display_name: 'Test Votes Author',
      });
    expect(authorRegRes.status).toBe(201);
    authorUserId = authorRegRes.body.data.user.id;

    const authorLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: authorEmail, password: 'Test@12345' });
    expect(authorLoginRes.status).toBe(200);
    authorToken = authorLoginRes.body.data.tokens.accessToken;

    // Register voter user
    const voterRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: voterEmail,
        username: voterUsername,
        password: 'Test@12345',
        display_name: 'Test Votes Voter',
      });
    expect(voterRegRes.status).toBe(201);
    voterUserId = voterRegRes.body.data.user.id;

    const voterLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: voterEmail, password: 'Test@12345' });
    expect(voterLoginRes.status).toBe(200);
    voterToken = voterLoginRes.body.data.tokens.accessToken;

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

    // Author creates a test post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'Post For Vote Integration Tests',
        content: 'This post is created to test up/down voting endpoints.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;

    // Author creates a test comment
    const commentRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ content: 'Comment for vote test.' });
    expect(commentRes.status).toBe(201);
    testCommentId = commentRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    if (voterUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { user_id: voterUserId } });
      await prisma.votes.deleteMany({ where: { userId: voterUserId } });
      await prisma.users.deleteMany({ where: { id: voterUserId } });
    }
    if (authorUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { user_id: authorUserId } });
      await prisma.votes.deleteMany({ where: { userId: authorUserId } });
      await prisma.comments.deleteMany({ where: { author_id: authorUserId } });
      await prisma.posts.deleteMany({ where: { author_id: authorUserId } });
      await prisma.users.deleteMany({ where: { id: authorUserId } });
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
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('action');
    });

    it('should change vote from up to down', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`)
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
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ voteType: 'neutral' });

      expect(res.status).toBe(422);
    });
  });

  // ─── Remove Post Vote ────────────────────────────────────────────────────────

  describe('DELETE /api/v1/posts/:id/vote', () => {
    it('should remove a post vote successfully', async () => {
      // Ensure there is a vote to delete (voter casts a fresh upvote)
      await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ voteType: 'up' });

      const res = await request(app)
        .delete(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ─── Vote on Comment ─────────────────────────────────────────────────────────

  describe('POST /api/v1/comments/:id/vote', () => {
    it('should upvote a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`)
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

  // ─── Get Vote Status ─────────────────────────────────────────────────────────

  describe('GET /api/v1/posts/:id/vote', () => {
    it('should return current vote for a post when authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/v1/posts/${testPostId}/vote`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/comments/:id/vote', () => {
    it('should return current vote for a comment when authenticated', async () => {
      const res = await request(app)
        .get(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Remove Comment Vote ──────────────────────────────────────────────────────

  describe('DELETE /api/v1/comments/:id/vote', () => {
    it('should remove a comment vote successfully', async () => {
      // Ensure there is a vote to delete
      await request(app)
        .post(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`)
        .send({ voteType: 'up' });

      const res = await request(app)
        .delete(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${voterToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ─── Self-vote Prevention ─────────────────────────────────────────────────────

  describe('Self-vote prevention', () => {
    it('should return 400 when author tries to vote on own post', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/vote`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when author tries to vote on own comment', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/vote`)
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ voteType: 'up' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
