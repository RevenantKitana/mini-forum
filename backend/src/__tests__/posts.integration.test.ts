import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Posts API', () => {
  let accessToken: string;
  let testUserId: number;
  let testPostId: number;
  let categoryId: number;
  let ownCategoryCreated = false;

  const ts = Date.now();
  const testEmail = `tp${ts}@test.local`;
  const testUsername = `tp${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Test@12345',
        display_name: 'Test Posts User',
      });
    expect(registerRes.status).toBe(201);
    testUserId = registerRes.body.data.user.id;

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'Test@12345' });
    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.data.tokens.accessToken;

    // Get or create a category that members can post in
    let category = await prisma.categories.findFirst({
      where: { is_active: true, post_permission: 'MEMBER' },
    });
    if (!category) {
      category = await prisma.categories.create({
        data: {
          name: 'Test Category',
          slug: `test-cat-${ts}`,
        },
      });
      ownCategoryCreated = true;
    }
    categoryId = category.id;

    // Pre-create a post for GET tests
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Pre-created Post for GET Tests',
        content: 'This content is pre-created in beforeAll for use in GET tests.',
        category_id: categoryId,
      });
    expect(postRes.status).toBe(201);
    testPostId = postRes.body.data.id;
  }, 30000);

  afterAll(async () => {
    if (testUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { userId: testUserId } });
      await prisma.votes.deleteMany({ where: { userId: testUserId } });
      await prisma.comments.deleteMany({ where: { authorId: testUserId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
    }
    if (ownCategoryCreated) {
      await prisma.categories.deleteMany({ where: { slug: `test-cat-${ts}` } });
    }
    await prisma.$disconnect();
  });

  // ─── Create Post ────────────────────────────────────────────────────────────

  describe('POST /api/v1/posts', () => {
    it('should create a post successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'A Valid Post Title For Integration Test',
          content: 'This is valid content that is at least twenty characters long.',
          category_id: categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('A Valid Post Title For Integration Test');
    });

    it('should return 422 when title is too short', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Short',
          content: 'Content that is at least 20 characters long for validation.',
          category_id: categoryId,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 422 when content is too short', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'A Valid Title That Is Long Enough',
          content: 'Too short.',
          category_id: categoryId,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'A Post Without Auth Token Here',
          content: 'Content that should fail authentication check because no token.',
          category_id: categoryId,
        });

      expect(res.status).toBe(401);
    });
  });

  // ─── Get Post ────────────────────────────────────────────────────────────────

  describe('GET /api/v1/posts/:id', () => {
    it('should get a post by ID successfully', async () => {
      const res = await request(app).get(`/api/v1/posts/${testPostId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testPostId);
      expect(res.body.data).toHaveProperty('title');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/v1/posts/999999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Get Posts List ──────────────────────────────────────────────────────────

  describe('GET /api/v1/posts', () => {
    it('should return paginated list of posts', async () => {
      const res = await request(app).get('/api/v1/posts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });
  });
});
