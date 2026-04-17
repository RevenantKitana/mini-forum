import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

/**
 * Contract tests for Notification API
 * Tests response shape and HTTP status codes per the OpenAPI contract (docs/openapi.yaml)
 *
 * Endpoints covered:
 *   GET    /api/v1/notifications
 *   GET    /api/v1/notifications/unread-count
 *   PATCH  /api/v1/notifications/read-all
 *   PATCH  /api/v1/notifications/:id/read
 *   DELETE /api/v1/notifications/:id
 *   DELETE /api/v1/notifications
 */
describe('Notifications API Contract', () => {
  let accessToken: string;
  let testUserId: number;

  const ts = Date.now();
  const testEmail = `notif_${ts}@test.local`;
  const testUsername = `notif_${ts}`.slice(0, 20);

  beforeAll(async () => {
    // Register a test user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Test@12345',
        display_name: 'Notification Test User',
      });
    expect(registerRes.status).toBe(201);
    testUserId = registerRes.body.data.user.id;
    accessToken = registerRes.body.data.tokens.accessToken;
  }, 30000);

  afterAll(async () => {
    if (testUserId) {
      await prisma.refresh_tokens.deleteMany({ where: { userId: testUserId } });
      await prisma.notifications.deleteMany({ where: { userId: testUserId } });
      await prisma.users.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  // ─── GET /notifications ─────────────────────────────────────────────────────

  describe('GET /api/v1/notifications', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return paginated notifications with correct response shape', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      // Envelope
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');

      // Data
      expect(Array.isArray(res.body.data)).toBe(true);

      // Pagination meta
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(typeof res.body.pagination.page).toBe('number');
      expect(typeof res.body.pagination.total).toBe('number');
    });

    it('should accept unreadOnly query param without error', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should accept pagination params', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('each notification item should have required camelCase fields', async () => {
      // Seed a notification directly so we can verify the shape
      await prisma.notifications.create({
        data: {
          userId: testUserId,
          type: 'COMMENT',
          isRead: false,
        },
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      const notification = res.body.data[0];
      // Contract: camelCase fields, per snakeToCamel middleware
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('userId');
      expect(notification).toHaveProperty('isRead');
      expect(notification).toHaveProperty('createdAt');
      // Must NOT have snake_case equivalents in the response
      expect(notification).not.toHaveProperty('user_id');
      expect(notification).not.toHaveProperty('is_read');
      expect(notification).not.toHaveProperty('created_at');
    });
  });

  // ─── GET /notifications/unread-count ────────────────────────────────────────

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/notifications/unread-count');
      expect(res.status).toBe(401);
    });

    it('should return correct response shape with numeric count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('count');
      expect(typeof res.body.data.count).toBe('number');
      expect(res.body.data.count).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── PATCH /notifications/read-all ──────────────────────────────────────────

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).patch('/api/v1/notifications/read-all');
      expect(res.status).toBe(401);
    });

    it('should mark all notifications as read and return count', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('count');
      expect(typeof res.body.data.count).toBe('number');
    });

    it('unread-count should be 0 after marking all read', async () => {
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.count).toBe(0);
    });
  });

  // ─── PATCH /notifications/:id/read ──────────────────────────────────────────

  describe('PATCH /api/v1/notifications/:id/read', () => {
    let newNotificationId: number;

    beforeAll(async () => {
      // Create a new unread notification to test individual mark-read
      const n = await prisma.notifications.create({
        data: {
          userId: testUserId,
          type: 'UPVOTE',
          isRead: false,
        },
      });
      newNotificationId = n.id;
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).patch(`/api/v1/notifications/${newNotificationId}/read`);
      expect(res.status).toBe(401);
    });

    it('should mark a single notification as read and return the notification', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${newNotificationId}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');

      const n = res.body.data;
      expect(n).toHaveProperty('id', newNotificationId);
      expect(n).toHaveProperty('isRead', true);
    });

    it('should return 404 for a non-existent notification', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/999999999/read')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 or 404 when accessing another user notification', async () => {
      // Create a notification for a different user
      const otherUser = await prisma.users.create({
        data: {
          email: `other_${ts}@test.local`,
          username: `other_${ts}`.slice(0, 20),
          password_hash: 'hashedpassword',
          display_name: 'Other User',
        },
      });
      const otherNotif = await prisma.notifications.create({
        data: { userId: otherUser.id, type: 'COMMENT', isRead: false },
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${otherNotif.id}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Cleanup
      await prisma.notifications.delete({ where: { id: otherNotif.id } });
      await prisma.users.delete({ where: { id: otherUser.id } });
    });
  });

  // ─── DELETE /notifications/:id ──────────────────────────────────────────────

  describe('DELETE /api/v1/notifications/:id', () => {
    let deletableNotificationId: number;

    beforeAll(async () => {
      const n = await prisma.notifications.create({
        data: {
          userId: testUserId,
          type: 'REPLY',
          isRead: false,
        },
      });
      deletableNotificationId = n.id;
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).delete(`/api/v1/notifications/${deletableNotificationId}`);
      expect(res.status).toBe(401);
    });

    it('should delete a notification and return 204', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${deletableNotificationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should return 404 after deleting the same notification again', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/${deletableNotificationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /notifications ───────────────────────────────────────────────────

  describe('DELETE /api/v1/notifications', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).delete('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('should delete all notifications and return 204', async () => {
      // Seed some notifications first
      await prisma.notifications.createMany({
        data: [
          { userId: testUserId, type: 'COMMENT', isRead: true },
          { userId: testUserId, type: 'UPVOTE', isRead: false },
        ],
      });

      const res = await request(app)
        .delete('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
    });
  });
});
