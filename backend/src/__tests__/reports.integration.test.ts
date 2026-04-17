import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Reports API', () => {
  let reporterToken: string;
  let reporterUserId: number;
  let targetUserId: number;
  let targetToken: string;
  let testPostId: number;
  let testCommentId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const reporterEmail = `rptr${ts}@test.local`;
  const reporterUsername = `rptr${ts}`.slice(0, 20);
  const targetEmail = `tgt${ts}@test.local`;
  const targetUsername = `tgt${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register reporter user
    const reporterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: reporterEmail,
        username: reporterUsername,
        password: 'Test@12345',
        display_name: 'Reporter User',
      });
    expect(reporterRes.status).toBe(201);
    reporterUserId = reporterRes.body.data.user.id;

    const reporterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: reporterEmail, password: 'Test@12345' });
    expect(reporterLogin.status).toBe(200);
    reporterToken = reporterLogin.body.data.tokens.accessToken;

    // Register target user (to be reported)
    const targetRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: targetEmail,
        username: targetUsername,
        password: 'Test@12345',
        display_name: 'Target User',
      });
    expect(targetRes.status).toBe(201);
    targetUserId = targetRes.body.data.user.id;

    const targetLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: targetEmail, password: 'Test@12345' });
    expect(targetLogin.status).toBe(200);
    targetToken = targetLogin.body.data.tokens.accessToken;

    // Get or create usable category
    let category = await prisma.categories.findFirst({
      where: { is_active: true, post_permission: 'MEMBER' },
    });
    if (!category) {
      category = await prisma.categories.create({
        data: { name: 'Test Category R', slug: `test-cat-r-${ts}` },
      });
      ownCategoryCreated = true;
    }
    categoryId = category.id;

    // Target user creates post and comment (to be reported by reporter)
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${targetToken}`)
      .send({
        title: 'Post That Will Be Reported',
        content: 'This post content will be used in the report integration test.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;

    const commentRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${targetToken}`)
      .send({ content: 'Comment that will be reported.' });
    expect(commentRes.status).toBe(201);
    testCommentId = commentRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    const userIds = [reporterUserId, targetUserId].filter(Boolean);
    if (userIds.length) {
      await prisma.reports.deleteMany({
        where: {
          OR: [
            { reporterId: { in: userIds } },
            { reviewedBy: { in: userIds } },
          ],
        },
      });
      await prisma.refresh_tokens.deleteMany({ where: { user_id: { in: userIds } } });
      await prisma.votes.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.comments.deleteMany({ where: { author_id: { in: userIds } } });
      await prisma.posts.deleteMany({ where: { author_id: { in: userIds } } });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }
    if (ownCategoryCreated) {
      await prisma.categories.deleteMany({ where: { slug: `test-cat-r-${ts}` } });
    }
    await prisma.$disconnect();
  });

  // ─── Report Post ─────────────────────────────────────────────────────────────

  describe('POST /api/v1/posts/:id/report', () => {
    it('should report a post successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'spam',
          description: 'This is a spam post used in integration testing.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('reason', 'spam');
    });

    it('should return 422 when reason is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({ description: 'No reason field provided.' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${testPostId}/report`)
        .send({ reason: 'spam' });

      expect(res.status).toBe(401);
    });
  });

  // ─── Report Comment ───────────────────────────────────────────────────────────

  describe('POST /api/v1/comments/:id/report', () => {
    it('should report a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({ reason: 'harassment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/comments/${testCommentId}/report`)
        .send({ reason: 'spam' });

      expect(res.status).toBe(401);
    });
  });

  // ─── Report User ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/users/:id/report', () => {
    it('should report a user successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${targetUserId}/report`)
        .set('Authorization', `Bearer ${reporterToken}`)
        .send({
          reason: 'inappropriate_behavior',
          description: 'User is behaving inappropriately in this integration test.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${targetUserId}/report`)
        .send({ reason: 'spam' });

      expect(res.status).toBe(401);
    });
  });
});
