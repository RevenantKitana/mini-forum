import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Admin API', () => {
  let adminToken: string;
  let adminUserId: number;
  let memberToken: string;
  let memberUserId: number;
  let testPostId: number;
  let testCommentId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const adminEmail = `tadmin${ts}@test.local`;
  const adminUsername = `tadmin${ts}`.slice(0, 20);
  const memberEmail = `tmem${ts}@test.local`;
  const memberUsername = `tmem${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Create member user via public register
    const memberRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: memberEmail,
        username: memberUsername,
        password: 'Test@12345',
        display_name: 'Admin Test Member',
      });
    expect(memberRegRes.status).toBe(201);
    memberUserId = memberRegRes.body.data.user.id;

    const memberLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: memberEmail, password: 'Test@12345' });
    expect(memberLoginRes.status).toBe(200);
    memberToken = memberLoginRes.body.data.tokens.accessToken;

    // Create admin user directly in DB and login
    const hashed = await import('bcrypt').then(b => b.hash('Test@12345', 10));
    const adminUser = await prisma.users.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password_hash: hashed,
        display_name: 'Test Admin User',
        role: 'ADMIN',
        is_active: true,
        is_email_verified: true,
      },
    });
    adminUserId = adminUser.id;

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'Test@12345' });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.tokens.accessToken;

    // Get or create category
    let category = await prisma.categories.findFirst({
      where: { is_active: true, post_permission: 'MEMBER' },
    });
    if (!category) {
      category = await prisma.categories.create({
        data: { name: 'Admin Test Category', slug: `test-cat-adm-${ts}` },
      });
      ownCategoryCreated = true;
    }
    categoryId = category.id;

    // Member creates a post
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Admin Test Post For Integration Tests',
        content: 'This post is created for admin endpoint integration tests.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;

    // Member creates a comment
    const commentRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Admin test comment content here.' });
    expect(commentRes.status).toBe(201);
    testCommentId = commentRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    if (memberUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { user_id: memberUserId } });
      await prisma.votes.deleteMany({ where: { userId: memberUserId } });
      await prisma.comments.deleteMany({ where: { author_id: memberUserId } });
      await prisma.posts.deleteMany({ where: { author_id: memberUserId } });
      await prisma.users.deleteMany({ where: { id: memberUserId } });
    }
    if (adminUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { user_id: adminUserId } });
      await prisma.users.deleteMany({ where: { id: adminUserId } });
    }
    if (ownCategoryCreated) {
      await prisma.categories.deleteMany({ where: { slug: `test-cat-adm-${ts}` } });
    }
    await prisma.$disconnect();
  });

  // ─── Access Control ───────────────────────────────────────────────────────────

  describe('Admin route access control', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return 403 for member (non-admin) requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/dashboard', () => {
    it('should return dashboard stats for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overview');
      expect(res.body.data.overview).toHaveProperty('totalUsers');
      expect(res.body.data.overview).toHaveProperty('totalPosts');
    });

    it('should accept date range query params', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard?startDate=2025-01-01&endDate=2025-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── User Management ──────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/users', () => {
    it('should return paginated user list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should return user detail', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${memberUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', memberUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users/999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Post Management ──────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/posts', () => {
    it('should return paginated posts list for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/posts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/admin/posts/:id/status', () => {
    it('should update post status successfully', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/posts/${testPostId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'HIDDEN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/posts/999999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'HIDDEN' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Comment Management ───────────────────────────────────────────────────────

  describe('GET /api/v1/admin/comments', () => {
    it('should return paginated comment list for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/admin/comments/:id/status', () => {
    it('should update comment status to HIDDEN', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/comments/${testCommentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'HIDDEN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Report Management ────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/reports', () => {
    it('should return paginated reports list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
