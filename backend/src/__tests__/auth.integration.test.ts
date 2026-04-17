import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/database.js';

describe('Auth API Endpoints', () => {
  // Clean up refresh tokens before each test to avoid unique constraint violations
  beforeEach(async () => {
    try {
      await prisma.refresh_tokens.deleteMany({});
    } catch (error) {
      // Ignore errors if table doesn't exist or is locked
    }
  });

  // Close Prisma connection after all tests to prevent Jest open handle warning
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return tokens and user data with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forum.com',
          password: 'Admin@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('admin@forum.com');
      // User data should be included
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('role');
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forum.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@forum.com',
          password: 'somepassword',
        });

      // API treats non-existent email same as wrong password for security
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 with missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'Admin@123',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Admin@123',
        });

      // Invalid format treated as authentication failure
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      // First, login to get tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forum.com',
          password: 'Admin@123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data?.tokens).toBeDefined();

      const refreshToken = loginRes.body.data.tokens.refreshToken;

      // Now refresh
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@forum.com',
          password: 'Admin@123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data?.tokens).toBeDefined();

      const accessToken = loginRes.body.data.tokens.accessToken;
      const refreshToken = loginRes.body.data.tokens.refreshToken;

      // Logout
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Logout returns 204 No Content
      expect(res.status).toBe(204);
    });
  });
});

/**
 * Brute-force / rate-limit protection tests
 * Each test uses a distinct X-Forwarded-For IP so they don't interfere with
 * the main suite or each other (app.set('trust proxy', 1) is enabled).
 */
describe('Brute-force and rate-limit protection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 429 after exceeding OTP send rate limit (3 per 5 min)', async () => {
    const ip = '10.111.0.1';
    // Exhaust the 3-per-5-min limit; requests may fail for other reasons – that is fine
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/auth/send-otp-register')
        .set('X-Forwarded-For', ip)
        .send({ email: `bruteforce_otp_${i}@test.invalid` });
    }

    const res = await request(app)
      .post('/api/v1/auth/send-otp-register')
      .set('X-Forwarded-For', ip)
      .send({ email: 'bruteforce_otp_extra@test.invalid' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  it('should return 429 after exceeding OTP verify rate limit (10 per 10 min)', async () => {
    const ip = '10.111.0.2';
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/auth/verify-otp-register')
        .set('X-Forwarded-For', ip)
        .send({ email: 'bruteforce_verify@test.invalid', verificationToken: 'faketoken', otp: '000000' });
    }

    const res = await request(app)
      .post('/api/v1/auth/verify-otp-register')
      .set('X-Forwarded-For', ip)
      .send({ email: 'bruteforce_verify@test.invalid', verificationToken: 'faketoken', otp: '000000' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  it('should return 429 after too many failed login attempts (authLimiter 10 per 15 min)', async () => {
    const ip = '10.111.0.3';
    // authLimiter skipSuccessfulRequests=true → only failed requests count
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'admin@forum.com', password: 'wrong_bf_password' });
    }

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'admin@forum.com', password: 'wrong_bf_password' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('retryAfter');
  });

  it('should return 429 after exceeding registration rate limit (5 per 15 min)', async () => {
    const ip = '10.111.0.4';
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/register')
        .set('X-Forwarded-For', ip)
        .send({ email: `rl_reg_${i}@test.invalid`, username: `rl_reg_user${i}`, password: 'Test@1234' });
    }

    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Forwarded-For', ip)
      .send({ email: 'rl_reg_extra@test.invalid', username: 'rl_reg_extra', password: 'Test@1234' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });

  it('should return 429 after exceeding password reset rate limit (5 per 15 min)', async () => {
    const ip = '10.111.0.5';
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/reset-password')
        .set('X-Forwarded-For', ip)
        .send({ email: `rl_reset_${i}@test.invalid`, resetToken: 'faketoken', newPassword: 'New@1234' });
    }

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('X-Forwarded-For', ip)
      .send({ email: 'rl_reset_extra@test.invalid', resetToken: 'faketoken', newPassword: 'New@1234' });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});
