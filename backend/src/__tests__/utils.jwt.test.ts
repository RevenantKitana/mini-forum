import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT Utils', () => {
  const testPayload: TokenPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'member',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should encode the payload in the token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const pair = generateTokenPair(testPayload);
      
      expect(pair.accessToken).toBeTruthy();
      expect(pair.refreshToken).toBeTruthy();
      expect(pair.accessToken).not.toBe(pair.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.role).toBe(testPayload.role);
    });

    it('should return null for invalid token', () => {
      const result = verifyAccessToken('invalid.token.here');
      expect(result).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateAccessToken(testPayload);
      const tampered = token.slice(0, -1) + 'x';
      const result = verifyAccessToken(tampered);
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(testPayload.userId);
    });

    it('should return null for invalid refresh token', () => {
      const result = verifyRefreshToken('invalid.token.here');
      expect(result).toBeNull();
    });
  });
});
